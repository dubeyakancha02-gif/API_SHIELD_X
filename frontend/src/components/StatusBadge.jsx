import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

/**
 * StatusBadge Component
 * Displays a color-coded status badge with an icon for security scan outcomes.
 * Supported statuses: PASS, WARNING, FAIL, INCONCLUSIVE
 */
export default function StatusBadge({ status }) {
  const normalizedStatus = (status || 'INCONCLUSIVE').toUpperCase();

  switch (normalizedStatus) {
    case 'PASS':
      return (
        <span className="badge badge-pass">
          <CheckCircle2 size={13} strokeWidth={2.5} />
          PASS
        </span>
      );
    case 'WARNING':
      return (
        <span className="badge badge-warning">
          <AlertTriangle size={13} strokeWidth={2.5} />
          WARNING
        </span>
      );
    case 'FAIL':
      return (
        <span className="badge badge-fail">
          <XCircle size={13} strokeWidth={2.5} />
          FAIL
        </span>
      );
    case 'INCONCLUSIVE':
    default:
      return (
        <span className="badge badge-inconclusive">
          <HelpCircle size={13} strokeWidth={2.5} />
          {normalizedStatus}
        </span>
      );
  }
}
