from fastapi import APIRouter, Depends
from app.database import get_db_connection
from app.models import StatsResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["Stats"])

@router.get("", response_model=StatsResponse)
def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """
    Computes genuine real-time statistics from the SQLite database
    for the frontend dashboard metric cards for the authenticated user.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Total registered APIs
    cursor.execute("SELECT COUNT(*) FROM apis WHERE user_id = ? OR user_id IS NULL", (current_user["id"],))
    total_apis = cursor.fetchone()[0]

    # Total completed scans
    cursor.execute("SELECT COUNT(*) FROM scan_reports WHERE user_id = ? OR user_id IS NULL", (current_user["id"],))
    total_scans = cursor.fetchone()[0]

    # Open findings (warnings and failures)
    cursor.execute("""
        SELECT COUNT(*) FROM scan_findings sf
        JOIN scan_reports sr ON sf.report_id = sr.id
        WHERE (sr.user_id = ? OR sr.user_id IS NULL) AND sf.status IN ('FAIL', 'WARNING')
    """, (current_user["id"],))
    total_findings = cursor.fetchone()[0]

    # Secure checks passed
    cursor.execute("""
        SELECT COUNT(*) FROM scan_findings sf
        JOIN scan_reports sr ON sf.report_id = sr.id
        WHERE (sr.user_id = ? OR sr.user_id IS NULL) AND sf.status = 'PASS'
    """, (current_user["id"],))
    total_secure = cursor.fetchone()[0]

    conn.close()

    return {
        "total_apis": total_apis,
        "total_scans": total_scans,
        "total_findings": total_findings,
        "total_secure": total_secure
    }
