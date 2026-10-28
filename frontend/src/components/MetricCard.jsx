import React from 'react';

/**
 * MetricCard Component
 * Displays a single KPI statistic card with an icon, numeric value, and descriptive label.
 */
export default function MetricCard({ label, value, icon: Icon, description, iconBg = '#EFF6FF', iconColor = '#2563EB' }) {
  return (
    <div className="metric-card">
      <div className="metric-card-content">
        <span className="metric-card-label">{label}</span>
        <span className="metric-card-value">{value}</span>
        {description && <span className="metric-card-desc">{description}</span>}
      </div>
      {Icon && (
        <div className="metric-card-icon" style={{ backgroundColor: iconBg, color: iconColor }}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );
}
