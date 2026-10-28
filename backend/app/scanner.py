import httpx
from typing import Dict, Any, List

async def perform_security_scan(target_url: str) -> Dict[str, Any]:
    """
    Performs passive, non-destructive defensive security checks against an HTTP endpoint.
    Audits:
    1. HTTPS Transport Encryption
    2. Strict-Transport-Security (HSTS)
    3. X-Content-Type-Options (MIME Sniffing)
    4. X-Frame-Options (Clickjacking Protection)
    5. Access-Control-Allow-Origin (CORS Configuration)
    6. Server / X-Powered-By Header Information Disclosure
    """
    findings: List[Dict[str, Any]] = []

    # 1. HTTPS Protocol Check (URL based)
    is_https = target_url.lower().startswith("https://")
    if is_https:
        findings.append({
            "check_key": "HTTPS_PROTOCOL",
            "title": "HTTPS Transport Layer Security",
            "status": "PASS",
            "severity": None,
            "evidence": f"URL scheme: {target_url.split('://')[0]}://",
            "description": "The endpoint uses TLS/HTTPS, ensuring data in transit is encrypted against eavesdropping and man-in-the-middle tampering.",
            "recommendation": None
        })
    else:
        findings.append({
            "check_key": "HTTPS_PROTOCOL",
            "title": "HTTPS Transport Layer Security",
            "status": "FAIL",
            "severity": "HIGH",
            "evidence": "Endpoint communicates over unencrypted plain HTTP (http://)",
            "description": "API requests, authentication tokens, and payload data are transmitted in cleartext over the network.",
            "recommendation": "Enforce HTTPS with a valid TLS certificate (e.g., Let's Encrypt or Cloudflare) and redirect all HTTP traffic to HTTPS."
        })

    # Fetch response headers using safe, passive HTTP request
    headers = {}
    network_error = None

    try:
        # 5 second timeout to prevent hanging, follow redirects, verify=False for self-signed college lab certificates
        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True, verify=False) as client:
            # We send a standard GET request with an explicit User-Agent
            response = await client.get(target_url, headers={"User-Agent": "APIShield-SecurityAuditor/1.0"})
            headers = {k.lower(): v for k, v in response.headers.items()}
    except httpx.ConnectTimeout:
        network_error = "Connection timed out after 5.0 seconds. The target server may be offline or blocking requests."
    except httpx.ConnectError:
        network_error = "Failed to establish a connection. The host could not be resolved or the port is closed."
    except Exception as e:
        network_error = f"HTTP request failed: {str(e)}"

    if network_error:
        # If server was unreachable, record inconclusive findings for headers
        findings.append({
            "check_key": "SERVER_CONNECTIVITY",
            "title": "Server Response Inspection",
            "status": "INCONCLUSIVE",
            "severity": "MEDIUM",
            "evidence": network_error,
            "description": "Could not inspect response headers because the remote server did not respond to the test request.",
            "recommendation": "Verify that the API server is online, accessible from this network, and that the URL is spelled correctly."
        })
    else:
        # 2. Strict-Transport-Security (HSTS)
        hsts = headers.get("strict-transport-security")
        if hsts:
            findings.append({
                "check_key": "HSTS_HEADER",
                "title": "Strict-Transport-Security (HSTS)",
                "status": "PASS",
                "severity": None,
                "evidence": f"Strict-Transport-Security: {hsts}",
                "description": "HSTS header is present. Browsers will automatically refuse unencrypted HTTP connections to this domain.",
                "recommendation": None
            })
        else:
            findings.append({
                "check_key": "HSTS_HEADER",
                "title": "Strict-Transport-Security (HSTS)",
                "status": "WARNING",
                "severity": "MEDIUM",
                "evidence": "Header absent in HTTP response",
                "description": "Without HSTS, a user or client interacting with this domain may be downgraded to plain HTTP by network attackers (SSL-stripping).",
                "recommendation": "Add the response header: Strict-Transport-Security: max-age=31536000; includeSubDomains"
            })

        # 3. X-Content-Type-Options
        xcto = headers.get("x-content-type-options")
        if xcto and "nosniff" in xcto.lower():
            findings.append({
                "check_key": "MIME_SNIFFING",
                "title": "X-Content-Type-Options Protection",
                "status": "PASS",
                "severity": None,
                "evidence": f"X-Content-Type-Options: {xcto}",
                "description": "MIME sniffing protection is enabled, preventing browsers from interpreting responses as alternate executable types.",
                "recommendation": None
            })
        else:
            findings.append({
                "check_key": "MIME_SNIFFING",
                "title": "X-Content-Type-Options Protection",
                "status": "WARNING",
                "severity": "LOW",
                "evidence": f"X-Content-Type-Options: {xcto if xcto else 'Header absent'}",
                "description": "Without nosniff, older or permissive browsers might attempt to guess content types, potentially executing malicious scripts.",
                "recommendation": "Add the response header: X-Content-Type-Options: nosniff"
            })

        # 4. Clickjacking Protection (X-Frame-Options or CSP frame-ancestors)
        xfo = headers.get("x-frame-options")
        csp = headers.get("content-security-policy", "")
        has_frame_ancestors = "frame-ancestors" in csp.lower()

        if xfo or has_frame_ancestors:
            evidence_text = f"X-Frame-Options: {xfo}" if xfo else "CSP frame-ancestors directive present"
            findings.append({
                "check_key": "CLICKJACKING_PROTECTION",
                "title": "Clickjacking / Framing Protection",
                "status": "PASS",
                "severity": None,
                "evidence": evidence_text,
                "description": "The endpoint restricts embedding inside third-party iframes, mitigating UI redressing and clickjacking attacks.",
                "recommendation": None
            })
        else:
            findings.append({
                "check_key": "CLICKJACKING_PROTECTION",
                "title": "Clickjacking / Framing Protection",
                "status": "WARNING",
                "severity": "LOW",
                "evidence": "X-Frame-Options and CSP frame-ancestors absent",
                "description": "If this API renders HTML error pages or documentation, an attacker could embed it in a malicious invisible iframe.",
                "recommendation": "Add the response header: X-Frame-Options: DENY (or SAMEORIGIN)"
            })

        # 5. CORS Policy (Access-Control-Allow-Origin)
        cors_origin = headers.get("access-control-allow-origin")
        cors_creds = headers.get("access-control-allow-credentials", "").lower()

        if cors_origin == "*" and cors_creds == "true":
            findings.append({
                "check_key": "CORS_POLICY",
                "title": "Cross-Origin Resource Sharing (CORS)",
                "status": "FAIL",
                "severity": "HIGH",
                "evidence": "Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true",
                "description": "Wildcard origin with credentials allowed is dangerous and prohibited by modern browser security standards.",
                "recommendation": "Specify explicit trusted origins in Access-Control-Allow-Origin instead of wildcard '*'."
            })
        elif cors_origin == "*":
            findings.append({
                "check_key": "CORS_POLICY",
                "title": "Cross-Origin Resource Sharing (CORS)",
                "status": "WARNING",
                "severity": "MEDIUM",
                "evidence": "Access-Control-Allow-Origin: *",
                "description": "The API allows any public web page to read response data in the client's browser. Acceptable only for truly public, non-sensitive read-only APIs.",
                "recommendation": "If the API returns private user data, restrict Access-Control-Allow-Origin to specific frontend domains."
            })
        else:
            evidence_cors = f"Access-Control-Allow-Origin: {cors_origin}" if cors_origin else "No wildcard CORS header (restricted by default)"
            findings.append({
                "check_key": "CORS_POLICY",
                "title": "Cross-Origin Resource Sharing (CORS)",
                "status": "PASS",
                "severity": None,
                "evidence": evidence_cors,
                "description": "CORS policy does not expose sensitive endpoints to unrestricted cross-origin browser reads.",
                "recommendation": None
            })

        # 6. Information Disclosure (Server / X-Powered-By)
        server_hdr = headers.get("server")
        powered_by = headers.get("x-powered-by")
        
        has_version_leak = False
        leak_evidence = []
        if server_hdr and any(char.isdigit() for char in server_hdr):
            has_version_leak = True
            leak_evidence.append(f"Server: {server_hdr}")
        if powered_by:
            has_version_leak = True
            leak_evidence.append(f"X-Powered-By: {powered_by}")

        if has_version_leak:
            findings.append({
                "check_key": "SERVER_DISCLOSURE",
                "title": "Server Information Disclosure",
                "status": "WARNING",
                "severity": "LOW",
                "evidence": ", ".join(leak_evidence),
                "description": "The response reveals specific backend technologies or version numbers, helping attackers find known version-specific exploits.",
                "recommendation": "Configure your web server (Nginx/Apache/Express) to suppress or sanitize Server and X-Powered-By headers."
            })
        else:
            evidence_info = f"Server: {server_hdr}" if server_hdr else "No version headers disclosed"
            findings.append({
                "check_key": "SERVER_DISCLOSURE",
                "title": "Server Information Disclosure",
                "status": "PASS",
                "severity": None,
                "evidence": evidence_info,
                "description": "Server banners do not advertise specific software version numbers.",
                "recommendation": None
            })

    # Calculate Summary Totals
    passed = sum(1 for f in findings if f["status"] == "PASS")
    warnings = sum(1 for f in findings if f["status"] == "WARNING")
    failed = sum(1 for f in findings if f["status"] == "FAIL")
    total = len(findings)

    if failed > 0:
        overall_status = "FAIL"
    elif warnings > 0:
        overall_status = "WARNING"
    elif any(f["status"] == "INCONCLUSIVE" for f in findings):
        overall_status = "INCONCLUSIVE"
    else:
        overall_status = "PASS"

    return {
        "scanned_url": target_url,
        "total_checks": total,
        "passed_checks": passed,
        "warning_checks": warnings,
        "failed_checks": failed,
        "overall_status": overall_status,
        "findings": findings
    }
