# IdeaForge Backend API
# Built with FastAPI, SQLAlchemy, and PostgreSQL
# Implements RESTful endpoints for Users, Projects, and Join Requests

import os
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_

import models
import schemas
from database import engine, get_db, Base

# Load default test user ID from environment (default: 1)
TEST_USER_ID = int(os.getenv("TEST_USER_ID", "1"))

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="IdeaForge API",
    description="Backend REST API for IdeaForge student innovation and collaboration platform.",
    version="1.0.0"
)

# Configure CORS to allow communication with Vite React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== STARTUP SEED HELPER ====================
@app.on_event("startup")
def seed_database_if_empty():
    """
    Auto-seeds the database with sample users and projects if empty.
    Ensures that examiners or students running the app for the first time
    see working data immediately.
    """
    db: Session = next(get_db())
    try:
        user_count = db.query(models.User).count()
        if user_count == 0:
            # 1. Create Sample Users
            u1 = models.User(name="Rakesh Kumar", email="rakesh.kumar@college.edu")  # Current test user
            u2 = models.User(name="Aarav Sharma", email="aarav.sharma@college.edu")
            u3 = models.User(name="Priya Patel", email="priya.patel@college.edu")
            u4 = models.User(name="Rohan Gupta", email="rohan.gupta@college.edu")
            u5 = models.User(name="Ananya Deshmukh", email="ananya.d@college.edu")
            db.add_all([u1, u2, u3, u4, u5])
            db.commit()

            # 2. Create Sample Projects
            p1 = models.Project(
                title="AI Resume Screener & Skill Matcher",
                description="An intelligent platform that parses student resumes, matches skills with available campus internship roles, and recommends learning paths for missing technical skills.",
                category="AI/ML",
                required_skills="Python, NLP, React, FastAPI",
                team_size=4,
                contact_email="aarav.sharma@college.edu",
                owner_id=u2.id
            )
            p2 = models.Project(
                title="Peer-to-Peer College Book & Notes Exchange",
                description="A centralized campus web portal where seniors can sell, donate, or lend textbooks and handwritten study materials directly to juniors without middlemen.",
                category="Web Development",
                required_skills="React, Node.js, Express, PostgreSQL",
                team_size=3,
                contact_email="priya.patel@college.edu",
                owner_id=u3.id
            )
            p3 = models.Project(
                title="Campus Shuttle Live Tracker App",
                description="A mobile-first application using GPS telemetry to provide real-time location tracking and estimated arrival times for college buses and shuttles across campus routes.",
                category="App Development",
                required_skills="React Native, Google Maps API, Firebase / WebSocket",
                team_size=4,
                contact_email="rohan.gupta@college.edu",
                owner_id=u4.id
            )
            p4 = models.Project(
                title="IoT Smart Library Seat & Noise Monitor",
                description="An embedded sensor network monitoring real-time seat occupancy and ambient noise levels in the college library, displaying live heatmaps on a web dashboard.",
                category="Other",
                required_skills="Arduino / ESP32, Python, MQTT, Chart.js",
                team_size=3,
                contact_email="ananya.d@college.edu",
                owner_id=u5.id
            )
            p5 = models.Project(
                title="Autonomous Campus Rover",
                description="Self-navigating obstacle-avoiding campus delivery rover for intra-campus parcel and library book transfer.",
                category="AI/ML",
                required_skills="ROS, Python, OpenCV, Raspberry Pi",
                team_size=4,
                contact_email="rakesh.kumar@college.edu",
                owner_id=u1.id  # Owned by test user
            )
            db.add_all([p1, p2, p3, p4, p5])
            db.commit()

            # 3. Create Sample Join Requests
            req1 = models.JoinRequest(
                project_id=p1.id,
                user_id=u1.id,
                message="I have strong Python NLP and React skills and would love to build the matching algorithm!",
                status="Pending"
            )
            req2 = models.JoinRequest(
                project_id=p1.id,
                user_id=u3.id,
                message="I am proficient in React and UI/UX design. I can design the applicant portal.",
                status="Accepted"
            )
            req3 = models.JoinRequest(
                project_id=p5.id,
                user_id=u2.id,
                message="I can work on the obstacle avoidance algorithms and sensor fusion.",
                status="Pending"
            )
            db.add_all([req1, req2, req3])
            db.commit()
    except Exception as e:
        db.rollback()
        print(f"Notice: Startup seed skipped or already applied: {e}")
    finally:
        db.close()


# ==================== HEALTH & TEST USER ====================
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "IdeaForge Backend",
        "database": "PostgreSQL",
        "test_user_id": TEST_USER_ID
    }


