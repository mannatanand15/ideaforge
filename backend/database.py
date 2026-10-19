# Database connection and session setup for IdeaForge
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables from .env
load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://rakeshkumar@localhost:5432/ideaforge_db"
)

# Create the SQLAlchemy engine for PostgreSQL
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Session factory for handling database transactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all ORM models
Base = declarative_base()

# FastAPI dependency to yield a database session per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
