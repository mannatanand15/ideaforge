# SQLAlchemy Models for IdeaForge
# Maps to PostgreSQL tables: users, projects, join_requests

from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    """
    Table 1: Users
    Stores student information.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)

    # Relationships
    # One student can own Many projects
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    # One student can submit Many join requests
    join_requests = relationship("JoinRequest", back_populates="user", cascade="all, delete-orphan")


class Project(Base):
    """
    Table 2: Projects
    Stores college project ideas created by students.
    """
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True)
    required_skills = Column(String(255), nullable=False)
    team_size = Column(Integer, nullable=False)
    contact_email = Column(String(150), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    owner = relationship("User", back_populates="projects")
    join_requests = relationship("JoinRequest", back_populates="project", cascade="all, delete-orphan")


class JoinRequest(Base):
    """
    Table 3: JoinRequests
    Associative table managing student requests to join projects.
    """
    __tablename__ = "join_requests"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    message = Column(Text, default="", nullable=False)
    status = Column(String(20), default="Pending", nullable=False)  # Pending, Accepted, or Rejected
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relational integrity constraint: prevents duplicate requests by same user for same project
    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_project_user_join"),
    )

    # Relationships
    project = relationship("Project", back_populates="join_requests")
    user = relationship("User", back_populates="join_requests")
