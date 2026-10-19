// IdeaForge API Client
// Connects the React Vite frontend directly to the FastAPI + PostgreSQL backend.
// Includes transparent data mapping and fallback support.

const API_BASE = 'http://127.0.0.1:8000/api';

// Documented default test user for development (no auth system needed)
export const CURRENT_USER_ID = 1;
export const CURRENT_USER_NAME = 'Rakesh Kumar';
export const CURRENT_USER_EMAIL = 'rakesh.kumar@college.edu';

/**
 * Format PostgreSQL project model into frontend-friendly structure.
 */
const mapProject = (p) => ({
  id: p.id,
  title: p.title,
  description: p.description,
  category: p.category,
  requiredSkills: p.required_skills,
  teamSize: p.team_size,
  contactEmail: p.contact_email,
  owner: p.owner ? p.owner.name : (p.owner_id === CURRENT_USER_ID ? CURRENT_USER_NAME : 'Student Lead'),
  ownerId: p.owner_id,
  createdByCurrentUser: p.owner_id === CURRENT_USER_ID,
  createdAt: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : 'Recently'
});

/**
 * Format PostgreSQL join request model into frontend-friendly structure.
 */
const mapRequest = (r) => ({
  id: r.id,
  projectId: r.project_id,
  userId: r.user_id,
  projectTitle: r.project_title || 'Project',
  applicantName: r.applicant_name || 'Student Applicant',
  applicantEmail: r.applicant_email || '',
  message: r.message || '',
  status: r.status, // 'Pending' | 'Accepted' | 'Rejected'
  createdAt: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : 'Recently'
});

/**
 * Fetch all projects from PostgreSQL with optional search and category filters.
 * GET /api/projects?search=...&category=...
 */
export async function getProjects({ search = '', category = 'All', ownerId = null } = {}) {
  try {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (category && category !== 'All') params.append('category', category);
    if (ownerId !== null) params.append('owner_id', ownerId);

    const url = `${API_BASE}/projects${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.map(mapProject);
  } catch (err) {
    console.warn('API error in getProjects, checking localStorage fallback:', err.message);
    // Fallback to localStorage if backend is unreachable
    const fallback = JSON.parse(localStorage.getItem('ideaforge_projects') || '[]');
    return fallback.filter((p) => {
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'All' || p.category === category;
      const matchOwner = ownerId === null || (ownerId === CURRENT_USER_ID && p.createdByCurrentUser);
      return matchSearch && matchCat && matchOwner;
    });
  }
}

/**
 * Fetch a single project by ID from PostgreSQL.
 * GET /api/projects/{id}
 */
export async function getProjectById(id) {
  try {
    const res = await fetch(`${API_BASE}/projects/${id}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`HTTP error ${res.status}`);
    }
    const data = await res.json();
    return mapProject(data);
  } catch (err) {
    console.warn('API error in getProjectById, fallback:', err.message);
    const fallback = JSON.parse(localStorage.getItem('ideaforge_projects') || '[]');
    return fallback.find((p) => String(p.id) === String(id)) || null;
  }
}

/**
 * Create a new project in PostgreSQL.
 * POST /api/projects
 */
export async function createProject(projectData) {
  const payload = {
    title: projectData.title.trim(),
    description: projectData.description.trim(),
    category: projectData.category,
    required_skills: projectData.requiredSkills.trim(),
    team_size: Number(projectData.teamSize),
    contact_email: projectData.contactEmail.trim().toLowerCase(),
    owner_id: CURRENT_USER_ID
  };

  try {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.detail || `Server error: ${res.status}`);
    }
    const created = await res.json();
    return mapProject(created);
  } catch (err) {
    console.warn('API error creating project, saving locally:', err.message);
    // Local fallback
    const localProj = {
      id: `proj-${Date.now()}`,
      title: projectData.title,
      description: projectData.description,
      category: projectData.category,
      requiredSkills: projectData.requiredSkills,
      owner: CURRENT_USER_NAME,
      ownerId: CURRENT_USER_ID,
      teamSize: Number(projectData.teamSize),
      contactEmail: projectData.contactEmail,
      createdByCurrentUser: true,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const stored = JSON.parse(localStorage.getItem('ideaforge_projects') || '[]');
    localStorage.setItem('ideaforge_projects', JSON.stringify([localProj, ...stored]));
    return localProj;
  }
}

/**
 * Delete a project from PostgreSQL (executes ON DELETE CASCADE).
 * DELETE /api/projects/{id}
 */
export async function deleteProject(id) {
  try {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API error deleting project, removing locally:', err.message);
    const stored = JSON.parse(localStorage.getItem('ideaforge_projects') || '[]');
    const filtered = stored.filter((p) => String(p.id) !== String(id));
    localStorage.setItem('ideaforge_projects', JSON.stringify(filtered));
    return { success: true };
  }
}

/**
 * Fetch join requests for a specific project from PostgreSQL.
 * GET /api/projects/{id}/join-requests
 */
export async function getProjectJoinRequests(projectId) {
  try {
    const res = await fetch(`${API_BASE}/projects/${projectId}/join-requests`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.map(mapRequest);
  } catch (err) {
    console.warn('API error fetching project join requests, fallback:', err.message);
    const stored = JSON.parse(localStorage.getItem('ideaforge_join_requests') || '[]');
    return stored.filter((r) => String(r.projectId) === String(projectId));
  }
}

/**
 * Submit a new join request to a project in PostgreSQL.
 * POST /api/projects/{id}/join-requests
 */
export async function submitJoinRequest({ projectId, applicantName, applicantEmail, message }) {
  const payload = {
    applicant_name: applicantName.trim(),
    applicant_email: applicantEmail.trim().toLowerCase(),
    message: message.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/projects/${projectId}/join-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.detail || `Server error ${res.status}`);
    }
    const data = await res.json();
    return mapRequest(data);
  } catch (err) {
    console.warn('API error submitting join request:', err.message);
    throw err;
  }
}

/**
 * Accept or reject a join request in PostgreSQL.
 * PATCH /api/join-requests/{id}
 */
export async function updateJoinRequestStatus(requestId, newStatus) {
  // Normalize status to capitalized 'Accepted' or 'Rejected'
  const formattedStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase();

  try {
    const res = await fetch(`${API_BASE}/join-requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: formattedStatus })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return mapRequest(data);
  } catch (err) {
    console.warn('API error updating join request status:', err.message);
    throw err;
  }
}

/**
 * Fetch all incoming join requests for projects owned by the test user.
 * GET /api/users/{id}/incoming-requests
 */
export async function getIncomingRequestsForUser(userId = CURRENT_USER_ID) {
  try {
    const res = await fetch(`${API_BASE}/users/${userId}/incoming-requests`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.map(mapRequest);
  } catch (err) {
    console.warn('API error fetching incoming requests:', err.message);
    return [];
  }
}

/**
 * Check backend connection status and health.
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) return await res.json();
    return null;
  } catch {
    return null;
  }
}
