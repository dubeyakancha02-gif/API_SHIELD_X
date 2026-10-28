from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from app.database import get_db_connection
from app.models import ScanRequest, ScanReportResponse, FindingModel
from app.scanner import perform_security_scan
from app.auth import get_current_user

router = APIRouter(prefix="/api/scans", tags=["Scans"])

@router.post("/run", response_model=ScanReportResponse, status_code=status.HTTP_201_CREATED)
async def run_scan(payload: ScanRequest, current_user: dict = Depends(get_current_user)):
    """
    Executes a defensive security audit against the target URL and persists
    the report and individual findings in the SQLite database associated with the user.
    """
    target_url = payload.url.strip()
    if not target_url.startswith("http://") and not target_url.startswith("https://"):
        raise HTTPException(status_code=400, detail="Target URL must start with http:// or https://")

    # Perform the passive audit
    scan_result = await perform_security_scan(target_url)

    conn = get_db_connection()
    cursor = conn.cursor()

    # Look up API name if api_id was provided
    api_name = None
    if payload.api_id:
        cursor.execute("SELECT name FROM apis WHERE id = ?", (payload.api_id,))
        api_row = cursor.fetchone()
        if api_row:
            api_name = api_row["name"]

    # Insert into scan_reports table with authenticated user_id
    cursor.execute("""
        INSERT INTO scan_reports (
            api_id, scanned_url, total_checks, passed_checks, warning_checks, failed_checks, overall_status, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        payload.api_id,
        target_url,
        scan_result["total_checks"],
        scan_result["passed_checks"],
        scan_result["warning_checks"],
        scan_result["failed_checks"],
        scan_result["overall_status"],
        current_user["id"]
    ))
    report_id = cursor.lastrowid

    # Insert each individual finding into scan_findings table
    for finding in scan_result["findings"]:
        cursor.execute("""
            INSERT INTO scan_findings (
                report_id, check_key, title, status, severity, evidence, description, recommendation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            report_id,
            finding["check_key"],
            finding["title"],
            finding["status"],
            finding["severity"],
            finding["evidence"],
            finding["description"],
            finding["recommendation"]
        ))

    conn.commit()

    # Fetch created report timestamp
    cursor.execute("SELECT scanned_at FROM scan_reports WHERE id = ?", (report_id,))
    report_row = cursor.fetchone()
    conn.close()

    return {
        "id": report_id,
        "api_id": payload.api_id,
        "api_name": api_name,
        "scanned_url": target_url,
        "scanned_at": report_row["scanned_at"] if report_row else None,
        "total_checks": scan_result["total_checks"],
        "passed_checks": scan_result["passed_checks"],
        "warning_checks": scan_result["warning_checks"],
        "failed_checks": scan_result["failed_checks"],
        "overall_status": scan_result["overall_status"],
        "findings": scan_result["findings"]
    }

@router.get("", response_model=List[ScanReportResponse])
def list_reports(current_user: dict = Depends(get_current_user)):
    """
    Returns historical scan reports for the user or legacy records, joining API names where registered.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            r.id, 
            r.api_id, 
            a.name AS api_name,
            r.scanned_url, 
            r.scanned_at, 
            r.total_checks, 
            r.passed_checks, 
            r.warning_checks, 
            r.failed_checks, 
            r.overall_status
        FROM scan_reports r
        LEFT JOIN apis a ON r.api_id = a.id
        WHERE r.user_id = ? OR r.user_id IS NULL
        ORDER BY r.id DESC
    """, (current_user["id"],))
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

@router.get("/{report_id}", response_model=ScanReportResponse)
def get_report_details(report_id: int, current_user: dict = Depends(get_current_user)):
    """
    Retrieves full details and all associated findings for a specific report.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            r.id, 
            r.api_id, 
            a.name AS api_name,
            r.scanned_url, 
            r.scanned_at, 
            r.total_checks, 
            r.passed_checks, 
            r.warning_checks, 
            r.failed_checks, 
            r.overall_status
        FROM scan_reports r
        LEFT JOIN apis a ON r.api_id = a.id
        WHERE r.id = ? AND (r.user_id = ? OR r.user_id IS NULL)
    """, (report_id, current_user["id"]))
    report_row = cursor.fetchone()

    if not report_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Scan report not found")

    cursor.execute("""
        SELECT check_key, title, status, severity, evidence, description, recommendation
        FROM scan_findings
        WHERE report_id = ?
        ORDER BY id ASC
    """, (report_id,))
    finding_rows = cursor.fetchall()
    conn.close()

    result = dict(report_row)
    result["findings"] = [dict(f) for f in finding_rows]
    return result

@router.delete("/{report_id}", status_code=status.HTTP_200_OK)
def delete_report(report_id: int, current_user: dict = Depends(get_current_user)):
    """
    Deletes a specific historical scan report.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM scan_reports WHERE id = ?", (report_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Scan report not found")

    cursor.execute("DELETE FROM scan_reports WHERE id = ?", (report_id,))
    conn.commit()
    conn.close()

    return {"message": f"Scan report #{report_id} deleted successfully"}
