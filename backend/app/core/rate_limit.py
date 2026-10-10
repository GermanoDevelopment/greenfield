"""Rate limiting e lockout de login em memória.

O estado vive no processo: com vários workers/réplicas cada um conta
separadamente. Basta para o MVP; troque por Redis ao escalar horizontalmente.
"""

import math
import time
from collections import deque
from collections.abc import Callable

from fastapi import HTTPException, Request, status

from app.core.config import Settings, get_settings


def _too_many(retry_after: float, detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail=detail,
        headers={"Retry-After": str(max(1, math.ceil(retry_after)))},
    )


class SlidingWindow:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = {}

    def hit(self, key: str, limit: int, window_s: float, now: float) -> float | None:
        """Registra um hit; retorna os segundos até liberar se o limite estourou."""
        hits = self._hits.setdefault(key, deque())
        while hits and hits[0] <= now - window_s:
            hits.popleft()
        if len(hits) >= limit:
            return hits[0] + window_s - now
        hits.append(now)
        return None

    def clear(self) -> None:
        self._hits.clear()


class RateLimiter:
    """Dependency FastAPI: limita requisições por IP dentro de um escopo."""

    def __init__(self, scope: str, limit: Callable[[Settings], int], window_s: float = 60):
        self.scope = scope
        self.limit = limit
        self.window_s = window_s
        self.window = SlidingWindow()

    async def __call__(self, request: Request) -> None:
        settings = get_settings()
        if not settings.rate_limit_enabled:
            return
        client_ip = request.client.host if request.client else "unknown"
        retry_after = self.window.hit(
            f"{self.scope}:{client_ip}", self.limit(settings), self.window_s, time.monotonic()
        )
        if retry_after is not None:
            raise _too_many(retry_after, "Muitas requisições, tente novamente mais tarde")


class LoginLockout:
    """Bloqueia um e-mail após falhas seguidas de login."""

    def __init__(self) -> None:
        self._failures: dict[str, deque[float]] = {}
        self._locked_until: dict[str, float] = {}

    def check(self, email: str) -> None:
        settings = get_settings()
        if not settings.rate_limit_enabled:
            return
        until = self._locked_until.get(email)
        if until is None:
            return
        now = time.monotonic()
        if until > now:
            raise _too_many(until - now, "Conta temporariamente bloqueada por tentativas falhas")
        del self._locked_until[email]

    def record_failure(self, email: str) -> None:
        settings = get_settings()
        if not settings.rate_limit_enabled:
            return
        now = time.monotonic()
        window_s = settings.login_lockout_minutes * 60
        failures = self._failures.setdefault(email, deque())
        while failures and failures[0] <= now - window_s:
            failures.popleft()
        failures.append(now)
        if len(failures) >= settings.login_max_failures:
            self._locked_until[email] = now + window_s
            del self._failures[email]

    def record_success(self, email: str) -> None:
        self._failures.pop(email, None)

    def clear(self) -> None:
        self._failures.clear()
        self._locked_until.clear()


auth_rate_limit = RateLimiter("auth", lambda s: s.rate_limit_auth_per_minute)
webhook_rate_limit = RateLimiter("webhook", lambda s: s.rate_limit_webhook_per_minute)
github_rate_limit = RateLimiter("github", lambda s: s.rate_limit_github_per_minute)
login_lockout = LoginLockout()


def reset_rate_limits() -> None:
    for limiter in (auth_rate_limit, webhook_rate_limit, github_rate_limit):
        limiter.window.clear()
    login_lockout.clear()
