# IdeaForge — Student Innovation and Collaboration Platform

> **Tagline:** *Turn Ideas Into Innovation.*  
> **College DBMS Project:** Full-Stack Web Application with React (Vite) + Python (FastAPI) + PostgreSQL (SQLAlchemy).

---

## 📌 Project Overview

**IdeaForge** is a student innovation and collaboration platform designed for college campus communities. It enables students to:
1. **Explore project ideas** created by peers across technical domains (Web Development, AI/ML, App Development, etc.).
2. **Publish new project ideas** to assemble student teams.
3. **Submit Join Requests** with a pitch and skill highlights.
4. **Manage project applications**: Project owners can review applicant requests and **Accept** or **Reject** them.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite, React Router DOM v7, Vanilla CSS, Lucide React icons
- **Backend:** Python 3.13, FastAPI, Uvicorn
- **Database:** PostgreSQL 16
- **ORM & Validation:** SQLAlchemy 2.0, Pydantic v2
- **Database Driver:** Psycopg 3 (`psycopg[binary]`)

---

## 🗄️ Database Architecture & DBMS Concepts

The database consists of **three core tables** connected via relational foreign keys:

### 1. Table: `users`
Represents students who create projects or apply for open roles.
- `id` (INT, PRIMARY KEY, SERIAL)
- `name` (VARCHAR(100), NOT NULL)
- `email` (VARCHAR(150), UNIQUE, NOT NULL)

### 2. Table: `projects`
Stores student innovation project concepts.
- `id` (INT, PRIMARY KEY, SERIAL)
- `title` (VARCHAR(200), NOT NULL)
- `description` (TEXT, NOT NULL)
- `category` (VARCHAR(50), NOT NULL)
- `required_skills` (VARCHAR(255), NOT NULL)
- `team_size` (INT, NOT NULL, CHECK > 0)
- `contact_email` (VARCHAR(150), NOT NULL)
- `owner_id` (INT, FOREIGN KEY REFERENCES `users(id)` ON DELETE CASCADE)
- `created_at` (TIMESTAMP WITH TIME ZONE)

### 3. Table: `join_requests`
Junction table managing applications to join projects.
- `id` (INT, PRIMARY KEY, SERIAL)
- `project_id` (INT, FOREIGN KEY REFERENCES `projects(id)` ON DELETE CASCADE)
- `user_id` (INT, FOREIGN KEY REFERENCES `users(id)` ON DELETE CASCADE)
- `message` (TEXT, applicant pitch & skills)
- `status` (VARCHAR(20), CHECK `status IN ('Pending', 'Accepted', 'Rejected')`)
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `CONSTRAINT uq_project_user_join UNIQUE (project_id, user_id)`: Prevents duplicate applications from the same user to the same project.

---

## 💡 DBMS Viva Cheat Sheet & SQL Examples

| DBMS Concept | SQL Command Example | Where Used in IdeaForge |
|---|---|---|
| **CREATE TABLE / DDL** | `CREATE TABLE projects (...);` | Initializing schema in `backend/schema.sql` |
| **PRIMARY KEY** | `id SERIAL PRIMARY KEY` | Uniquely identifies rows in `users`, `projects`, and `join_requests` |
| **FOREIGN KEY** | `owner_id INT REFERENCES users(id)` | Links project to owner user |
| **ON DELETE CASCADE** | `FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE` | When a project is deleted, all linked join requests are automatically removed |
| **INSERT (DML)** | `INSERT INTO projects (...) VALUES (...);` | When submitting the **Add a Project** form |
| **SELECT & WHERE** | `SELECT * FROM projects WHERE category = 'AI/ML';` | Category dropdown filtering on **Explore Projects** |
| **LIKE / ILIKE** | `SELECT * FROM projects WHERE title ILIKE '%rover%';` | Title search input on **Explore Projects** |
| **INNER JOIN** | `SELECT p.*, u.name FROM projects p JOIN users u ON p.owner_id = u.id;` | Fetching project details along with owner information |
| **MULTI-TABLE JOIN** | `SELECT jr.*, u.name, p.title FROM join_requests jr JOIN users u ON jr.user_id = u.id JOIN projects p ON jr.project_id = p.id;` | Displaying applicant details and project titles on **My Projects** |
| **UPDATE** | `UPDATE join_requests SET status = 'Accepted' WHERE id = 1;` | When project lead clicks **Accept** on a request |
| **DELETE** | `DELETE FROM projects WHERE id = 5;` | When project lead clicks **Delete** on **My Projects** |

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL (v14+) running locally

### 1. Database Setup
```bash
# Connect to PostgreSQL and create the database
psql -h localhost -U <your_postgres_user> -c "CREATE DATABASE ideaforge_db;"

# Optional: Run the SQL schema directly
psql -h localhost -U <your_postgres_user> -d ideaforge_db -f backend/schema.sql
```

### 2. Backend Setup (FastAPI)
```bash
# Navigate to backend directory or use venv
cd backend

# Create virtual environment (if not already created)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment in .env
# Example DATABASE_URL=postgresql://<user>@localhost:5432/ideaforge_db

# Run FastAPI development server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI documentation (Swagger UI) is available at: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup (React + Vite)
```bash
# In the root workspace directory:
npm install

# Run Vite dev server
npm run dev
```
Open `http://localhost:5173/` or `http://localhost:5174/` in your browser.

---

## 📁 Project Directory Structure

```text
untitled folder/
├── backend/
│   ├── .env                    # Database & server credentials
│   ├── .env.example            # Example configuration template
│   ├── database.py             # SQLAlchemy engine & session factory
│   ├── main.py                 # FastAPI app, CORS, routes & auto-seed
│   ├── models.py               # SQLAlchemy ORM models (Users, Projects, JoinRequests)
│   ├── requirements.txt        # Python package dependencies
│   ├── schema.sql              # Raw PostgreSQL DDL, constraints & query examples
│   └── schemas.py              # Pydantic schemas for data validation
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Top navigation bar
│   │   └── ProjectCard.jsx     # Reusable project card with tags & action buttons
│   ├── data/
│   │   └── sampleProjects.js   # Sample project ideas
│   ├── pages/
│   │   ├── ExploreProjects.jsx # Page 1: Home page with search & category filter
│   │   ├── AddProject.jsx      # Page 2: Project creation form
│   │   ├── ProjectDetails.jsx  # Page 3: Project details & Join Requests review
│   │   └── MyProjects.jsx      # Page 4: User projects & received join requests
│   ├── utils/
│   │   ├── api.js              # Full-stack API client for FastAPI & PostgreSQL
│   │   └── storage.js          # LocalStorage fallback & DBMS utility functions
│   ├── App.jsx                 # Client-side React Router routing
│   ├── index.css               # Clean Vanilla CSS styling
│   └── main.jsx                # React root entry point
├── index.html                  # HTML template with typography
├── package.json
└── README.md
```

---

## 👤 Development Test User
Because IdeaForge is a college DBMS prototype without an authentication system, it uses a documented test user for development:
- **Test User ID:** `1`
- **Name:** `Rakesh Kumar`
- **Email:** `rakesh.kumar@college.edu`
- Projects created with `owner_id = 1` appear under **My Projects**.
- Anyone can test switching between the Applicant view and Project Owner view via the demo toggle on the **Project Details** page.
# ideaforge
