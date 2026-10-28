import React from 'react';
import { Database, Shield, BookOpen, AlertCircle, Info } from 'lucide-react';

/**
 * Settings Page
 * Educational reference, database connection details, and Viva demonstration tips.
 */
export default function Settings() {
  return (
    <div className="page-container">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Scanner Engine Config Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} color="#2563EB" />
              <h2 className="card-title">Scanner Parameters</h2>
            </div>
          </div>
          <div className="card-body" style={{ fontSize: '0.875rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <strong>Auditing Mode:</strong> Passive Defensive HTTP Inspection
              <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.2rem' }}>
                Sends standard GET or HEAD requests to inspect response headers without injecting payloads or stressing servers.
              </p>
            </div>
            <div>
              <strong>Request Timeout:</strong> 5.0 seconds
              <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.2rem' }}>
                Prevents hangs if an external API is offline or unreachable.
              </p>
            </div>
            <div>
              <strong>Honest Testing Boundary:</strong> Active
              <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.2rem' }}>
                Passing these defensive checks does not guarantee full application security (e.g. business logic flaws or SQL injection), which is accurately noted in faculty presentations.
              </p>
            </div>
          </div>
        </div>

        {/* Database & Architecture Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={18} color="#16A34A" />
              <h2 className="card-title">Database Storage</h2>
            </div>
          </div>
          <div className="card-body" style={{ fontSize: '0.875rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <strong>Engine:</strong> SQLite 3 (Embedded relational database)
            </div>
            <div>
              <strong>Database File:</strong> <code className="font-mono">backend/apishield.db</code>
            </div>
            <div>
              <strong>Query Execution:</strong> Parameterized SQL (<code className="font-mono">?</code> bindings)
            </div>
            <div>
              <strong>Tables:</strong>
              <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', fontSize: '0.8125rem' }}>
                <li><code>apis</code> (Endpoints, environments, metadata)</li>
                <li><code>scan_reports</code> (Audit timestamps, summaries)</li>
                <li><code>scan_findings</code> (Specific check findings, evidence, remedies)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Viva Guide Card (Full Width) */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} color="#9333EA" />
              <h2 className="card-title">Faculty Viva Quick Notes</h2>
            </div>
          </div>
          <div className="card-body" style={{ fontSize: '0.875rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
              <strong>Q1: Why did you build API Shield?</strong>
              <p style={{ marginTop: '0.25rem', fontSize: '0.8125rem' }}>
                "Many developers focus only on functional API features and forget defensive headers like Strict-Transport-Security, X-Content-Type-Options, or safe CORS policies. API Shield provides an automated, visual audit dashboard to verify basic security hygiene."
              </p>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
              <strong>Q2: Why use FastAPI and SQLite?</strong>
              <p style={{ marginTop: '0.25rem', fontSize: '0.8125rem' }}>
                "FastAPI offers high performance with automatic request validation through Pydantic. SQLite is file-based and requires zero server configuration, allowing the project to remain self-contained and reproducible on any machine."
              </p>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A' }}>
              <strong>Q3: How do you prevent SQL injection?</strong>
              <p style={{ marginTop: '0.25rem', fontSize: '0.8125rem' }}>
                "We use parameterized queries everywhere in SQLite with question mark (<code className="font-mono">?</code>) placeholders. User input is never concatenated directly into raw SQL strings."
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
