-- =============================================================================
-- IdeaForge — Student Innovation and Collaboration Platform
-- Database Schema & DBMS Viva Reference Guide (PostgreSQL)
-- =============================================================================

-- =============================================================================
-- 1. DATABASE ENTITIES & RELATIONSHIPS EXPLANATION
-- =============================================================================
--
-- ENTITY 1: users
--   - Represents students who create projects or apply to join projects.
--   - Primary Key: id (Unique identifier for each user)
--   - Natural Key: email (Unique constraint prevents duplicate accounts)
--
-- ENTITY 2: projects
--   - Represents student innovation project ideas.
--   - Primary Key: id (Unique identifier for each project)
--   - Foreign Key: owner_id REFERENCES users(id) ON DELETE CASCADE
--   - Relationship: One-to-Many (1:N) between users and projects.
--     (One student user can create and own Many projects).
--
-- ENTITY 3: join_requests
--   - Represents a request submitted by a student to join a specific project.
--   - Primary Key: id (Unique identifier for each request)
--   - Foreign Key 1: project_id REFERENCES projects(id) ON DELETE CASCADE
--   - Foreign Key 2: user_id REFERENCES users(id) ON DELETE CASCADE
--   - Relationship: Many-to-Many (M:N) junction / associative entity between
--     users (applicants) and projects.
--   - Integrity Constraint: UNIQUE (project_id, user_id) ensures a student
--     cannot submit duplicate join requests for the same project.
-- =============================================================================

-- Clean up existing tables if recreating (in reverse dependency order)
DROP TABLE IF EXISTS join_requests CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================================================
-- 2. DDL (DATA DEFINITION LANGUAGE) — TABLE CREATION
-- =============================================================================

-- Table 1: Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE
);

-- Table 2: Projects
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    required_skills VARCHAR(255) NOT NULL,
    team_size INTEGER NOT NULL CHECK (team_size > 0),
    contact_email VARCHAR(150) NOT NULL,
    owner_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_owner
        FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Table 3: JoinRequests
CREATE TABLE join_requests (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    message TEXT DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_join_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_join_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    -- Prevent duplicate join requests from the same user to the same project
    CONSTRAINT uq_project_user_join
        UNIQUE (project_id, user_id)
);

-- Indexes for performance on frequently queried foreign keys
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_join_requests_project ON join_requests(project_id);
CREATE INDEX idx_join_requests_user ON join_requests(user_id);


-- =============================================================================
-- 3. DML (DATA MANIPULATION LANGUAGE) & SQL EXAMPLES
-- =============================================================================

-- A. INSERT EXAMPLES
-- -----------------------------------------------------------------------------
-- Insert Users:
INSERT INTO users (name, email) VALUES
    ('Rakesh Kumar', 'rakesh.kumar@college.edu'),       -- Test User (id: 1)
    ('Aarav Sharma', 'aarav.sharma@college.edu'),       -- (id: 2)
    ('Priya Patel', 'priya.patel@college.edu'),         -- (id: 3)
    ('Rohan Gupta', 'rohan.gupta@college.edu'),         -- (id: 4)
    ('Ananya Deshmukh', 'ananya.d@college.edu');        -- (id: 5)

-- Insert Projects (demonstrating Foreign Key referencing users.id):
INSERT INTO projects (title, description, category, required_skills, team_size, contact_email, owner_id) VALUES
    ('AI Resume Screener & Skill Matcher', 'An intelligent platform parsing student resumes and matching campus internship skills using NLP.', 'AI/ML', 'Python, NLP, React, FastAPI', 4, 'aarav.sharma@college.edu', 2),
    ('Peer-to-Peer College Book Exchange', 'A centralized campus portal for students to buy, lend, or sell textbooks without intermediaries.', 'Web Development', 'React, Node.js, PostgreSQL', 3, 'priya.patel@college.edu', 3),
    ('Campus Shuttle Live Tracker App', 'Real-time GPS bus location tracking and ETA prediction for college transit routes.', 'App Development', 'React Native, Maps API, WebSockets', 4, 'rohan.gupta@college.edu', 4),
    ('IoT Smart Library Seat & Noise Monitor', 'Real-time library seat occupancy and ambient noise monitor with sensor telemetry heatmaps.', 'Other', 'Arduino, ESP32, Python, MQTT', 3, 'ananya.d@college.edu', 5),
    ('Autonomous Campus Rover', 'Self-navigating obstacle-avoiding rover for intra-campus parcel and library book transfer.', 'AI/ML', 'ROS, Python, OpenCV, Raspberry Pi', 4, 'rakesh.kumar@college.edu', 1);

-- Insert Join Requests (demonstrating Foreign Keys to both projects.id and users.id):
INSERT INTO join_requests (project_id, user_id, message, status) VALUES
    (1, 1, 'I have strong Python NLP and React skills and would love to build the matching engine!', 'Pending'),
    (1, 3, 'I can design the student dashboard and frontend interface.', 'Accepted'),
    (2, 1, 'I can help design the PostgreSQL database schema and REST APIs.', 'Pending'),
    (5, 2, 'I can work on the obstacle avoidance algorithms and sensor fusion.', 'Pending');


