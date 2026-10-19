import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ExploreProjects from './pages/ExploreProjects';
import AddProject from './pages/AddProject';
import ProjectDetails from './pages/ProjectDetails';
import MyProjects from './pages/MyProjects';

/**
 * Main Application Component
 * Sets up client-side routing with React Router DOM for the four pages of IdeaForge.
 */
export default function App() {
  return (
    <Router>
      <div className="app-layout">
        {/* Navigation Bar */}
        <Navbar />

        {/* Main Routed Page Content */}
        <main className="main-content">
          <Routes>
            {/* Page 1: Explore Projects (Home) */}
            <Route path="/" element={<ExploreProjects />} />

            {/* Page 2: Add a Project */}
            <Route path="/add-project" element={<AddProject />} />

            {/* Page 3: Project Details */}
            <Route path="/project/:id" element={<ProjectDetails />} />

            {/* Page 4: My Projects */}
            <Route path="/my-projects" element={<MyProjects />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="footer">
          <p>
            <strong className="footer-highlight">IdeaForge</strong> — Turn Ideas Into Innovation
          </p>
          <p style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>
            College DBMS Project Frontend • Prepared for FastAPI & PostgreSQL Backend Integration
          </p>
        </footer>
      </div>
    </Router>
  );
}
