#!/usr/bin/env python3
"""
API Shield - Administrator Initialization CLI
Safely creates or updates the administrator account using environment variables,
command-line arguments, or secure interactive prompts.
Never hardcodes administrator credentials or secrets.
"""

import sys
import os
import argparse
import getpass
import re

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import init_db, get_db_connection
from app.auth import hash_password

def validate_email(email: str) -> bool:
    return bool(re.match(r"^[^@]+@[^@]+\.[^@]+$", email.strip()))

def create_or_update_admin(email: str, password: str, full_name: str = "Administrator"):
    email = email.strip().lower()
    if not validate_email(email):
        print(f"[!] Error: Invalid email format '{email}'")
        sys.exit(1)

    if len(password) < 8:
        print("[!] Error: Password must be at least 8 characters long.")
        sys.exit(1)

    # Ensure tables exist and migrations are applied
    init_db()

    conn = get_db_connection()
    cursor = conn.cursor()

    # Hash using bcrypt
    hashed = hash_password(password)

    cursor.execute("SELECT id, email FROM users WHERE LOWER(email) = ?", (email,))
    existing = cursor.fetchone()

    if existing:
        admin_id = existing["id"]
        cursor.execute(
            "UPDATE users SET hashed_password = ?, full_name = ?, role = 'admin' WHERE id = ?",
            (hashed, full_name, admin_id)
        )
        action = "Updated password for existing administrator"
    else:
        cursor.execute(
            "INSERT INTO users (email, hashed_password, full_name, role) VALUES (?, ?, ?, 'admin')",
            (email, hashed, full_name)
        )
        admin_id = cursor.lastrowid
        action = "Created new administrator account"

    # Associate legacy unowned records with this administrator
    cursor.execute("UPDATE apis SET user_id = ? WHERE user_id IS NULL", (admin_id,))
    apis_updated = cursor.rowcount
    cursor.execute("UPDATE scan_reports SET user_id = ? WHERE user_id IS NULL", (admin_id,))
    scans_updated = cursor.rowcount

    conn.commit()
    conn.close()

    print(f"[✓] Success: {action} ({email}) [ID: {admin_id}]")
    if apis_updated > 0 or scans_updated > 0:
        print(f"[✓] Linked {apis_updated} legacy API(s) and {scans_updated} legacy scan report(s) to this administrator.")

def main():
    parser = argparse.ArgumentParser(description="Create or update API Shield Administrator")
    parser.add_argument("--email", help="Administrator email address")
    parser.add_argument("--password", help="Administrator password (min 8 chars)")
    parser.add_argument("--name", default="Administrator", help="Administrator display name")
    args = parser.parse_args()

    # 1. Environment variables take priority
    email = os.environ.get("ADMIN_EMAIL") or args.email
    password = os.environ.get("ADMIN_PASSWORD") or args.password
    name = os.environ.get("ADMIN_NAME") or args.name

    # 2. Interactive prompt if missing
    if not email:
        email = input("Enter Administrator Email: ").strip()
    if not password:
        password = getpass.getpass("Enter Administrator Password (min 8 chars): ").strip()
        confirm = getpass.getpass("Confirm Administrator Password: ").strip()
        if password != confirm:
            print("[!] Error: Passwords do not match.")
            sys.exit(1)

    create_or_update_admin(email, password, name)

if __name__ == "__main__":
    main()