-- B. SELECT & WHERE EXAMPLES
-- -----------------------------------------------------------------------------
-- Select all projects in a specific category:
SELECT id, title, category, team_size, contact_email
FROM projects
WHERE category = 'AI/ML';

-- Select all pending join requests:
SELECT id, project_id, user_id, status
FROM join_requests
WHERE status = 'Pending';


-- C. LIKE / ILIKE EXAMPLES (PATTERN MATCHING)
-- -----------------------------------------------------------------------------
-- Search projects whose title contains 'tracker' (case-insensitive in PostgreSQL):
SELECT id, title, category
FROM projects
WHERE title ILIKE '%tracker%';


-- D. JOIN EXAMPLES (RELATIONAL QUERIES)
-- -----------------------------------------------------------------------------
-- 1. INNER JOIN between Projects and Users (Project Owner information):
SELECT
    p.id AS project_id,
    p.title AS project_title,
    p.category,
    p.team_size,
    u.id AS owner_user_id,
    u.name AS owner_name,
    u.email AS owner_email
FROM projects p
INNER JOIN users u ON p.owner_id = u.id
ORDER BY p.id;

-- 2. MULTI-TABLE JOIN between JoinRequests, Projects, and Users:
--    (Displays applicant details, pitch message, status, and targeted project title)
SELECT
    jr.id AS request_id,
    p.title AS project_title,
    u.name AS applicant_name,
    u.email AS applicant_email,
    jr.message AS applicant_pitch,
    jr.status AS request_status,
    jr.created_at AS application_date
FROM join_requests jr
INNER JOIN projects p ON jr.project_id = p.id
INNER JOIN users u ON jr.user_id = u.id
ORDER BY jr.created_at DESC;


-- E. UPDATE EXAMPLES
-- -----------------------------------------------------------------------------
-- Update request status to 'Accepted' (Project owner accepting an applicant):
UPDATE join_requests
SET status = 'Accepted'
WHERE id = 1;

-- Update team size for a project:
UPDATE projects
SET team_size = 5
WHERE id = 1;


-- F. DELETE EXAMPLES & ON DELETE CASCADE
-- -----------------------------------------------------------------------------
-- Deleting a project automatically triggers ON DELETE CASCADE,
-- which removes all join_requests pointing to this project_id!
DELETE FROM projects
WHERE id = 3;

-- Verify cascade deletion: no join_requests remain with project_id = 3
SELECT * FROM join_requests WHERE project_id = 3;


-- =============================================================================
-- G. DASHBOARD ANALYTICS & ADVANCED SQL DEMONSTRATIONS
-- =============================================================================

-- 1. Summary Metrics via Scalar Subqueries:
SELECT 
    (SELECT COUNT(*) FROM projects) AS total_projects,
    (SELECT COUNT(*) FROM join_requests) AS total_join_requests,
    (SELECT COUNT(*) FROM join_requests WHERE status = 'Pending') AS pending_join_requests,
    (SELECT COUNT(*) FROM join_requests WHERE status = 'Accepted') AS accepted_join_requests,
    (SELECT COUNT(*) FROM join_requests WHERE status = 'Rejected') AS rejected_join_requests;

-- 2. Category Distribution via GROUP BY and ORDER BY:
SELECT category, COUNT(*) AS count
FROM projects
GROUP BY category
ORDER BY count DESC, category ASC;

-- 3. Project Collaboration Table:
-- Demonstrates:
--   - INNER JOIN (projects and users to get project owner's name)
--   - LEFT JOIN (projects and join_requests to include projects with 0 requests)
--   - COUNT(jr.id) (total request volume per project)
--   - Conditional Aggregation: COUNT(CASE WHEN jr.status = 'Pending' THEN 1 END)
--   - Conditional Aggregation: COUNT(CASE WHEN jr.status = 'Accepted' THEN 1 END)
--   - GROUP BY (non-aggregated columns: p.id, p.title, u.name, p.category)
--   - ORDER BY (total_requests DESC to rank most collaborative projects first)
SELECT 
    p.id,
    p.title,
    u.name AS owner_name,
    p.category,
    COUNT(jr.id) AS total_requests,
    COUNT(CASE WHEN jr.status = 'Pending' THEN 1 END) AS pending_requests,
    COUNT(CASE WHEN jr.status = 'Accepted' THEN 1 END) AS accepted_requests
FROM projects p
INNER JOIN users u ON p.owner_id = u.id
LEFT JOIN join_requests jr ON p.id = jr.project_id
GROUP BY p.id, p.title, u.name, p.category
ORDER BY total_requests DESC, p.title ASC;

-- 4. Popular Projects (Top Most Requested Projects):
-- Demonstrates: Aggregated sorting with LIMIT clause
SELECT 
    p.id,
    p.title,
    p.category,
    u.name AS owner_name,
    COUNT(jr.id) AS total_requests,
    COUNT(CASE WHEN jr.status = 'Accepted' THEN 1 END) AS accepted_requests
FROM projects p
INNER JOIN users u ON p.owner_id = u.id
LEFT JOIN join_requests jr ON p.id = jr.project_id
GROUP BY p.id, p.title, p.category, u.name
ORDER BY total_requests DESC, p.id ASC
LIMIT 4;

