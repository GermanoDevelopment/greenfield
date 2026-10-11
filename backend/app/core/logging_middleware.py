import contextvars
import logging
import time
import uuid
from collections.abc import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

request_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="-")

logger = logging.getLogger("greenfield.access")


class RequestIdFilter(logging.Filter):
    """Logging filter that injects the current request ID into log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get("-")
        return True


def setup_logging(log_level: str = "INFO") -> None:
    """Configures structured root logging with request ID awareness."""
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [req:%(request_id)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    handler.addFilter(RequestIdFilter())

    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    # Replace existing handlers to avoid duplicates
    root_logger.handlers = [handler]


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware that assigns a request ID and logs request lifecycle and performance."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check incoming X-Request-ID or generate new UUID
        req_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
        token = request_id_ctx.set(req_id)

        start_time = time.perf_counter()
        client_host = request.client.host if request.client else "unknown"

        logger.info(
            "%s %s started (client: %s)",
            request.method,
            request.url.path,
            client_host,
        )

        try:
            response = await call_next(request)
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            response.headers["X-Request-ID"] = req_id
            logger.info(
                "%s %s completed %d in %.2fms",
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
            )
            return response
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            logger.error(
                "%s %s failed in %.2fms: %s",
                request.method,
                request.url.path,
                duration_ms,
                exc,
                exc_info=True,
            )
            raise
        finally:
            request_id_ctx.reset(token)
