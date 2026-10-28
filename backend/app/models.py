from typing import Optional, List
from pydantic import BaseModel, HttpUrl, Field

class ApiCreate(BaseModel):
    name: str = Field(..., min_length=1, description="Friendly name for the API service")
    url: str = Field(..., min_length=4, description="Full HTTP or HTTPS endpoint URL")
    environment: Optional[str] = Field("Production", description="Deployment environment")
    description: Optional[str] = Field(None, description="Optional service notes")

class ApiUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    url: Optional[str] = Field(None, min_length=4)
    environment: Optional[str] = None
    description: Optional[str] = None

class ApiResponse(BaseModel):
    id: int
    name: str
    url: str
    environment: str
    description: Optional[str]
    created_at: str

class ScanRequest(BaseModel):
    api_id: Optional[int] = Field(None, description="Optional ID of saved API")
    url: str = Field(..., description="Target URL to audit")

class FindingModel(BaseModel):
    check_key: str
    title: str
    status: str  # PASS, WARNING, FAIL, INCONCLUSIVE
    severity: Optional[str] = None  # HIGH, MEDIUM, LOW, INFO
    evidence: str
    description: str
    recommendation: Optional[str] = None

class ScanReportResponse(BaseModel):
    id: Optional[int] = None
    api_id: Optional[int] = None
    api_name: Optional[str] = None
    scanned_url: str
    scanned_at: Optional[str] = None
    total_checks: int
    passed_checks: int
    warning_checks: int
    failed_checks: int
    overall_status: str
    findings: Optional[List[FindingModel]] = []

class StatsResponse(BaseModel):
    total_apis: int
    total_scans: int
    total_findings: int
    total_secure: int

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, description="User email address")
    password: str = Field(..., min_length=6, description="User password")

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str

class AuthResponse(BaseModel):
    user: UserResponse
    message: Optional[str] = "Authentication successful"
