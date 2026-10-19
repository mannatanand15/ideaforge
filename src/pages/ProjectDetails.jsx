import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Users,
  Mail,
  Calendar,
  CheckCircle,
  Tag,
  AlertTriangle,
  Send,
  Check,
  X,
  Clock,
  Database,
  Inbox,
  AlertCircle
} from 'lucide-react';
import {
  getProjectById,
  getProjectJoinRequests,
  submitJoinRequest,
  updateJoinRequestStatus,
  CURRENT_USER_ID,
  CURRENT_USER_NAME,
  CURRENT_USER_EMAIL
} from '../utils/api';

/**
 * Page 3: Project Details
 * Connects directly to FastAPI backend and PostgreSQL database.
 * Demonstrates:
 * 1. SELECT * FROM projects WHERE id = ?
 * 2. SELECT * FROM join_requests WHERE project_id = ?
 * 3. INSERT INTO join_requests (...)
 * 4. UPDATE join_requests SET status = ? WHERE id = ?
 */
export default function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Join Requests state
  const [requests, setRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    applicantName: CURRENT_USER_NAME,
    applicantEmail: CURRENT_USER_EMAIL,
    message: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [joinSuccessNotice, setJoinSuccessNotice] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Toggle for viva demonstration: allows demonstrating owner Accept/Reject actions
  const [isOwnerView, setIsOwnerView] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const foundProject = await getProjectById(id);
      setProject(foundProject);

      if (foundProject) {
        if (foundProject.createdByCurrentUser) {
          setIsOwnerView(true);
        }
        await loadRequests(foundProject.id);
      }
    } catch (err) {
      console.error('Error loading project details:', err);
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRequests = async (projId) => {
    try {
      const list = await getProjectJoinRequests(projId);
      setRequests(list);
    } catch (err) {
      console.warn('Error fetching requests from API:', err);
    }
  };

  // Map category to specific badge CSS classes
  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'Web Development':
        return 'badge-web';
      case 'AI/ML':
        return 'badge-aiml';
      case 'App Development':
        return 'badge-app';
      case 'Other':
      default:
        return 'badge-other';
    }
  };

  // Form handling for Join Request
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setRequestFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateJoinForm = () => {
    const errors = {};
    if (!requestFormData.applicantName.trim()) {
      errors.applicantName = 'Your name is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!requestFormData.applicantEmail.trim()) {
      errors.applicantEmail = 'Your email address is required';
    } else if (!emailRegex.test(requestFormData.applicantEmail.trim())) {
      errors.applicantEmail = 'Enter a valid college email address';
    }
    if (!requestFormData.message.trim()) {
      errors.message = 'Please provide a short pitch or summary of your skills';
    } else if (requestFormData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters';
    }
    return errors;
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    const errors = validateJoinForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmittingJoin(true);
    try {
      // PostgreSQL: INSERT INTO join_requests
      await submitJoinRequest({
        projectId: project.id,
        applicantName: requestFormData.applicantName,
        applicantEmail: requestFormData.applicantEmail,
        message: requestFormData.message
      });

      await loadRequests(project.id);
      setIsModalOpen(false);
      setRequestFormData({
        applicantName: CURRENT_USER_NAME,
        applicantEmail: CURRENT_USER_EMAIL,
        message: ''
      });
      setJoinSuccessNotice(
        `Join request inserted into PostgreSQL with status = 'Pending'. The project lead can accept or reject your application.`
      );
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to submit join request.' });
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  // Owner action: Accept or Reject request (PostgreSQL: UPDATE join_requests SET status = ?)
  const handleUpdateStatus = async (requestId, newStatus, applicantName) => {
    try {
      await updateJoinRequestStatus(requestId, newStatus);
      await loadRequests(project.id);
      setActionNotice(
        `Request from ${applicantName} updated to ${newStatus.toUpperCase()} in PostgreSQL database.`
      );
      setTimeout(() => {
        setActionNotice(null);
      }, 4000);
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(`Could not update status: ${err.message}`);
    }
  };

  // If loading
  if (isLoading) {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading project details from PostgreSQL...</p>
      </div>
    );
  }

  // Gracefully handle Invalid Project ID
  if (!project) {
    return (
      <div>
        <div className="back-link-wrapper">
          <Link to="/" className="back-link">
            <ArrowLeft size={16} />
            <span>Back to Explore Projects</span>
          </Link>
        </div>

        <div className="empty-state">
          <div className="empty-state-icon" style={{ color: 'var(--danger-color)' }}>
            <AlertTriangle size={30} />
          </div>
          <h2 className="empty-state-title">Project Not Found</h2>
          <p className="empty-state-desc">
            The project you are looking for (ID: <code>{id}</code>) does not exist in PostgreSQL or may have been deleted.
          </p>
          <Link to="/" className="btn btn-primary">
            <ArrowLeft size={16} />
            <span>Back to Explore Projects</span>
          </Link>
        </div>
      </div>
    );
  }

  const skillsList = project.requiredSkills
    ? project.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div>
      {/* Back Button Navigation */}
      <div className="back-link-wrapper">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Explore Projects</span>
        </Link>
      </div>

      <div className="details-card">
        {/* Viva / Role Switcher Banner */}
        <div className="owner-toggle-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={16} style={{ color: 'var(--primary-blue)' }} />
            <span style={{ fontSize: '0.85rem', color: '#1e3a8a' }}>
              <strong>DBMS Viva Demo Mode:</strong> Viewing as{' '}
              <strong>{isOwnerView ? 'Project Owner (Can Accept/Reject)' : 'Student Applicant'}</strong>
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsOwnerView(!isOwnerView)}
          >
            Switch to {isOwnerView ? 'Applicant View' : 'Owner View'}
          </button>
        </div>

        {/* Header: Category Badge & Title */}
        <div className="details-header">
          <div className="details-category">
            <span className={`badge ${getCategoryBadgeClass(project.category)}`}>
              {project.category}
            </span>
            {project.createdByCurrentUser && (
              <span className="badge badge-my-project" style={{ marginLeft: '0.5rem' }}>
                Your Project (PostgreSQL Owner)
              </span>
            )}
          </div>
          <h1 className="details-title">{project.title}</h1>
        </div>

        {/* Project Meta Information Grid */}
        <div className="details-meta-grid">
          <div className="details-meta-item">
            <div className="details-meta-icon">
              <User size={18} />
            </div>
            <div>
              <div className="details-meta-label">Project Lead</div>
              <div className="details-meta-value">{project.owner || 'Student'}</div>
            </div>
          </div>

          <div className="details-meta-item">
            <div className="details-meta-icon">
              <Users size={18} />
            </div>
            <div>
              <div className="details-meta-label">Max Team Size</div>
              <div className="details-meta-value">Up to {project.teamSize} members</div>
            </div>
          </div>

          <div className="details-meta-item">
            <div className="details-meta-icon">
              <Mail size={18} />
            </div>
            <div>
              <div className="details-meta-label">Contact Email</div>
              <div className="details-meta-value">
                <a
                  href={`mailto:${project.contactEmail}`}
                  style={{ color: 'var(--primary-blue)', textDecoration: 'underline' }}
                >
                  {project.contactEmail}
                </a>
              </div>
            </div>
          </div>

          {project.createdAt && (
            <div className="details-meta-item">
              <div className="details-meta-icon">
                <Calendar size={18} />
              </div>
              <div>
                <div className="details-meta-label">Date Stored</div>
                <div className="details-meta-value">{project.createdAt}</div>
              </div>
            </div>
          )}
        </div>

        {/* Full Description Section */}
        <div className="details-section">
          <h2 className="details-section-title">About This Project</h2>
          <p className="details-description">{project.description}</p>
        </div>

        {/* Required Skills Section */}
        <div className="details-section">
          <h2 className="details-section-title">Required Skills & Technologies</h2>
          {skillsList.length > 0 ? (
            <div className="skills-tags">
              {skillsList.map((skill, index) => (
                <span
                  key={index}
                  className="skill-tag"
                  style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}
                >
                  <Tag size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No specific skills specified.</p>
          )}
        </div>

        {/* Success Alert after Join Request Submission */}
        {joinSuccessNotice && (
          <div className="alert alert-success" style={{ marginTop: '1.5rem' }}>
            <CheckCircle size={22} style={{ color: '#059669', flexShrink: 0 }} />
            <div>
              <h4 className="alert-title">Request to Join Submitted!</h4>
              <p>{joinSuccessNotice}</p>
            </div>
          </div>
        )}

        {/* Primary Page Action Buttons */}
        <div className="details-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Send size={16} />
            <span>Request to Join This Project</span>
          </button>

          <Link to="/" className="btn btn-secondary">
            <ArrowLeft size={16} />
            <span>Back to Explore Projects</span>
          </Link>
        </div>

        {/* ==================== PROJECT OWNER: MANAGE JOIN REQUESTS ==================== */}
        <div className="join-requests-section">
          <div className="section-badge-header">
            <div>
              <h2 className="details-section-title" style={{ marginBottom: '0.25rem' }}>
                Join Requests in PostgreSQL ({requests.length})
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {isOwnerView
                  ? 'As project owner, you can review applications and Accept or Reject them.'
                  : 'Manage applicant requests for this project.'}
              </p>
            </div>

            <div className="dbms-badge" title="Relational Relationship">
              <span>FOREIGN KEY (project_id) REFERENCES projects(id)</span>
            </div>
          </div>

          {/* Action Notification (UPDATE confirmation) */}
          {actionNotice && (
            <div className="alert alert-info" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
              <CheckCircle size={16} style={{ flexShrink: 0 }} />
              <span>{actionNotice}</span>
            </div>
          )}

          {/* Requests List */}
          {requests.length > 0 ? (
            <div className="requests-list">
              {requests.map((req) => (
                <div key={req.id} className={`request-card ${req.status.toLowerCase()}`}>
                  <div className="request-header">
                    <div>
                      <div className="request-applicant-name">
                        <User size={16} style={{ color: 'var(--primary-blue)' }} />
                        <span>{req.applicantName}</span>
                      </div>
                      <div className="request-applicant-email">
                        <Mail size={13} />
                        <a href={`mailto:${req.applicantEmail}`}>{req.applicantEmail}</a>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`status-badge ${req.status.toLowerCase()}`}>
                        {req.status === 'Pending' && <Clock size={12} />}
                        {req.status === 'Accepted' && <Check size={12} />}
                        {req.status === 'Rejected' && <X size={12} />}
                        {req.status}
                      </span>
                    </div>
                  </div>

                  {/* Applicant Message / Pitch */}
                  <div className="request-message-box">
                    <p>"{req.message}"</p>
                  </div>

                  {/* Footer with date and Owner Actions (Accept / Reject) */}
                  <div className="request-actions">
                    <span className="request-date">Applied on {req.createdAt}</span>

                    {/* Accept / Reject buttons (Active for Pending status) */}
                    {req.status === 'Pending' ? (
                      <div className="request-buttons">
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => handleUpdateStatus(req.id, 'Accepted', req.applicantName)}
                        >
                          <Check size={14} />
                          <span>Accept Request</span>
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
                        Status decided: <strong>{req.status.toUpperCase()}</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '2rem 1.5rem', margin: '1rem 0' }}>
              <div className="empty-state-icon" style={{ width: '44px', height: '44px', marginBottom: '0.75rem' }}>
                <Inbox size={22} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                No Join Requests in Database
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Interested students will appear here when they request to join this project.
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsModalOpen(true)}
              >
                <Send size={14} />
                <span>Submit a Test Join Request</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================== JOIN REQUEST MODAL ==================== */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Request to Join</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Project: <strong>{project.title}</strong>
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} noValidate>
              <div className="modal-body">
                {formErrors.submit && (
                  <div className="alert alert-info" style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c', marginBottom: '1rem' }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{formErrors.submit}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="applicantName" className="form-label">
                    Your Full Name <span className="required-star">*</span>
                  </label>
                  <input
                    id="applicantName"
                    name="applicantName"
                    type="text"
                    className={`form-control ${formErrors.applicantName ? 'input-error' : ''}`}
                    placeholder="e.g. Aniket Deshmukh"
                    value={requestFormData.applicantName}
                    onChange={handleFormChange}
                  />
                  {formErrors.applicantName && (
                    <p className="error-text">
                      <AlertCircle size={13} /> {formErrors.applicantName}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="applicantEmail" className="form-label">
                    Your Contact Email <span className="required-star">*</span>
                  </label>
                  <input
                    id="applicantEmail"
                    name="applicantEmail"
                    type="email"
                    className={`form-control ${formErrors.applicantEmail ? 'input-error' : ''}`}
                    placeholder="e.g. aniket.d@college.edu"
                    value={requestFormData.applicantEmail}
                    onChange={handleFormChange}
                  />
                  {formErrors.applicantEmail && (
                    <p className="error-text">
                      <AlertCircle size={13} /> {formErrors.applicantEmail}
                    </p>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="message" className="form-label">
                    Pitch / Relevant Skills <span className="required-star">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="3"
                    className={`form-control ${formErrors.message ? 'input-error' : ''}`}
                    placeholder="Briefly state why you want to join and what you can contribute (e.g., frontend, database, AI algorithms)..."
                    value={requestFormData.message}
                    onChange={handleFormChange}
                  />
                  {formErrors.message && (
                    <p className="error-text">
                      <AlertCircle size={13} /> {formErrors.message}
                    </p>
                  )}
                  <p className="form-helper" style={{ marginTop: '0.4rem' }}>
                    DBMS Action: Submits a new row into PostgreSQL <code>join_requests</code> with status = 'Pending'.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingJoin}>
                  <Send size={15} />
                  <span>{isSubmittingJoin ? 'Saving...' : 'Send Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
