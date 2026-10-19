import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, PlusCircle, Compass, Database } from 'lucide-react';
import { createProject } from '../utils/api';

/**
 * Page 2: Add a Project
 * Form allowing students to publish a new project idea directly into PostgreSQL.
 * DBMS: Executes INSERT INTO projects (...) VALUES (...);
 */
export default function AddProject() {
  const initialFormData = {
    title: '',
    description: '',
    category: 'Web Development',
    requiredSkills: '',
    teamSize: '4',
    contactEmail: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newlyCreatedProject, setNewlyCreatedProject] = useState(null);
  const [serverError, setServerError] = useState(null);

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    } else if (formData.title.trim().length < 4) {
      newErrors.title = 'Title must be at least 4 characters long';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    } else if (formData.description.trim().length < 15) {
      newErrors.description = 'Description should be at least 15 characters long';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a project category';
    }

    if (!formData.requiredSkills.trim()) {
      newErrors.requiredSkills = 'Please specify at least one skill or technology';
    }

    const teamNum = Number(formData.teamSize);
    if (!formData.teamSize || isNaN(teamNum) || teamNum < 1 || teamNum > 20) {
      newErrors.teamSize = 'Enter a valid team size between 1 and 20';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!emailRegex.test(formData.contactEmail.trim())) {
      newErrors.contactEmail = 'Please enter a valid email address (e.g., student@college.edu)';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Save project into PostgreSQL database
      const saved = await createProject(formData);
      setNewlyCreatedProject(saved);
      setFormData(initialFormData);
      setErrors({});
    } catch (err) {
      console.error('Failed to save project:', err);
      setServerError(err.message || 'Failed to save project to PostgreSQL database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setNewlyCreatedProject(null);
    setServerError(null);
  };

  return (
    <div>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 className="page-title">Share Your Idea</h1>
        <p className="page-subtitle">
          Have an interesting project concept? Save it to PostgreSQL so peers can explore and apply.
        </p>
      </div>

      <div className="form-card">
        {/* Server Error Alert */}
        {serverError && (
          <div className="alert alert-info" style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c' }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Success Alert Banner */}
        {newlyCreatedProject && (
          <div className="alert alert-success" style={{ flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckCircle2 size={22} style={{ color: '#059669', flexShrink: 0 }} />
              <div>
                <h4 className="alert-title">Project Inserted into PostgreSQL!</h4>
                <p>
                  "<strong>{newlyCreatedProject.title}</strong>" is now stored in the database and visible under Explore Projects and My Projects.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <Link to={`/project/${newlyCreatedProject.id}`} className="btn btn-primary btn-sm">
                <span>View Project Details</span>
                <ArrowRight size={14} />
              </Link>
              <Link to="/my-projects" className="btn btn-secondary btn-sm">
                <span>Go to My Projects</span>
              </Link>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddAnother}
              >
                <PlusCircle size={14} />
                <span>Submit Another Idea</span>
              </button>
            </div>
          </div>
        )}

        {/* Project Creation Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Project Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Project Title <span className="required-star">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className={`form-control ${errors.title ? 'input-error' : ''}`}
              placeholder="e.g. Smart Campus Navigation System"
              value={formData.title}
              onChange={handleChange}
            />
            {errors.title ? (
              <p className="error-text">
                <AlertCircle size={13} /> {errors.title}
              </p>
            ) : (
              <p className="form-helper">Give your project a concise and catchy title.</p>
            )}
          </div>

          {/* Project Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Project Description <span className="required-star">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              className={`form-control ${errors.description ? 'input-error' : ''}`}
              placeholder="Explain the problem your project solves, target users, and what makes it unique..."
              value={formData.description}
              onChange={handleChange}
            />
            {errors.description ? (
              <p className="error-text">
                <AlertCircle size={13} /> {errors.description}
              </p>
            ) : (
              <p className="form-helper">Provide sufficient context so other students understand the objective.</p>
            )}
          </div>

          {/* Category & Maximum Team Size */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category" className="form-label">
                Category <span className="required-star">*</span>
              </label>
              <select
                id="category"
                name="category"
                className={`form-control ${errors.category ? 'input-error' : ''}`}
                value={formData.category}
                onChange={handleChange}
              >
                <option value="Web Development">Web Development</option>
                <option value="AI/ML">AI/ML</option>
                <option value="App Development">App Development</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && (
                <p className="error-text">
                  <AlertCircle size={13} /> {errors.category}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="teamSize" className="form-label">
                Maximum Team Size <span className="required-star">*</span>
              </label>
              <input
                id="teamSize"
                name="teamSize"
                type="number"
                min="1"
                max="20"
                className={`form-control ${errors.teamSize ? 'input-error' : ''}`}
                placeholder="4"
                value={formData.teamSize}
                onChange={handleChange}
              />
              {errors.teamSize ? (
                <p className="error-text">
                  <AlertCircle size={13} /> {errors.teamSize}
                </p>
              ) : (
                <p className="form-helper">Total members needed (including lead).</p>
              )}
            </div>
          </div>

          {/* Required Skills */}
          <div className="form-group">
            <label htmlFor="requiredSkills" className="form-label">
              Required Skills / Tech Stack <span className="required-star">*</span>
            </label>
            <input
              id="requiredSkills"
              name="requiredSkills"
              type="text"
              className={`form-control ${errors.requiredSkills ? 'input-error' : ''}`}
              placeholder="e.g. React, Python, PostgreSQL, REST APIs"
              value={formData.requiredSkills}
              onChange={handleChange}
            />
            {errors.requiredSkills ? (
              <p className="error-text">
                <AlertCircle size={13} /> {errors.requiredSkills}
              </p>
            ) : (
              <p className="form-helper">Separate multiple skills with commas.</p>
            )}
          </div>

          {/* Contact Email */}
          <div className="form-group">
            <label htmlFor="contactEmail" className="form-label">
              Contact Email <span className="required-star">*</span>
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              className={`form-control ${errors.contactEmail ? 'input-error' : ''}`}
              placeholder="e.g. student@college.edu"
              value={formData.contactEmail}
              onChange={handleChange}
            />
            {errors.contactEmail ? (
              <p className="error-text">
                <AlertCircle size={13} /> {errors.contactEmail}
              </p>
            ) : (
              <p className="form-helper">Your college email for notifications and applications.</p>
            )}
          </div>

          {/* Form Actions */}
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.85rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={isSubmitting}
            >
              <Database size={16} />
              <span>{isSubmitting ? 'Saving to Database...' : 'Submit Project to PostgreSQL'}</span>
            </button>
            <Link to="/" className="btn btn-secondary">
              <Compass size={17} />
              <span>Cancel</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
