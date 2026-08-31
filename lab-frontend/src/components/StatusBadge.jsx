const COLORS = {
  Open: 'var(--color-status-open)',
  Investigating: 'var(--color-status-investigating)',
  Resolved: 'var(--color-status-resolved)',
  Closed: 'var(--color-status-closed)',
}

export default function StatusBadge({ status }) {
  return (
    <span className="badge" style={{ background: COLORS[status] || '#888' }}>
      {status}
    </span>
  )
}
