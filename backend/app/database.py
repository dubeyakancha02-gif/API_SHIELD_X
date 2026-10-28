import sqlite3
import os
from contextlib import contextmanager

# Determine database path relative to backend folder or from environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.environ.get("DATABASE_PATH", os.path.join(BASE_DIR, "apishield.db"))
TURSO_URL = os.environ.get("TURSO_DATABASE_URL")
TURSO_TOKEN = os.environ.get("TURSO_AUTH_TOKEN")

def get_db_connection():
    """
    Creates and returns a connection to the SQLite database.
    If TURSO_DATABASE_URL is set, connects to Turso (cloud SQLite).
    Otherwise, connects to the local SQLite database at DB_PATH.
    row_factory = sqlite3.Row allows accessing columns by name like a dictionary.
    """
    if TURSO_URL and TURSO_TOKEN:
        try:
            import libsql_experimental as sqlite_cloud
            conn = sqlite_cloud.connect(f"{TURSO_URL}?authToken={TURSO_TOKEN}")
            conn.row_factory = sqlite_cloud.Row
            return conn
        except ImportError:
            print("[DB] libsql_experimental not installed, falling back to local SQLite.")

    # Ensure parent directory of DB_PATH exists
    db_dir = os.path.dirname(DB_PATH)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;") # Enforce relational integrity
    return conn

def init_db():
    """
    Initializes database tables if they do not already exist.
    Called once when the FastAPI server starts up.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Table 0: Users (Authentication & Authorization)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        full_name TEXT DEFAULT 'Administrator',
        role TEXT DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Table 0.1: Server-Managed Sessions (HttpOnly Cookie Auth)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Table 1: Registered APIs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS apis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        environment TEXT DEFAULT 'Production',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Table 2: Historical Scan Reports
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scan_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        api_id INTEGER,
        scanned_url TEXT NOT NULL,
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_checks INTEGER DEFAULT 0,
        passed_checks INTEGER DEFAULT 0,
        warning_checks INTEGER DEFAULT 0,
        failed_checks INTEGER DEFAULT 0,
        overall_status TEXT DEFAULT 'PASS',
        FOREIGN KEY (api_id) REFERENCES apis(id) ON DELETE SET NULL
    );
    """)

    # Table 3: Individual Check Findings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scan_findings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id INTEGER NOT NULL,
        check_key TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        severity TEXT,
        evidence TEXT,
        description TEXT,
        recommendation TEXT,
        FOREIGN KEY (report_id) REFERENCES scan_reports(id) ON DELETE CASCADE
    );
    """)

    # Safe Schema Migrations: add user_id column if not exists
    cursor.execute("PRAGMA table_info(apis);")
    api_cols = [c["name"] for c in cursor.fetchall()]
    if "user_id" not in api_cols:
        cursor.execute("ALTER TABLE apis ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;")

    cursor.execute("PRAGMA table_info(scan_reports);")
    scan_cols = [c["name"] for c in cursor.fetchall()]
    if "user_id" not in scan_cols:
        cursor.execute("ALTER TABLE scan_reports ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;")

    # Link legacy unowned records to the first administrator if users exist
    cursor.execute("SELECT id FROM users ORDER BY id ASC LIMIT 1;")
    first_user = cursor.fetchone()
    if first_user:
        admin_id = first_user["id"]
        cursor.execute("UPDATE apis SET user_id = ? WHERE user_id IS NULL;", (admin_id,))
        cursor.execute("UPDATE scan_reports SET user_id = ? WHERE user_id IS NULL;", (admin_id,))

    # Seed default sample API and scan report if database is completely empty
    cursor.execute("SELECT COUNT(*) FROM apis")
    if cursor.fetchone()[0] == 0:
        cursor.execute(
            "INSERT INTO apis (name, url, environment, description) VALUES (?, ?, ?, ?)",
            ("GitHub Public API", "https://api.github.com", "Production", "Public developer REST API")
        )
        api_id = cursor.lastrowid
        cursor.execute("""
            INSERT INTO scan_reports (
                api_id, scanned_url, total_checks, passed_checks, warning_checks, failed_checks, overall_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (api_id, "https://api.github.com", 6, 5, 1, 0, "WARNING"))
        report_id = cursor.lastrowid
        sample_findings = [
            (report_id, "https_enforced", "HTTPS Transport Layer Security", "PASS", "CRITICAL", "Target URL scheme is https://", "API endpoint communicates over TLS/HTTPS.", "Keep HTTPS enforced across all production endpoints."),
            (report_id, "hsts_header", "Strict-Transport-Security (HSTS)", "PASS", "HIGH", "Strict-Transport-Security: max-age=31536000; includeSubdomains; preload", "HSTS header is present and protects against downgrade attacks.", "HSTS is properly configured."),
            (report_id, "content_type_options", "X-Content-Type-Options Protection", "PASS", "MEDIUM", "X-Content-Type-Options: nosniff", "Prevents MIME-sniffing attacks.", "Header properly configured."),
            (report_id, "clickjacking_protection", "Clickjacking / Framing Protection", "PASS", "MEDIUM", "X-Frame-Options: deny", "Protects against UI redress attacks.", "Properly configured."),
            (report_id, "cors_misconfig", "Cross-Origin Resource Sharing (CORS)", "WARNING", "MEDIUM", "Access-Control-Allow-Origin: *", "Permissive CORS origin allowed.", "Restrict Access-Control-Allow-Origin to specific trusted domains."),
            (report_id, "server_disclosure", "Server Information Disclosure", "PASS", "LOW", "Server: github.com", "No granular server framework version disclosed.", "Keep server version banners minimized.")
        ]
        for f in sample_findings:
            cursor.execute("""
                INSERT INTO scan_findings (
                    report_id, check_key, title, status, severity, evidence, description, recommendation
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, f)

    conn.commit()
    conn.close()
    print(" SQLite Database initialized successfully at:", DB_PATH)