# ==================== USERS ENDPOINTS ====================
@app.post("/api/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Create a new student user.
    DBMS: INSERT INTO users (name, email) VALUES (...);
    """
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    db_user = models.User(name=user.name, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/api/users", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db)):
    """
    Retrieve all users.
    DBMS: SELECT * FROM users;
    """
    return db.query(models.User).all()


@app.get("/api/users/{user_id}", response_model=schemas.UserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific user by ID.
    DBMS: SELECT * FROM users WHERE id = ?;
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


# ==================== PROJECTS ENDPOINTS ====================
@app.post("/api/projects", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    """
    Create a new project idea.
    Assigns owner_id to project.owner_id or default TEST_USER_ID.
    DBMS: INSERT INTO projects (...) VALUES (...);
    """
    owner_id = project.owner_id if project.owner_id is not None else TEST_USER_ID

    # Verify owner exists
    owner = db.query(models.User).filter(models.User.id == owner_id).first()
    if not owner:
        # Create user if missing
        owner = models.User(
            name=project.contact_email.split('@')[0].capitalize(),
            email=project.contact_email
        )
        db.add(owner)
        db.commit()
        db.refresh(owner)
        owner_id = owner.id

    db_project = models.Project(
        title=project.title,
        description=project.description,
        category=project.category,
        required_skills=project.required_skills,
        team_size=project.team_size,
        contact_email=project.contact_email,
        owner_id=owner_id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@app.get("/api/projects", response_model=List[schemas.ProjectResponse])
def get_projects(
    search: Optional[str] = Query(None, description="Search projects by title"),
    category: Optional[str] = Query(None, description="Filter projects by category"),
    owner_id: Optional[int] = Query(None, description="Filter projects by owner ID"),
    db: Session = Depends(get_db)
):
    """
    Retrieve projects with optional title search (LIKE / ILIKE) and category filter.
    DBMS:
      SELECT p.*, u.name, u.email
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE title ILIKE '%search%' AND category = ?;
    """
    query = db.query(models.Project)

    # Filter by search string if provided
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(models.Project.title.ilike(term))

    # Filter by category if provided and not 'All'
    if category and category.strip() and category.strip() != "All":
        query = query.filter(models.Project.category == category.strip())

    # Filter by owner_id if provided (useful for My Projects)
    if owner_id is not None:
        query = query.filter(models.Project.owner_id == owner_id)

    # Order newest first
    return query.order_by(models.Project.id.desc()).all()


@app.get("/api/projects/{project_id}", response_model=schemas.ProjectResponse)
def get_project_details(project_id: int, db: Session = Depends(get_db)):
    """
    Retrieve single project details by ID.
    DBMS: SELECT * FROM projects WHERE id = ?;
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )
    return project


@app.put("/api/projects/{project_id}", response_model=schemas.ProjectResponse)
def update_project(project_id: int, project_update: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    """
    Update an existing project.
    DBMS: UPDATE projects SET ... WHERE id = ?;
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )

    update_data = project_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)
    return project


@app.delete("/api/projects/{project_id}", status_code=status.HTTP_200_OK)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """
    Delete a project.
    Triggers ON DELETE CASCADE to remove associated join requests in PostgreSQL.
    DBMS: DELETE FROM projects WHERE id = ?;
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )

    db.delete(project)
    db.commit()
    return {
        "message": f"Project '{project.title}' (ID {project_id}) was successfully deleted.",
        "cascaded_requests_deleted": True
    }


# ==================== JOIN REQUESTS ENDPOINTS ====================
@app.post("/api/projects/{project_id}/join-requests", response_model=schemas.JoinRequestResponse, status_code=status.HTTP_201_CREATED)
def submit_join_request(
    project_id: int,
    request_data: schemas.JoinRequestCreate,
    db: Session = Depends(get_db)
):
    """
    Submit a request to join a project.
    DBMS: INSERT INTO join_requests (project_id, user_id, message, status) VALUES (...);
    """
    # 1. Verify project exists
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} does not exist."
        )

    # 2. Determine requesting user
    user_id = request_data.user_id
    if user_id is None:
        if request_data.applicant_email:
            # Check or create applicant user
            user = db.query(models.User).filter(models.User.email == request_data.applicant_email).first()
            if not user:
                name = request_data.applicant_name or request_data.applicant_email.split('@')[0].capitalize()
                user = models.User(name=name, email=request_data.applicant_email)
                db.add(user)
                db.commit()
                db.refresh(user)
            user_id = user.id
        else:
            user_id = TEST_USER_ID

    # 3. Prevent owner from requesting to join their own project
    if project.owner_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are the owner of this project and cannot submit a join request to yourself."
        )

    # 4. Check if request already exists (enforce UNIQUE constraint)
    existing_request = db.query(models.JoinRequest).filter(
        models.JoinRequest.project_id == project_id,
        models.JoinRequest.user_id == user_id
    ).first()

    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have already submitted a join request for this project. Current status: {existing_request.status}."
        )

    # 5. Insert new JoinRequest
    db_request = models.JoinRequest(
        project_id=project_id,
        user_id=user_id,
        message=request_data.message or "",
        status="Pending"
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)

    applicant = db.query(models.User).filter(models.User.id == user_id).first()

    return schemas.JoinRequestResponse(
        id=db_request.id,
        project_id=db_request.project_id,
        user_id=db_request.user_id,
        message=db_request.message,
        status=db_request.status,
        created_at=db_request.created_at,
        applicant_name=applicant.name if applicant else "Student",
        applicant_email=applicant.email if applicant else "",
        project_title=project.title
    )


