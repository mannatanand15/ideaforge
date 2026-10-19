# Pydantic Schemas for Request & Response Validation
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# ==================== USER SCHEMAS ====================
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True


# ==================== PROJECT SCHEMAS ====================
class ProjectBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    category: str = Field(..., min_length=2, max_length=50)
    required_skills: str = Field(..., min_length=2, max_length=255)
    team_size: int = Field(..., gt=0, le=50)
    contact_email: EmailStr

class ProjectCreate(ProjectBase):
    owner_id: Optional[int] = None  # If omitted, assigned to TEST_USER_ID

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    required_skills: Optional[str] = None
    team_size: Optional[int] = None
    contact_email: Optional[EmailStr] = None

class ProjectResponse(ProjectBase):
    id: int
    owner_id: int
    created_at: datetime
    owner: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ==================== JOIN REQUEST SCHEMAS ====================
class JoinRequestCreate(BaseModel):
    user_id: Optional[int] = None  # If omitted, defaults to TEST_USER_ID
    applicant_name: Optional[str] = None  # Helpful when creating from frontend
    applicant_email: Optional[EmailStr] = None
    message: Optional[str] = Field(default="", max_length=1000)

class JoinRequestUpdate(BaseModel):
    status: str = Field(..., pattern="^(Accepted|Rejected)$")

class JoinRequestResponse(BaseModel):
    id: int
    project_id: int
    user_id: int
    message: str
    status: str
    created_at: datetime
    applicant_name: Optional[str] = None
    applicant_email: Optional[str] = None
    project_title: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== DASHBOARD SCHEMAS ====================
class CategoryStat(BaseModel):
    category: str
    count: int

class ProjectCollaborationStat(BaseModel):
    id: int
    title: str
    owner_name: str
    category: str
    total_requests: int
    pending_requests: int
    accepted_requests: int

class PopularProject(BaseModel):
    id: int
    title: str
    category: str
    owner_name: str
    total_requests: int
    accepted_requests: int

class DashboardSummary(BaseModel):
    total_projects: int
    total_join_requests: int
    pending_join_requests: int
    accepted_join_requests: int
    rejected_join_requests: int

class DashboardResponse(BaseModel):
    summary: DashboardSummary
    categories: List[CategoryStat]
    collaboration_table: List[ProjectCollaborationStat]
    popular_projects: List[PopularProject]

