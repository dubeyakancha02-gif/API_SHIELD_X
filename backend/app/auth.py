import os
import time
import secrets
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from collections import defaultdict
from fastapi import Request, HTTPException, status
from app.database import get_db_connection

SESSION_COOKIE_NAME = "apishield_session"
SESSION_DURATION_HOURS = 24

# In-memory tracking for brute-force rate limiting: client_ip -> list of failure timestamps
_failed_attempts = defaultdict(list)
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_SECONDS = 300  # 5 minutes

def hash_password(password: str) -> str:
    """
    Hashes a plaintext password using bcrypt with 12 salt rounds.
    """
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plaintext password against a bcrypt hash in constant time.
    """
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def check_login_rate_limit(client_ip: str):
    """
    Enforces rate-limiting on login: locks out an IP if it has >= 5 failed attempts in 5 minutes.
    """
    now = time.time()
    _failed_attempts[client_ip] = [t for t in _failed_attempts[client_ip] if now - t < LOCKOUT_SECONDS]
    if len(_failed_attempts[client_ip]) >= MAX_FAILED_ATTEMPTS:
        remaining = int(LOCKOUT_SECONDS - (now - _failed_attempts[client_ip][0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please wait {max(1, remaining)} seconds before trying again."
        )

def record_failed_attempt(client_ip: str):
    """Records a failed login attempt timestamp for an IP."""
    _failed_attempts[client_ip].append(time.time())

def clear_failed_attempts(client_ip: str):
    """Clears failed login attempt history for an IP on successful login."""
    if client_ip in _failed_attempts:
        del _failed_attempts[client_ip]

def create_session(user_id: int, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> str:
    """
    Generates a cryptographically secure 256-bit session token and records it in SQLite.
    """
    session_id = secrets.token_hex(32)
    expires_at = datetime.utcnow() + timedelta(hours=SESSION_DURATION_HOURS)
    expires_str = expires_at.strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO sessions (session_id, user_id, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
        (session_id, user_id, expires_str, ip_address, user_agent)
    )
    conn.commit()
    conn.close()
    return session_id

def get_user_from_session(session_id: str) -> Optional[dict]:
    """
    Validates a session token from the SQLite database and checks expiration.
    """
    if not session_id:
        return None

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.email, u.full_name, u.role, s.expires_at 
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_id = ?
    """, (session_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return None

    expires_at_str = row["expires_at"]
    try:
        expires_at = datetime.strptime(expires_at_str, "%Y-%m-%d %H:%M:%S")
    except Exception:
        expires_at = datetime.utcnow()

    # Invalidate if expired
    if datetime.utcnow() > expires_at:
        cursor.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
        conn.commit()
        conn.close()
        return None

    user = {
        "id": row["id"],
        "email": row["email"],
        "full_name": row["full_name"],
        "role": row["role"]
    }
    conn.close()
    return user

def destroy_session(session_id: str) -> None:
    """
    Invalidates and removes an active server-side session from SQLite.
    """
    if not session_id:
        return
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
    conn.commit()
    conn.close()

async def get_current_user(request: Request) -> dict:
    """
    FastAPI dependency that enforces authentication and CSRF protection on protected routes.
    """
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in."
        )

    user = get_user_from_session(session_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please sign in again."
        )

    # CSRF protection: check custom header on mutating requests
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        requested_with = request.headers.get("X-Requested-With")
        if requested_with != "XMLHttpRequest":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF validation failed. Missing X-Requested-With header."
            )

    return user
