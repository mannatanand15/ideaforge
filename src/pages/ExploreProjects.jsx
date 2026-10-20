import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Filter, PlusCircle, Database, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import { getProjects, checkBackendHealth } from '../utils/api';

/**
 * Page 1: Explore Projects — Home Page
 * Fetches projects directly from PostgreSQL via FastAPI backend.
 * Supports real-time search by title (ILIKE) and filtering by category.
 */
export default function ExploreProjects() {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState(null);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth().then((status) => {
      setBackendStatus(status);
    });
  }, []);

  // Fetch projects from PostgreSQL whenever search or category changes
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const timer = setTimeout(() => {
      getProjects({ search: searchTerm, category: selectedCategory })
        .then((data) => {
          if (!isCancelled) {
            setProjects(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch projects:', err);
          if (!isCancelled) setLoading(false);
        });
    }, 200); // 200ms debounce for typing

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm, selectedCategory]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
  };

  return (
    <div>
      {/* Hero Header Section */}
      <section className="hero-section">
        <h1 className="hero-title">
          Discover Ideas. Find Your Team.{' '}
          <span className="hero-title-accent">Build Something Amazing.</span>
        </h1>
        <p className="hero-description">
          IdeaForge is a student innovation platform where you can share your college project
          concepts, discover exciting peer projects, and assemble the perfect team.
        </p>
      </section>

      {/* Search and Category Filter Bar */}
      <section className="filter-container">
        {/* Search by Title (PostgreSQL ILIKE query) */}
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search projects by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Dropdown (PostgreSQL WHERE category = ...) */}
        <div className="category-select-wrapper">
          <select
            className="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Web Development">Web Development</option>
            <option value="AI/ML">AI/ML</option>
            <option value="App Development">App Development</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </section>

      {/* Filter Statistics / Reset link */}
      <div className="filter-stats">
        <span>
          {loading ? (
            'Loading projects from database...'
          ) : (
            <>
              Showing <strong>{projects.length}</strong>{' '}
              {projects.length === 1 ? 'project' : 'projects'}
              {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
              {searchTerm ? ` matching "${searchTerm}"` : ''}
            </>
          )}
        </span>

        {(searchTerm !== '' || selectedCategory !== 'All') && (
          <button
            type="button"
            className="clear-filter-btn"
            onClick={handleResetFilters}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Projects Grid or Empty State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
          <p>Fetching projects from PostgreSQL...</p>
        </div>
      ) : projects.length > 0 ? (
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Filter size={28} />
          </div>
          <h3 className="empty-state-title">No Projects Found</h3>
          <p className="empty-state-desc">
            We couldn't find any projects matching your search criteria. Try a different search term or category.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
            <Link to="/add-project" className="btn btn-primary btn-sm">
              <PlusCircle size={14} />
              <span>Add a Project</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
