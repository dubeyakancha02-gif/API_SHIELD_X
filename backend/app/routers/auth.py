from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from app.database import get_db_connection
from app.models import LoginRequest, AuthResponse, UserResponse
from app.auth import (
    verify_password,
    create_session,
    destroy_session,
    get_current_user,
    check_login_rate_limit,
    record_failed_attempt,
    clear_failed_attempts,
    SESSION_COOKIE_NAME,
    SESSION_DURATION_HOURS
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, request: Request, response: Response):
    """
    Authenticates administrator credentials, enforces rate limiting,
    and issues a server-managed HttpOnly session cookie.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    check_login_rate_limit(client_ip)

    email = payload.email.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, hashed_password, full_name, role FROM users WHERE LOWER(email) = ?", (email,))
    user_row = cursor.fetchone()
    conn.close()

    if not user_row or not verify_password(payload.password, user_row["hashed_password"]):
        record_failed_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Success: clear failure counter
    clear_failed_attempts(client_ip)

    user_agent = request.headers.get("User-Agent", "Unknown")[:255]
    session_id = create_session(user_row["id"], ip_address=client_ip, user_agent=user_agent)

    # Dynamically determine Secure flag based on connection protocol
    is_secure = request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https"

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        httponly=True,
        samesite="lax",
        secure=is_secure,
        max_age=SESSION_DURATION_HOURS * 3600,
        path="/"
    )

    return {
        "user": {
            "id": user_row["id"],
            "email": user_row["email"],
            "full_name": user_row["full_name"],
            "role": user_row["role"]
        },
        "message": "Login successful"
    }

@router.get("/me", response_model=AuthResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """
    Session bootstrap endpoint: verifies the active HttpOnly cookie
    and returns current user profile to initialize frontend state.
    """
    return {
        "user": current_user,
        "message": "Session valid"
    }

@router.post("/logout")
def logout(request: Request, response: Response):
    """
    Invalidates the active session record in SQLite and deletes the cookie.
    """
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if session_id:
        destroy_session(session_id)

    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/")
    return {"message": "Logged out successfully"}
