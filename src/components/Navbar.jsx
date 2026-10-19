import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Lightbulb, Compass, LayoutDashboard, PlusCircle, FolderKanban } from 'lucide-react';

/**
 * Navbar component for IdeaForge
 * Provides persistent navigation between Explore Projects, Add Project, and My Projects.
 */
export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Brand Logo & Name */}
        <Link to="/" className="nav-brand" title="IdeaForge - Home">
          <div className="nav-logo-icon">
            <Lightbulb size={20} strokeWidth={2.4} />
          </div>
          <span>IdeaForge</span>
        </Link>

        {/* Navigation Links */}
        <ul className="nav-links">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Compass size={17} />
              <span>Explore Projects</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={17} />
              <span>Dashboard</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/add-project"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <PlusCircle size={17} />
              <span>Add a Project</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/my-projects"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <FolderKanban size={17} />
              <span>My Projects</span>
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
