import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt

from app.core.config import get_settings


class TokenError(Exception):
    pass


def hash_password(password: str) -> str:
    """Gera hash seguro com salt aleatório usando PBKDF2 HMAC SHA-256."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 100_000)
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str | None) -> bool:
    """Valida a senha contra o hash armazenado em tempo constante."""
    if not hashed_password or "$" not in hashed_password:
        return False
    try:
        salt, key_hex = hashed_password.split("$", 1)
        expected_key = hashlib.pbkdf2_hmac(
            "sha256", plain_password.encode("utf-8"), bytes.fromhex(salt), 100_000
        )
        return secrets.compare_digest(expected_key.hex(), key_hex)
    except Exception:
        return False


def create_access_token(
    user_id: int,
    username: str,
    email: str | None = None,
    role: str | None = None,
) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "username": username,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expiration_minutes),
    }
    if email:
        payload["email"] = email
    if role:
        payload["role"] = role
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError as e:
        raise TokenError("Token expired") from e
    except jwt.InvalidTokenError as e:
        raise TokenError("Invalid token") from e
