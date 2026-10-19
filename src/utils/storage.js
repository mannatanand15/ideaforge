// Storage utility for IdeaForge
// Handles reading, saving, updating, and deleting projects and join requests using localStorage.
//
// ==================== DBMS RELATIONAL CONCEPTS ====================
// 1. Relational Entities:
//    - 'projects' (Primary Key: id)
//    - 'join_requests' (Primary Key: id, Foreign Key: projectId -> projects.id)
// 2. Relationship Cardinality:
//    - 1 : N (One project can receive Many join requests)
// 3. Relational Operations:
//    - INSERT: Adding a new project or submitting a new join request
//    - SELECT: Querying all projects, project by ID, or requests by projectId
//    - UPDATE: Project owner updating join_request status ('pending' -> 'accepted' / 'rejected')
//    - DELETE & CASCADE: When a project is deleted, its join requests are deleted (ON DELETE CASCADE)
// ===================================================================

import { SAMPLE_PROJECTS } from '../data/sampleProjects';

const PROJECTS_STORAGE_KEY = 'ideaforge_projects';
const REQUESTS_STORAGE_KEY = 'ideaforge_join_requests';

// Sample join requests for initial DBMS demonstration
export const SAMPLE_REQUESTS = [
  {
    id: 'req-1',
    projectId: 'proj-1',
    projectTitle: 'AI Resume Screener & Skill Matcher',
    applicantName: 'Rahul Sharma',
    applicantEmail: 'rahul.s@college.edu',
    message: 'I have experience in Python NLP and would love to build the resume parsing and skill-matching algorithm!',
    status: 'pending', // 'pending' | 'accepted' | 'rejected'
    createdAt: '2026-10-17'
  },
  {
    id: 'req-2',
    projectId: 'proj-1',
    projectTitle: 'AI Resume Screener & Skill Matcher',
    applicantName: 'Divya Nair',
    applicantEmail: 'divya.nair@college.edu',
    message: 'I am proficient in React and UI/UX design. I can design and build the applicant portal.',
    status: 'accepted',
    createdAt: '2026-10-18'
  },
  {
    id: 'req-3',
    projectId: 'proj-2',
    projectTitle: 'Peer-to-Peer College Book & Notes Exchange',
    applicantName: 'Vikram Malhotra',
    applicantEmail: 'vikram.m@college.edu',
    message: 'I can design the PostgreSQL schema and write the Node.js REST API endpoints for user authentication.',
    status: 'pending',
    createdAt: '2026-10-18'
  }
];

// ==================== PROJECTS CRUD ====================

/**
 * Retrieve all projects.
 * SELECT * FROM projects ORDER BY created_at DESC;
 */
export const getProjects = () => {
  try {
    const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(SAMPLE_PROJECTS));
      return SAMPLE_PROJECTS;
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(SAMPLE_PROJECTS));
      return SAMPLE_PROJECTS;
    }
    return parsed;
  } catch (error) {
    console.error('Failed to load projects from localStorage:', error);
    return SAMPLE_PROJECTS;
  }
};

/**
 * Retrieve a project by its primary key.
 * SELECT * FROM projects WHERE id = ?;
 */
export const getProjectById = (id) => {
  const allProjects = getProjects();
  return allProjects.find((p) => String(p.id) === String(id)) || null;
};

/**
 * Create a new project.
 * INSERT INTO projects (id, title, description, category, required_skills, owner, team_size, contact_email) VALUES (...);
 */
export const saveProject = (projectData) => {
  const allProjects = getProjects();

  const newProject = {
    id: `proj-${Date.now()}`,
    title: projectData.title.trim(),
    description: projectData.description.trim(),
    category: projectData.category,
    requiredSkills: projectData.requiredSkills.trim(),
    owner: projectData.owner ? projectData.owner.trim() : 'Current Student',
    teamSize: Number(projectData.teamSize) || 3,
    contactEmail: projectData.contactEmail.trim().toLowerCase(),
    createdByCurrentUser: true,
    createdAt: new Date().toISOString().split('T')[0]
  };

  const updatedProjects = [newProject, ...allProjects];
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));
  return newProject;
};

