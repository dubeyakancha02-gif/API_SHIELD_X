from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from app.database import get_db_connection
from app.models import ApiCreate, ApiUpdate, ApiResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/apis", tags=["APIs"])

@router.get("", response_model=List[ApiResponse])
def list_apis(current_user: dict = Depends(get_current_user)):
    """
    Fetch all registered APIs belonging to the authenticated user or legacy records.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, url, environment, description, created_at FROM apis WHERE user_id = ? OR user_id IS NULL ORDER BY id DESC",
        (current_user["id"],)
    )
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

@router.post("", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
def create_api(payload: ApiCreate, current_user: dict = Depends(get_current_user)):
    """
    Register a new API endpoint associated with the authenticated user.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO apis (name, url, environment, description, user_id) VALUES (?, ?, ?, ?, ?)",
        (payload.name, payload.url, payload.environment, payload.description, current_user["id"])
    )
    new_id = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT id, name, url, environment, description, created_at FROM apis WHERE id = ?", (new_id,))
    row = cursor.fetchone()
    conn.close()

    return dict(row)

@router.put("/{api_id}", response_model=ApiResponse)
def update_api(api_id: int, payload: ApiUpdate, current_user: dict = Depends(get_current_user)):
    """
    Update an existing registered API endpoint.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM apis WHERE id = ?", (api_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="API endpoint not found")

    # Keep existing values if not specified in update
    name = payload.name if payload.name is not None else existing["name"]
    url = payload.url if payload.url is not None else existing["url"]
    environment = payload.environment if payload.environment is not None else existing["environment"]
    description = payload.description if payload.description is not None else existing["description"]

    cursor.execute(
        "UPDATE apis SET name = ?, url = ?, environment = ?, description = ? WHERE id = ?",
        (name, url, environment, description, api_id)
    )
    conn.commit()

    cursor.execute("SELECT id, name, url, environment, description, created_at FROM apis WHERE id = ?", (api_id,))
    updated_row = cursor.fetchone()
    conn.close()

    return dict(updated_row)

@router.delete("/{api_id}", status_code=status.HTTP_200_OK)
def delete_api(api_id: int, current_user: dict = Depends(get_current_user)):
    """
    Remove an API endpoint and its cascade associations from SQLite.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM apis WHERE id = ?", (api_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="API endpoint not found")

    cursor.execute("DELETE FROM apis WHERE id = ?", (api_id,))
    conn.commit()
    conn.close()

    return {"message": f"API #{api_id} deleted successfully"}
