# API Shield - Beginner-Friendly API Security Dashboard

API Shield is an educational, lightweight web application designed to help developers and students check the security hygiene of HTTP APIs. It performs safe, passive security checks on registered endpoints, flags missing security headers or insecure configurations, and saves scan reports for analysis.

---

## 📌 Architecture Overview

```
       [ React + Vite Frontend ]
       (Runs in browser at http://localhost:5173)
                   │
                   │ HTTP JSON Requests (via /api/* proxy)
                   ▼
       [ FastAPI Python Backend ]
       (Runs on Uvicorn at http://127.0.0.1:8000)
         │                     │
         ▼                     ▼
 [ SQLite Database ]    [ HTTP Client (httpx) ]
 (apis, scans, findings) (Safe, passive scan requests)
```

1. **Frontend (React + Vite)**:
   - Modern cybersecurity-themed dashboard with a dark navy sidebar and clean cards.
   - Allows users to register APIs, trigger security scans, view metrics, and read audit reports.
   - Communicates with the backend using standard browser `fetch()` API calls.

2. **Backend (FastAPI)**:
   - Lightweight, fast Python REST API with automatic Swagger docs at `http://127.0.0.1:8000/docs`.
   - Handles API registration (CRUD), runs defensive passive security tests using `httpx`, and computes dashboard statistics.
   - Validates URLs and strictly avoids aggressive or destructive testing.

3. **Database (SQLite)**:
   - Embedded file-based relational database (`backend/apishield.db`).
   - Requires zero external setup or database server management.
   - Stores saved APIs, historical scan reports, and individual check findings using parameterized SQL queries.

---

## 🚀 How to Run Locally on macOS

Both servers can be started easily in two separate terminal windows.

### Terminal 1: Start the Backend (FastAPI)
```bash
cd /Users/akanchadubey/Desktop/API-Shield-X/backend

# Activate the virtual environment
source venv/bin/activate

# Start the server with auto-reload
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- **Backend URL:** `http://127.0.0.1:8000/`
- **Interactive API Documentation:** `http://127.0.0.1:8000/docs`

### Terminal 2: Start the Frontend (React + Vite)
```bash
cd /Users/akanchadubey/Desktop/API-Shield-X/frontend

# Start Vite development server
npm run dev
```
- **Frontend Dashboard:** `http://localhost:5173/`

---

## 🎯 Security Checks Performed (Defensive & Honest)

| Check | What It Tests | Status Logic | Why It Matters |
| :--- | :--- | :--- | :--- |
| **HTTPS Protocol** | Whether the endpoint starts with `https://` and enforces TLS encryption. | **PASS**: HTTPS used.<br>**FAIL**: Unencrypted plain HTTP. | Unencrypted HTTP exposes API requests, tokens, and data to interception over the network. |
| **HSTS (Strict-Transport-Security)** | Checks for the `Strict-Transport-Security` header in the HTTP response. | **PASS**: Present with `max-age`.<br>**WARNING**: Missing or short `max-age`. | Ensures browsers only connect using HTTPS, preventing SSL-stripping man-in-the-middle attacks. |
| **Content-Type Options** | Checks for `X-Content-Type-Options: nosniff`. | **PASS**: Set to `nosniff`.<br>**WARNING**: Header absent. | Prevents MIME-type sniffing where browsers guess content types, avoiding malicious script execution. |
| **Frame Options / Clickjacking** | Checks for `X-Frame-Options` or `Content-Security-Policy: frame-ancestors`. | **PASS**: Set to `DENY` or `SAMEORIGIN`.<br>**WARNING**: Header absent. | Prevents the API response or portal from being embedded into malicious iframes (clickjacking). |
| **CORS Policy (Cross-Origin)** | Analyzes `Access-Control-Allow-Origin` and credentials headers. | **PASS**: Restricted or absent.<br>**WARNING**: Wildcard `*` or reflected origin with credentials. | Overly permissive CORS policies allow unauthorized websites in the user's browser to read API responses. |
| **Server Information Disclosure** | Checks for verbose `Server` or `X-Powered-By` headers. | **PASS**: Clean or absent.<br>**WARNING**: Exposes exact server/framework version (e.g., `Apache/2.4.41`). | Revealing exact software versions assists attackers in targeting known vulnerabilities. |

---

## 📂 Project Structure

```
API-Shield-X/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app instance, CORS middleware, routes
│   │   ├── database.py          # SQLite connection & table creation
│   │   ├── models.py            # Pydantic schemas for data validation
│   │   ├── scanner.py           # Passive defensive security checks (HTTPS, Headers, CORS)
│   │   └── routers/
│   │       ├── apis.py          # API endpoints: Create, Read, Update, Delete APIs
│   │       ├── scans.py         # Endpoints: POST /api/scans/run, GET /api/scans
│   │       └── stats.py         # Endpoint: GET /api/stats (metrics for dashboard)
│   ├── requirements.txt         # Python dependencies
│   ├── venv/                    # Isolated Python virtual environment
│   └── apishield.db             # Local SQLite database file
│
├── frontend/
│   ├── index.html               # Webpage HTML entry
│   ├── package.json             # React dependencies and scripts
│   ├── vite.config.js           # Vite configuration & backend proxy
│   ├── public/
│   │   └── shield-logo.svg      # Logo
│   └── src/
│       ├── main.jsx             # React DOM root render
│       ├── App.jsx              # Navigation state, sidebar & topbar layout
│       ├── index.css            # Clean CSS styling (dark navy & crisp cards)
│       ├── components/
│       │   ├── Sidebar.jsx      # Navigation bar
│       │   ├── Topbar.jsx       # Header with page title and actions
│       │   ├── MetricCard.jsx   # Reusable stats widget
│       │   ├── StatusBadge.jsx  # PASS/WARNING/FAIL badge
│       │   └── Modal.jsx        # Popups for adding/editing APIs
│       ├── pages/
│       │   ├── Dashboard.jsx    # Real statistics from database
│       │   ├── MyApis.jsx       # API list table & management
│       │   ├── SecurityScanner.jsx # Scanner execution page
│       │   └── ScanReports.jsx  # Detailed history of scan reports
│       └── services/
│           └── api.js           # Centralized fetch calls to backend
│
└── README.md                    # Project documentation
```
