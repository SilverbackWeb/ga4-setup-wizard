import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/project-detail.css';

function ProjectDetail({ sessionId }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [dateRange, setDateRange] = useState('30daysAgo');
  const [isLoading, setIsLoading] = useState(true);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (project && sessionId) {
      loadPerformance();
    }
  }, [project, dateRange, sessionId]);

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPerformance = async () => {
    setPerformanceLoading(true);
    try {
      if (!sessionId) {
        console.warn('No sessionId available for fetching performance data');
        setPerformanceLoading(false);
        return;
      }

      const eventNames = project.events_configured
        .filter(e => e.enabled)
        .map(e => {
          const mapping = {
            phoneCall: 'call_now_click',
            thankYouPage: 'thank_you_page',
            ctaClick: 'cta_click'
          };
          return mapping[e.type] || e.type;
        });

      console.log('Fetching performance data:', {
        propertyId: project.client_info.ga4_property_id,
        eventNames,
        dateRange,
        sessionId: sessionId ? 'present' : 'missing'
      });

      const response = await fetch('/api/ga4/events/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          propertyId: project.client_info.ga4_property_id,
          eventNames,
          startDate: dateRange,
          endDate: 'today'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${errorData.message || errorData.error}`);
      }

      const data = await response.json();
      console.log('Performance data received:', data);
      setPerformance(data.data);
    } catch (error) {
      console.error('Failed to load performance:', error.message);
    } finally {
      setPerformanceLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading project...</div>;
  }

  if (!project) {
    return <div className="error">Project not found</div>;
  }

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`Copied ${label}: ${text}`);
  };

  const eventNameLabels = {
    call_now_click: 'Call Button Clicks',
    thank_you_page: 'Thank You Page Views',
    cta_click: 'CTA Button Clicks',
    phoneCall: 'Call Button Clicks',
    thankYouPage: 'Thank You Page Views',
    ctaClick: 'CTA Button Clicks'
  };

  return (
    <div className="project-detail-container">
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Back to Dashboard
        </button>
        <div className="header-top">
          <div className="header-left">
            <h1>{project.client_info.name}</h1>
            <p className="project-domain">{project.client_info.domain}</p>
          </div>
          <div className="header-buttons">
            <button className="btn btn-secondary" onClick={() => {
              navigate(`/test/${projectId}`);
            }}>
              🧪 Test Setup
            </button>
            <button className="btn btn-primary" onClick={() => {
              if (sessionId) {
                navigate(`/wizard/edit/${projectId}`, { state: { sessionId } });
              } else {
                // Store projectIdForEdit in localStorage so it persists through OAuth redirect
                // Clear sessionId to force fresh authentication in edit mode
                localStorage.removeItem('sessionId');
                localStorage.setItem('projectIdForEdit', projectId);
                navigate('/wizard');
              }
            }}>
              + Add Features
            </button>
          </div>
        </div>
      </div>

      {/* Feature Status Badges */}
      <div className="features-status">
        <h3>Configured Features</h3>
        <div className="feature-badges">
          <span className={`feature-badge ${project.features_configured?.gtm_triggers ? 'active' : 'inactive'}`}>
            {project.features_configured?.gtm_triggers ? '✓' : '○'} GTM Triggers
          </span>
          <span className={`feature-badge ${project.features_configured?.ga4_tags ? 'active' : 'inactive'}`}>
            {project.features_configured?.ga4_tags ? '✓' : '○'} GA4 Tags
          </span>
          <span className={`feature-badge ${project.features_configured?.google_ads ? 'active' : 'inactive'}`}>
            {project.features_configured?.google_ads ? '✓' : '○'} Google Ads
          </span>
          <span className={`feature-badge ${project.features_configured?.enhanced_conversions ? 'active' : 'inactive'}`}>
            {project.features_configured?.enhanced_conversions ? '✓' : '○'} Enhanced Conversions
          </span>
        </div>
      </div>

      <div className="detail-meta">
        <div className="meta-item">
          <span className="label">Setup Date:</span>
          <span className="value">
            {new Date(project.setup_metadata.completed_at).toLocaleString()}
          </span>
        </div>
        <div className="meta-item">
          <span className="label">GA4 Property:</span>
          <div className="id-row">
            <span
              className="value-link clickable-id"
              onClick={() => copyToClipboard(project.client_info.ga4_property_id, 'GA4 Property ID')}
              title="Click to copy"
            >
              {project.client_info.ga4_property_id}
            </span>
            <a
              href="https://analytics.google.com/analytics/web/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-open-small"
              title="Open GA4 (manually search for property)"
            >
              Open GA4 →
            </a>
          </div>
        </div>
        <div className="meta-item">
          <span className="label">Measurement ID:</span>
          <span
            className="value clickable-id"
            onClick={() => copyToClipboard(project.client_info.ga4_measurement_id, 'Measurement ID')}
            title="Click to copy"
          >
            {project.client_info.ga4_measurement_id}
          </span>
        </div>
        <div className="meta-item">
          <span className="label">GTM Container:</span>
          <div className="id-row">
            <span
              className="value-link clickable-id"
              onClick={() => copyToClipboard(project.client_info.gtm_container_id, 'GTM Container ID')}
              title="Click to copy"
            >
              {project.client_info.gtm_container_id}
            </span>
            <a
              href="https://tagmanager.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-open-small"
              title="Open GTM (manually search for container)"
            >
              Open GTM →
            </a>
          </div>
        </div>
        {project.client_info.google_ads_account && (
          <div className="meta-item">
            <span className="label">Google Ads:</span>
            <a
              href={`https://ads.google.com/aw/campaigns`}
              target="_blank"
              rel="noopener noreferrer"
              className="value-link"
            >
              {project.client_info.google_ads_account}
            </a>
          </div>
        )}
      </div>

      <div className="performance-section">
        <div className="section-header">
          <h2>Event Performance</h2>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="date-range-select"
          >
            <option value="7daysAgo">Last 7 Days</option>
            <option value="30daysAgo">Last 30 Days</option>
            <option value="90daysAgo">Last 90 Days</option>
          </select>
        </div>

        {!sessionId ? (
          <div className="auth-required">
            <p>Please authenticate to view live performance data</p>
            <button className="btn btn-primary" onClick={() => navigate('/wizard')}>
              Authenticate
            </button>
          </div>
        ) : performanceLoading ? (
          <div className="loading">Loading performance data...</div>
        ) : !performance || !performance.rows || performance.rows.length === 0 ? (
          <div className="no-data">
            <p>No event data available for the selected date range</p>
          </div>
        ) : (
          <div className="performance-grid">
            {performance.rows.map((row, index) => {
              const eventName = row.dimensionValues[0].value;
              const eventCount = parseInt(row.metricValues[0].value) || 0;
              const conversions = parseInt(row.metricValues[1].value) || 0;
              const users = parseInt(row.metricValues[2].value) || 0;
              const avgPerUser = parseFloat(row.metricValues[3].value) || 0;

              return (
                <div key={index} className="performance-card">
                  <h3>{eventNameLabels[eventName] || eventName}</h3>
                  <div className="metric-grid">
                    <div className="metric">
                      <div className="metric-value">{eventCount.toLocaleString()}</div>
                      <div className="metric-label">Total Events</div>
                    </div>
                    <div className="metric">
                      <div className="metric-value">{conversions.toLocaleString()}</div>
                      <div className="metric-label">Conversions</div>
                    </div>
                    <div className="metric">
                      <div className="metric-value">{users.toLocaleString()}</div>
                      <div className="metric-label">Users</div>
                    </div>
                    <div className="metric">
                      <div className="metric-value">{avgPerUser.toFixed(2)}</div>
                      <div className="metric-label">Avg per User</div>
                    </div>
                  </div>
                  <div className="conversion-rate">
                    <span className="rate-label">Conversion Rate:</span>
                    <span className="rate-value">
                      {eventCount > 0 ? ((conversions / eventCount) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="events-configured-section">
        <h2>Events Configured</h2>
        <div className="events-list">
          {project.events_configured.map((event, index) => (
            <div key={index} className="event-item">
              <div className="event-name">{eventNameLabels[event.type] || event.type}</div>
              <div className="event-details">
                <span className={`badge ${event.conversion ? 'badge-conversion' : 'badge-event'}`}>
                  {event.conversion ? 'Conversion' : 'Event'}
                </span>
                {event.phoneNumber && <span className="param">📞 {event.phoneNumber}</span>}
                {event.urlPath && <span className="param">📄 {event.urlPath}</span>}
                {event.buttonTexts && <span className="param">🖱️ {typeof event.buttonTexts === 'string' ? event.buttonTexts : event.buttonTexts.join(', ')}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetail;