/**
 * Delete a project by primary key.
 * Cascades to delete all associated join requests (ON DELETE CASCADE).
 * DELETE FROM projects WHERE id = ?;
 */
export const deleteProject = (id) => {
  const allProjects = getProjects();
  const updatedProjects = allProjects.filter((p) => String(p.id) !== String(id));
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));

  // Cascading Delete: remove associated join requests
  deleteRequestsByProjectId(id);

  return updatedProjects;
};

/**
 * Filter projects created by the current user.
 * SELECT * FROM projects WHERE created_by_current_user = TRUE;
 */
export const getUserProjects = () => {
  const allProjects = getProjects();
  return allProjects.filter((p) => p.createdByCurrentUser === true);
};

// ==================== JOIN REQUESTS CRUD ====================

/**
 * Retrieve all join requests from localStorage.
 * SELECT * FROM join_requests;
 */
export const getJoinRequests = () => {
  try {
    const stored = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(SAMPLE_REQUESTS));
      return SAMPLE_REQUESTS;
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(SAMPLE_REQUESTS));
      return SAMPLE_REQUESTS;
    }
    return parsed;
  } catch (error) {
    console.error('Failed to load join requests from localStorage:', error);
    return SAMPLE_REQUESTS;
  }
};

/**
 * Retrieve join requests for a specific project (Foreign Key query).
 * SELECT * FROM join_requests WHERE project_id = ? ORDER BY created_at DESC;
 */
export const getRequestsByProjectId = (projectId) => {
  const allRequests = getJoinRequests();
  return allRequests.filter((r) => String(r.projectId) === String(projectId));
};

/**
 * Insert a new join request.
 * INSERT INTO join_requests (id, project_id, project_title, applicant_name, applicant_email, message, status) VALUES (...);
 */
export const createJoinRequest = ({ projectId, projectTitle, applicantName, applicantEmail, message }) => {
  const allRequests = getJoinRequests();

  const newRequest = {
    id: `req-${Date.now()}`,
    projectId: String(projectId),
    projectTitle: projectTitle || 'Project',
    applicantName: applicantName.trim(),
    applicantEmail: applicantEmail.trim().toLowerCase(),
    message: message.trim(),
    status: 'pending', // default status
    createdAt: new Date().toISOString().split('T')[0]
  };

  const updatedRequests = [newRequest, ...allRequests];
  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(updatedRequests));
  return newRequest;
};

/**
 * Update request status (Accept or Reject).
 * UPDATE join_requests SET status = ? WHERE id = ?;
 */
export const updateRequestStatus = (requestId, newStatus) => {
  const allRequests = getJoinRequests();
  const updatedRequests = allRequests.map((req) => {
    if (String(req.id) === String(requestId)) {
      return {
        ...req,
        status: newStatus,
        updatedAt: new Date().toISOString().split('T')[0]
      };
    }
    return req;
  });

  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(updatedRequests));
  return updatedRequests.find((r) => String(r.id) === String(requestId)) || null;
};

/**
 * Cascading Delete for requests when a parent project is removed.
 * DELETE FROM join_requests WHERE project_id = ?;
 */
export const deleteRequestsByProjectId = (projectId) => {
  const allRequests = getJoinRequests();
  const updatedRequests = allRequests.filter((r) => String(r.projectId) !== String(projectId));
  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(updatedRequests));
  return updatedRequests;
};

/**
 * Get all requests received for projects created by the current user.
 * SELECT r.* FROM join_requests r JOIN projects p ON r.project_id = p.id WHERE p.created_by_current_user = TRUE;
 */
export const getRequestsForUserProjects = () => {
  const userProjects = getUserProjects();
  const userProjectIds = new Set(userProjects.map((p) => String(p.id)));
  const allRequests = getJoinRequests();
  return allRequests.filter((r) => userProjectIds.has(String(r.projectId)));
};
