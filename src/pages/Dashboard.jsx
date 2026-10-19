import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
  Layers,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { getDashboardData } from '../utils/api';

/**
 * Collaboration Dashboard
 * Presents high-level student collaboration statistics, category distributions,
 * most requested initiatives, and a detailed project collaboration table.
 */
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await getDashboardData();
      setData(response);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError(err.message || 'Unable to connect to the backend server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

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

  // Prevent placeholder or test strings from leaking into the UI
  const sanitizeOwner = (name) => {
    if (!name || typeof name !== 'string') return 'Student Lead';
    const trimmed = name.trim();
    if (trimmed.toLowerCase() === 'string' || trimmed.toLowerCase() === 'null' || trimmed === '') {
      return 'Student Lead';
    }
    return trimmed;
  };

  const getInitials = (name) => {
    const clean = sanitizeOwner(name);
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return clean.slice(0, 2).toUpperCase();
  };

  return (
    <div className="dashboard-container">
      {/* Executive Header */}
      <header className="dashboard-header-modern">
        <div className="dashboard-header-text">
          <div className="dashboard-badge-row">
            <span className="platform-tagline">
              <Sparkles size={13} className="text-purple" />
              <span>Platform Activity</span>
            </span>
            <span className="live-status-pill">
              <span className="live-dot"></span>
              <span>Live Updates</span>
            </span>
          </div>

          <h1 className="dashboard-main-title">Collaboration Dashboard</h1>
          <p className="dashboard-main-subtitle">
            Overview of project demand, team join requests, and student engagement across campus.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            type="button"
            onClick={() => fetchMetrics(true)}
            disabled={loading || refreshing}
            className="btn btn-secondary btn-refresh"
            title="Reload latest statistics"
          >
            <RefreshCw size={15} className={refreshing ? 'spin-animation' : ''} />
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="dashboard-status-card">
          <div className="modern-spinner"></div>
          <h3 className="status-card-title">Loading Dashboard Metrics...</h3>
          <p className="status-card-text">Fetching the latest project counts and collaboration requests.</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="dashboard-status-card status-card-error">
          <div className="error-icon-bubble">
            <AlertCircle size={28} />
          </div>
          <h3 className="status-card-title">Unable to Load Dashboard</h3>
          <p className="status-card-text">{error}</p>
          <button
            type="button"
            onClick={() => fetchMetrics()}
            className="btn btn-primary btn-sm"
            style={{ marginTop: '1.25rem' }}
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Main Dashboard Content */}
      {!loading && !error && data && (
        <div className="dashboard-content-stack">
          {/* Section 1: Key Statistics Cards */}
          <section className="stats-cards-grid" aria-label="Key Performance Indicators">
            {/* Stat 1: Total Projects */}
            <div className="modern-stat-card card-accent-blue">
              <div className="stat-card-top">
                <span className="stat-card-title">Total Projects</span>
                <div className="stat-card-icon icon-bg-blue">
                  <FolderKanban size={20} />
                </div>
              </div>
              <div className="stat-card-value">{data.summary.total_projects}</div>
              <div className="stat-card-caption">Active innovation projects</div>
            </div>

            {/* Stat 2: Total Join Requests */}
            <div className="modern-stat-card card-accent-purple">
              <div className="stat-card-top">
                <span className="stat-card-title">Total Requests</span>
                <div className="stat-card-icon icon-bg-purple">
                  <Users size={20} />
                </div>
              </div>
              <div className="stat-card-value">{data.summary.total_join_requests}</div>
              <div className="stat-card-caption">All student applications</div>
            </div>

            {/* Stat 3: Pending Review */}
            <div className="modern-stat-card card-accent-amber">
              <div className="stat-card-top">
                <span className="stat-card-title">Pending Review</span>
                <div className="stat-card-icon icon-bg-amber">
                  <Clock size={20} />
                </div>
              </div>
              <div className="stat-card-value">{data.summary.pending_join_requests}</div>
              <div className="stat-card-caption">Awaiting owner response</div>
            </div>

            {/* Stat 4: Accepted Requests */}
            <div className="modern-stat-card card-accent-green">
              <div className="stat-card-top">
                <span className="stat-card-title">Accepted Members</span>
                <div className="stat-card-icon icon-bg-green">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <div className="stat-card-value">{data.summary.accepted_join_requests}</div>
              <div className="stat-card-caption">Confirmed team collaborators</div>
            </div>
          </section>

          {/* Section 2: Split Grid (Category Distribution & Popular Projects) */}
          <section className="dashboard-split-grid">
            {/* Column A: Category Analytics */}
            <div className="modern-panel">
              <div className="panel-header">
                <div className="panel-header-title-group">
                  <div className="panel-icon-box">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h2 className="panel-heading">Projects by Category</h2>
                    <p className="panel-subheading">Distribution across academic & tech domains</p>
                  </div>
                </div>
              </div>

              {data.categories && data.categories.length > 0 ? (
                <div className="category-analytics-list">
                  {data.categories.map((cat) => {
                    const total = data.summary.total_projects || 1;
                    const percentage = Math.round((cat.count / total) * 100);
                    return (
                      <div key={cat.category} className="category-analytic-row">
                        <div className="category-row-meta">
                          <span className={`badge ${getCategoryBadgeClass(cat.category)}`}>
                            {cat.category}
                          </span>
                          <span className="category-stats-pill">
                            <strong>{cat.count}</strong> {cat.count === 1 ? 'project' : 'projects'}
                            <span className="category-percent-muted">({percentage}%)</span>
                          </span>
                        </div>

                        <div className="category-bar-track">
                          <div
                            className="category-bar-value"
                            style={{ width: `${percentage}%` }}
                            role="progressbar"
                            aria-valuenow={percentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="empty-panel-text">No category data recorded yet.</p>
              )}
            </div>

            {/* Column B: Popular Projects Showcase */}
            <div className="modern-panel">
              <div className="panel-header">
                <div className="panel-header-title-group">
                  <div className="panel-icon-box panel-icon-purple">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <h2 className="panel-heading">Popular Projects</h2>
                    <p className="panel-subheading">Most requested initiatives by prospective teammates</p>
                  </div>
                </div>
                <Link to="/" className="panel-action-link" title="Explore all projects">
                  <span>Explore all</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {data.popular_projects && data.popular_projects.length > 0 ? (
                <div className="popular-cards-stack">
                  {data.popular_projects.map((proj, idx) => {
                    const ownerName = sanitizeOwner(proj.owner_name);
                    return (
                      <div key={proj.id} className="popular-item-card">
                        <div className="popular-rank-badge">#{idx + 1}</div>

                        <div className="popular-item-content">
                          <div className="popular-item-topline">
                            <span className={`badge ${getCategoryBadgeClass(proj.category)}`}>
                              {proj.category}
                            </span>
                            <span className="requests-volume-pill">
                              <Users size={12} />
                              <span>{proj.total_requests} {proj.total_requests === 1 ? 'Request' : 'Requests'}</span>
                            </span>
                          </div>

                          <h3 className="popular-item-title">
                            <Link to={`/project/${proj.id}`} className="popular-title-anchor" title={proj.title}>
                              {proj.title}
                            </Link>
                          </h3>

                          <div className="popular-item-footer">
                            <div className="popular-lead-profile">
                              <div className="lead-avatar-sm" aria-hidden="true">
                                {getInitials(ownerName)}
                              </div>
                              <span className="lead-name-text">
                                Lead: <strong>{ownerName}</strong>
                              </span>
                            </div>

                            <span className="accepted-count-tag">
                              <CheckCircle2 size={13} />
                              <span>{proj.accepted_requests} accepted</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="empty-panel-text">No join requests received yet.</p>
              )}
            </div>
          </section>

          {/* Section 3: Project Collaboration Summary Table */}
          <section className="modern-panel">
            <div className="panel-header">
              <div className="panel-header-title-group">
                <div className="panel-icon-box panel-icon-blue">
                  <FolderKanban size={18} />
                </div>
                <div>
                  <h2 className="panel-heading">Project Collaboration Overview</h2>
                  <p className="panel-subheading">
                    Tracking applicant interest, review status, and team members across all projects
                  </p>
                </div>
              </div>
              <div className="total-projects-pill">
                {data.collaboration_table ? data.collaboration_table.length : 0} Total Projects
              </div>
            </div>

            {data.collaboration_table && data.collaboration_table.length > 0 ? (
              <div className="clean-table-container">
                <table className="modern-collab-table">
                  <thead>
                    <tr>
                      <th style={{ width: '38%' }}>Project Details</th>
                      <th style={{ width: '22%' }}>Project Lead</th>
                      <th style={{ width: '16%' }}>Category</th>
                      <th style={{ width: '8%', textAlign: 'center' }}>Total</th>
                      <th style={{ width: '8%', textAlign: 'center' }}>Pending</th>
                      <th style={{ width: '8%', textAlign: 'center' }}>Accepted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.collaboration_table.map((row) => {
                      const cleanOwner = sanitizeOwner(row.owner_name);
                      return (
                        <tr key={row.id}>
                          {/* Project Title + Link */}
                          <td>
                            <div className="table-project-cell">
                              <Link
                                to={`/project/${row.id}`}
                                className="table-title-link"
                                title={row.title}
                              >
                                {row.title}
                              </Link>
                            </div>
                          </td>

                          {/* Owner / Lead */}
                          <td>
                            <div className="table-lead-cell">
                              <div className="lead-avatar-sm" aria-hidden="true">
                                {getInitials(cleanOwner)}
                              </div>
                              <span className="table-owner-name">{cleanOwner}</span>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td>
                            <span className={`badge ${getCategoryBadgeClass(row.category)}`}>
                              {row.category}
                            </span>
                          </td>

                          {/* Total Requests */}
                          <td style={{ textAlign: 'center' }}>
                            <span className={`pill-metric ${row.total_requests > 0 ? 'metric-blue' : 'metric-muted'}`}>
                              {row.total_requests}
                            </span>
                          </td>

                          {/* Pending Requests */}
                          <td style={{ textAlign: 'center' }}>
                            <span className={`pill-metric ${row.pending_requests > 0 ? 'metric-amber' : 'metric-muted'}`}>
                              {row.pending_requests}
                            </span>
                          </td>

                          {/* Accepted Requests */}
                          <td style={{ textAlign: 'center' }}>
                            <span className={`pill-metric ${row.accepted_requests > 0 ? 'metric-green' : 'metric-muted'}`}>
                              {row.accepted_requests}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-panel-centered">
                <FolderKanban size={36} color="var(--text-muted)" />
                <h4 style={{ marginTop: '0.75rem', fontWeight: 600 }}>No Projects Registered</h4>
                <p className="empty-panel-text">Create your first project to view collaboration statistics.</p>
                <Link to="/add-project" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                  Add a Project
                </Link>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
