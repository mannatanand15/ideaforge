import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  User,
  Mail,
  Clock,
  Check,
  X,
  Database,
  Inbox
} from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import {
  getProjects,
  deleteProject,
  getIncomingRequestsForUser,
  updateJoinRequestStatus,
  CURRENT_USER_ID,
  CURRENT_USER_NAME
} from '../utils/api';

/**
 * Page 4: My Projects
 * Connects to PostgreSQL via FastAPI backend.
 * Displays:
 * 1. Projects created by the active test user (SELECT * FROM projects WHERE owner_id = 1)
 * 2. Deletion with PostgreSQL ON DELETE CASCADE
 * 3. Incoming Join Requests with PostgreSQL UPDATE status = 'Accepted' / 'Rejected'
 */
export default function MyProjects() {
  const [userProjects, setUserProjects] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Load user projects and incoming requests from PostgreSQL
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Query projects where owner_id = CURRENT_USER_ID
      const projects = await getProjects({ ownerId: CURRENT_USER_ID });
      setUserProjects(projects);

      // Query incoming join requests across all user projects
      const requests = await getIncomingRequestsForUser(CURRENT_USER_ID);
      setIncomingRequests(requests);
    } catch (err) {
      console.error('Failed to load user projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle deletion of a project with confirmation (PostgreSQL: ON DELETE CASCADE)
  const handleDeleteProject = async (id, title) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete "${title}"?\n\nDBMS Impact: This will execute DELETE FROM projects WHERE id = ${id}.\nPostgreSQL will automatically trigger ON DELETE CASCADE to remove all linked join requests.`
    );

    if (isConfirmed) {
      try {
        await deleteProject(id);
        await loadData();
        showNotification(`Project "${title}" was deleted from PostgreSQL database along with its cascaded join requests.`);
      } catch (err) {
        alert(`Error deleting project: ${err.message}`);
      }
    }
  };

  // Handle Accept / Reject join request (PostgreSQL: UPDATE join_requests SET status = ?)
  const handleUpdateStatus = async (requestId, newStatus, applicantName) => {
    try {
      await updateJoinRequestStatus(requestId, newStatus);
      await loadData();
      showNotification(
        `Application from ${applicantName} marked as ${newStatus.toUpperCase()} in PostgreSQL.`
      );
    } catch (err) {
      alert(`Error updating request status: ${err.message}`);
    }
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">My Projects</h1>
        <p className="page-subtitle">
          Projects created by <strong>{CURRENT_USER_NAME}</strong> (Test User ID: <code>{CURRENT_USER_ID}</code>).
          Stored in PostgreSQL database.
        </p>
      </div>

      {/* Action Notification Toast */}
      {notification && (
        <div className="alert alert-info" style={{ alignItems: 'center' }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{notification}</span>
        </div>
      )}

      {/* Section 1: User's Published Projects */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
          <p>Loading projects from PostgreSQL...</p>
        </div>
      ) : userProjects.length > 0 ? (
        <div>
          <div className="filter-stats" style={{ marginBottom: '1.25rem' }}>
            <span>
              You have <strong>{userProjects.length}</strong>{' '}
              {userProjects.length === 1 ? 'project' : 'projects'} stored in PostgreSQL.
            </span>
            <Link to="/add-project" className="btn btn-primary btn-sm">
              <PlusCircle size={14} />
              <span>Share Another Idea</span>
            </Link>
          </div>

          <div className="projects-grid">
            {userProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                showDelete={true}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>

          {/* Section 2: Incoming Join Requests across all user's projects */}
          <div className="join-requests-section" style={{ marginTop: '3rem' }}>
            <div className="section-badge-header">
              <div>
                <h2 className="details-section-title" style={{ marginBottom: '0.25rem' }}>
                  Received Join Requests in PostgreSQL ({incomingRequests.length})
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Students who applied to join your projects. You can Accept or Reject each application.
                </p>
              </div>

              <div className="dbms-badge">
                <Database size={13} />
                <span>SELECT * FROM join_requests WHERE project_id IN (my_projects)</span>
              </div>
            </div>

            {incomingRequests.length > 0 ? (
              <div className="requests-list">
                {incomingRequests.map((req) => (
                  <div key={req.id} className={`request-card ${req.status.toLowerCase()}`}>
                    <div className="request-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span className="request-applicant-name">
                            <User size={16} style={{ color: 'var(--primary-blue)' }} />
                            {req.applicantName}
                          </span>
                          <span className="badge badge-web" style={{ fontSize: '0.75rem' }}>
                            For: {req.projectTitle}
                          </span>
                        </div>

                        <div className="request-applicant-email">
                          <Mail size={13} />
                          <a href={`mailto:${req.applicantEmail}`}>{req.applicantEmail}</a>
                        </div>
                      </div>

                      <div>
                        <span className={`status-badge ${req.status.toLowerCase()}`}>
                          {req.status === 'Pending' && <Clock size={12} />}
                          {req.status === 'Accepted' && <Check size={12} />}
                          {req.status === 'Rejected' && <X size={12} />}
                          {req.status}
                        </span>
                      </div>
                    </div>

                    <div className="request-message-box">
                      <p>"{req.message}"</p>
                    </div>

                    <div className="request-actions">
                      <span className="request-date">Applied on {req.createdAt}</span>

                      {req.status === 'Pending' ? (
                        <div className="request-buttons">
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            onClick={() => handleUpdateStatus(req.id, 'Accepted', req.applicantName)}
                          >
                            <Check size={14} />
                            <span>Accept</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleUpdateStatus(req.id, 'Rejected', req.applicantName)}
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Status: <strong>{req.status.toUpperCase()}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem', margin: '1rem 0' }}>
                <div className="empty-state-icon" style={{ width: '40px', height: '40px' }}>
                  <Inbox size={20} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  No Join Requests Received Yet
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  When other students request to join your projects, their applications will show up here.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FolderKanban size={28} />
          </div>
          <h2 className="empty-state-title">No Projects Created Yet in PostgreSQL</h2>
          <p className="empty-state-desc">
            You haven't posted any project ideas under your test user account yet. Share your first idea to recruit teammates, receive join requests, and collaborate across campus!
          </p>
          <Link to="/add-project" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Share Your First Idea</span>
          </Link>
        </div>
      )}
    </div>
  );
}
