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
 * Clean, professional student collaboration view.
 * - Project Owner sees all incoming requests with Accept/Reject actions for Pending requests.
 * - Applicants see only their own request status (Pending, Accepted, Rejected) without action buttons.
 * - Non-owners who haven't applied see only project details and the "Request to Join" button.
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

  // Determine whether current user is the owner of this project
  const isOwner = Boolean(
    project && (project.ownerId === CURRENT_USER_ID || project.createdByCurrentUser)
  );

  // Check if current user has already submitted a request for this project
  const myRequest = requests.find(
    (r) =>
      r.userId === CURRENT_USER_ID ||
      (r.applicantEmail &&
        CURRENT_USER_EMAIL &&
        r.applicantEmail.toLowerCase() === CURRENT_USER_EMAIL.toLowerCase())
  );

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
        'Your request to join has been submitted! It is now pending review by the project owner.'
      );
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to submit join request.' });
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  // Owner action: Accept or Reject request
  const handleUpdateStatus = async (requestId, newStatus, applicantName) => {
    try {
      await updateJoinRequestStatus(requestId, newStatus);
      await loadRequests(project.id);
      setActionNotice(
        `Application from ${applicantName} has been ${newStatus.toLowerCase()}.`
      );
      setTimeout(() => {
        setActionNotice(null);
      }, 4000);
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(`Could not update status: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading project details...</p>
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
            The project you are looking for (ID: <code>{id}</code>) does not exist or may have been deleted.
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
        {/* Header: Category Badge & Title */}
        <div className="details-header">
          <div className="details-category">
            <span className={`badge ${getCategoryBadgeClass(project.category)}`}>
              {project.category}
            </span>
            {isOwner && (
              <span className="badge badge-my-project" style={{ marginLeft: '0.5rem' }}>
                Your Project
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
                <div className="details-meta-label">Date Posted</div>
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
          {isOwner ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.1rem',
                backgroundColor: 'var(--primary-blue-light)',
                color: 'var(--primary-blue)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.925rem',
                border: '1px solid #bfdbfe'
              }}
            >
              <User size={16} />
              <span>You own this project</span>
            </div>
          ) : myRequest ? (
            <button
              type="button"
              className="btn btn-secondary"
              disabled
              style={{ cursor: 'default', opacity: 0.9 }}
            >
              <CheckCircle
                size={16}
                style={{
                  color:
                    myRequest.status === 'Accepted'
                      ? '#10b981'
                      : myRequest.status === 'Rejected'
                      ? '#ef4444'
                      : '#f59e0b'
                }}
              />
              <span>Request Submitted ({myRequest.status})</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              <Send size={16} />
              <span>Request to Join This Project</span>
            </button>
          )}

          <Link to="/" className="btn btn-secondary">
            <ArrowLeft size={16} />
            <span>Back to Explore Projects</span>
          </Link>
        </div>

        {/* ==================== CONDITIONAL REQUESTS SECTION ==================== */}

        {/* CASE 1: PROJECT OWNER VIEW (Sees all incoming requests with Accept/Reject actions) */}
        {isOwner && (
          <div className="join-requests-section">
            <div className="section-badge-header">
              <div>
                <h2 className="details-section-title" style={{ marginBottom: '0.25rem' }}>
                  Incoming Join Requests ({requests.length})
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Review applications from students interested in joining your project.
                </p>
              </div>
            </div>

            {/* Action Notification */}
            {actionNotice && (
              <div className="alert alert-info" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
                <CheckCircle size={16} style={{ flexShrink: 0 }} />
                <span>{actionNotice}</span>
              </div>
            )}

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

                    {/* Applicant Pitch */}
                    <div className="request-message-box">
                      <p>"{req.message}"</p>
                    </div>

                    {/* Footer with date and Owner Actions */}
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
              <div className="empty-state" style={{ padding: '2rem 1.5rem', margin: '1rem 0' }}>
                <div className="empty-state-icon" style={{ width: '44px', height: '44px', marginBottom: '0.75rem' }}>
                  <Inbox size={22} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  No Join Requests Yet
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  When other students request to join your project, their applications will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* CASE 2: APPLICANT VIEW (Sees only their own request status, with NO Accept/Reject buttons) */}
        {!isOwner && myRequest && (
          <div className="join-requests-section">
            <div className="section-badge-header">
              <div>
                <h2 className="details-section-title" style={{ marginBottom: '0.25rem' }}>
                  Your Join Request Status
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  You have applied to join this project. Here is the current status of your request:
                </p>
              </div>
            </div>

            <div className={`request-card ${myRequest.status.toLowerCase()}`}>
              <div className="request-header">
                <div>
                  <div className="request-applicant-name">
                    <User size={16} style={{ color: 'var(--primary-blue)' }} />
                    <span>Your Application ({myRequest.applicantName})</span>
                  </div>
                  <div className="request-applicant-email">
                    <Mail size={13} />
                    <span>{myRequest.applicantEmail}</span>
                  </div>
                </div>

                <span className={`status-badge ${myRequest.status.toLowerCase()}`}>
                  {myRequest.status === 'Pending' && <Clock size={12} />}
                  {myRequest.status === 'Accepted' && <Check size={12} />}
                  {myRequest.status === 'Rejected' && <X size={12} />}
                  {myRequest.status}
                </span>
              </div>

              {/* Status explanation for the applicant */}
              {myRequest.status === 'Accepted' && (
                <div
                  style={{
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                    marginBottom: '0.75rem'
                  }}
                >
                  🎉 <strong>Accepted!</strong> The project lead has accepted your request. Reach out at{' '}
                  <a href={`mailto:${project.contactEmail}`} style={{ textDecoration: 'underline', fontWeight: 600 }}>
                    {project.contactEmail}
                  </a>{' '}
                  to coordinate and begin working together!
                </div>
              )}

              {myRequest.status === 'Pending' && (
                <div
                  style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                    marginBottom: '0.75rem'
                  }}
                >
                  ⏳ <strong>Pending Review:</strong> Your request has been sent to the project owner (
                  <strong>{project.owner}</strong>). You will see an update here once they respond.
                </div>
              )}

              {myRequest.status === 'Rejected' && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                    marginBottom: '0.75rem'
                  }}
                >
                  Your request to join this project was not accepted by the project owner. Feel free to explore other projects!
                </div>
              )}

              {/* Your submitted pitch */}
              <div className="request-message-box">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Your note to the project lead:
                </span>
                <p>"{myRequest.message}"</p>
              </div>

              <div className="request-actions">
                <span className="request-date">Submitted on {myRequest.createdAt}</span>
              </div>
            </div>
          </div>
        )}

        {/* CASE 3: Unrelated student who has NOT applied sees NO requests section at all.
            This ensures applicant privacy is completely maintained. */}
      </div>

      {/* ==================== JOIN REQUEST MODAL ==================== */}
      {isModalOpen && !isOwner && !myRequest && (
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
                  <div
                    className="alert alert-info"
                    style={{
                      backgroundColor: '#fef2f2',
                      borderColor: '#fca5a5',
                      color: '#b91c1c',
                      marginBottom: '1rem'
                    }}
                  >
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
                    placeholder="e.g. Rakesh Kumar"
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
                    placeholder="e.g. rakesh.kumar@college.edu"
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
                    placeholder="Briefly state why you want to join and what skills you can contribute..."
                    value={requestFormData.message}
                    onChange={handleFormChange}
                  />
                  {formErrors.message && (
                    <p className="error-text">
                      <AlertCircle size={13} /> {formErrors.message}
                    </p>
                  )}
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
                  <span>{isSubmittingJoin ? 'Submitting...' : 'Send Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
