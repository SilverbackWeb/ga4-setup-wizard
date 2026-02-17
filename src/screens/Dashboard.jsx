import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

function Dashboard({ sessionId }) {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState(new Set());
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.client_info.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      project.setup_metadata.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  const handleNewSetup = () => {
    navigate('/wizard');
  };

  const toggleSelectForDelete = (projectId, e) => {
    e.stopPropagation();
    const newSelected = new Set(selectedForDelete);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedForDelete(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedForDelete.size === 0) {
      alert('Please select projects to delete');
      return;
    }

    const projectNames = filteredProjects
      .filter(p => selectedForDelete.has(p.id))
      .map(p => p.client_info.name)
      .join(', ');

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedForDelete.size} project(s)?\n\n${projectNames}\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    setDeleteInProgress(true);
    try {
      for (const projectId of selectedForDelete) {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error(`Failed to delete project ${projectId}`);
        }
      }

      // Reload projects after successful deletion
      await loadProjects();
      setSelectedForDelete(new Set());
      setIsDeleteMode(false);
      console.log('Projects deleted successfully');
    } catch (error) {
      console.error('Failed to delete projects:', error);
      alert('Failed to delete projects: ' + error.message);
    } finally {
      setDeleteInProgress(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteMode(false);
    setSelectedForDelete(new Set());
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Project Dashboard</h1>
        <div className="header-actions">
          {!isDeleteMode && (
            <>
              <button className="btn-settings" onClick={() => setIsDeleteMode(true)} title="Delete projects">
                ⚙️
              </button>
              <button className="btn btn-primary" onClick={handleNewSetup}>
                + New Setup
              </button>
            </>
          )}
          {isDeleteMode && (
            <>
              <div className="delete-info">
                {selectedForDelete.size > 0 && (
                  <span>{selectedForDelete.size} selected</span>
                )}
              </div>
              <button
                className="btn btn-danger"
                onClick={handleDeleteSelected}
                disabled={selectedForDelete.size === 0 || deleteInProgress}
              >
                🗑️ Delete
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleCancelDelete}
                disabled={deleteInProgress}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="dashboard-filters">
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="projects-grid">
        {isLoading ? (
          <div className="loading">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-state">
            <p>No projects found</p>
            <button className="btn btn-secondary" onClick={handleNewSetup}>
              Create Your First Setup
            </button>
          </div>
        ) : (
          filteredProjects.map(project => (
            <div
              key={project.id}
              className={`project-card ${selectedForDelete.has(project.id) ? 'selected-for-delete' : ''}`}
              onClick={() => !isDeleteMode && handleProjectClick(project.id)}
              style={{ cursor: isDeleteMode ? 'pointer' : 'pointer' }}
            >
              {isDeleteMode && (
                <div className="delete-checkbox-overlay">
                  <input
                    type="checkbox"
                    checked={selectedForDelete.has(project.id)}
                    onChange={(e) => toggleSelectForDelete(project.id, e)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <div className="project-card-header">
                <h3>{project.client_info.name}</h3>
                <span className={`status-badge status-${project.setup_metadata.status}`}>
                  {project.setup_metadata.status}
                </span>
              </div>
              <div className="project-card-body">
                <p className="project-domain">{project.client_info.domain}</p>
                <div className="project-stats">
                  <div className="stat">
                    <span className="stat-label">Events:</span>
                    <span className="stat-value">{project.events_configured.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Key Events:</span>
                    <span className="stat-value">
                      {project.key_events_marked?.filter(e => e.success).length || 0}
                    </span>
                  </div>
                </div>
                <p className="project-date">
                  {new Date(project.setup_metadata.completed_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;
