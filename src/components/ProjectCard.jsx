import React from 'react';
import { Link } from 'react-router-dom';
import { User, Users, ArrowRight, Trash2, Tag, Database } from 'lucide-react';

/**
 * ProjectCard component
 * Reusable card displaying project overview, skills, owner, and action buttons.
 */
export default function ProjectCard({ project, showDelete = false, onDelete }) {
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

  // Parse comma-separated skills for display as individual chips
  
const skillsList = Array.isArray(project.requiredSkills)
  ? project.requiredSkills
      .map((s) => String(s).trim())
      .filter(Boolean)
  : typeof project.requiredSkills === 'string'
    ? project.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];


  const handleDelete = () => {
    if (onDelete) {
      onDelete(project.id, project.title);
    }
  };

  return (
    <div className="project-card">
      <div>
        {/* Card Header: Category & My Project badge */}
        <div className="project-card-header">
          

<span
  className={`badge ${getCategoryBadgeClass(project.category || 'Other')}`}
>
  {project.category || 'Other'}
</span>


          {project.createdByCurrentUser && (
            <span className="badge badge-my-project" title="Created by active test user in PostgreSQL">
              Your Project
            </span>
          )}
        </div>

        {/* Project Title */}
        <h3 className="project-card-title">
          <Link to={`/project/${project.id}`} className="project-card-title-link">
            {project.title}
          </Link>
        </h3>

        {/* Short Description */}
        <p className="project-card-desc">{project.description}</p>

        {/* Meta Info */}
        <div className="project-card-meta">
          <div className="meta-row">
            <User size={15} className="meta-icon" />
            <span>
              <strong className="meta-label">Lead:</strong> {project.owner || 'Student'}
            </span>
          </div>

          {project.teamSize && (
            <div className="meta-row">
              <Users size={15} className="meta-icon" />
              <span>
                <strong className="meta-label">Team Size:</strong> Up to {project.teamSize} members
              </span>
            </div>
          )}

          {skillsList.length > 0 && (
            <div>
              <div className="meta-row" style={{ marginBottom: '0.25rem' }}>
                <Tag size={14} className="meta-icon" />
                <span className="meta-label">Required Skills:</span>
              </div>
              <div className="skills-tags">
                {skillsList.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="project-card-footer">
        <Link to={`/project/${project.id}`} className="btn btn-primary btn-sm">
          <span>{project.createdByCurrentUser ? 'Manage & Details' : 'View Details'}</span>
          <ArrowRight size={14} />
        </Link>

        {showDelete && (
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            title="Delete this project from PostgreSQL"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        )}
      </div>
    </div>
  );
}