@app.get("/api/projects/{project_id}/join-requests", response_model=List[schemas.JoinRequestResponse])
def get_project_join_requests(project_id: int, db: Session = Depends(get_db)):
    """
    Retrieve all join requests for a specific project.
    DBMS:
      SELECT jr.*, u.name, u.email, p.title
      FROM join_requests jr
      JOIN users u ON jr.user_id = u.id
      JOIN projects p ON jr.project_id = p.id
      WHERE jr.project_id = ?;
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )

    requests = (
        db.query(models.JoinRequest, models.User.name, models.User.email, models.Project.title)
        .join(models.User, models.JoinRequest.user_id == models.User.id)
        .join(models.Project, models.JoinRequest.project_id == models.Project.id)
        .filter(models.JoinRequest.project_id == project_id)
        .order_by(models.JoinRequest.id.desc())
        .all()
    )

    result = []
    for req, user_name, user_email, project_title in requests:
        result.append(
            schemas.JoinRequestResponse(
                id=req.id,
                project_id=req.project_id,
                user_id=req.user_id,
                message=req.message,
                status=req.status,
                created_at=req.created_at,
                applicant_name=user_name,
                applicant_email=user_email,
                project_title=project_title
            )
        )
    return result


@app.patch("/api/join-requests/{request_id}", response_model=schemas.JoinRequestResponse)
def update_join_request_status(
    request_id: int,
    status_update: schemas.JoinRequestUpdate,
    db: Session = Depends(get_db)
):
    """
    Accept or reject a project join request.
    DBMS: UPDATE join_requests SET status = ? WHERE id = ?;
    """
    req = db.query(models.JoinRequest).filter(models.JoinRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Join request with ID {request_id} not found."
        )

    req.status = status_update.status
    db.commit()
    db.refresh(req)

    user = db.query(models.User).filter(models.User.id == req.user_id).first()
    project = db.query(models.Project).filter(models.Project.id == req.project_id).first()

    return schemas.JoinRequestResponse(
        id=req.id,
        project_id=req.project_id,
        user_id=req.user_id,
        message=req.message,
        status=req.status,
        created_at=req.created_at,
        applicant_name=user.name if user else "Student",
        applicant_email=user.email if user else "",
        project_title=project.title if project else "Project"
    )


@app.get("/api/users/{user_id}/incoming-requests", response_model=List[schemas.JoinRequestResponse])
def get_user_incoming_requests(user_id: int, db: Session = Depends(get_db)):
    """
    Get all incoming join requests across all projects owned by a user.
    DBMS:
      SELECT jr.*, u.name, u.email, p.title
      FROM join_requests jr
      JOIN projects p ON jr.project_id = p.id
      JOIN users u ON jr.user_id = u.id
      WHERE p.owner_id = ?;
    """
    requests = (
        db.query(models.JoinRequest, models.User.name, models.User.email, models.Project.title)
        .join(models.Project, models.JoinRequest.project_id == models.Project.id)
        .join(models.User, models.JoinRequest.user_id == models.User.id)
        .filter(models.Project.owner_id == user_id)
        .order_by(models.JoinRequest.id.desc())
        .all()
    )

    result = []
    for req, user_name, user_email, project_title in requests:
        result.append(
            schemas.JoinRequestResponse(
                id=req.id,
                project_id=req.project_id,
                user_id=req.user_id,
                message=req.message,
                status=req.status,
                created_at=req.created_at,
                applicant_name=user_name,
                applicant_email=user_email,
                project_title=project_title
            )
        )
    return result
