from fastapi import APIRouter
from app.database import get_db_connection
from app.models import StatsResponse

router = APIRouter(prefix="/api/stats", tags=["Stats"])

@router.get("", response_model=StatsResponse)
def get_dashboard_stats():
    """
    Computes genuine real-time statistics from the SQLite database
    for the frontend dashboard metric cards.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Total registered APIs
    cursor.execute("SELECT COUNT(*) FROM apis")
    total_apis = cursor.fetchone()[0]

    # Total completed scans
    cursor.execute("SELECT COUNT(*) FROM scan_reports")
    total_scans = cursor.fetchone()[0]

    # Open findings (warnings and failures)
    cursor.execute("SELECT COUNT(*) FROM scan_findings WHERE status IN ('FAIL', 'WARNING')")
    total_findings = cursor.fetchone()[0]

    # Secure checks passed
    cursor.execute("SELECT COUNT(*) FROM scan_findings WHERE status = 'PASS'")
    total_secure = cursor.fetchone()[0]

    conn.close()

    return {
        "total_apis": total_apis,
        "total_scans": total_scans,
        "total_findings": total_findings,
        "total_secure": total_secure
    }
