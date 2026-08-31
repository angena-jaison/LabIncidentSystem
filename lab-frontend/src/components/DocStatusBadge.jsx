const COLORS = {
  Pending: 'var(--color-medium)',
  Approved: 'var(--color-low)',
  Rejected: 'var(--color-critical)',
}

export default function DocStatusBadge({ status }) {
  return (
    <span className="badge" style={{ background: COLORS[status] || '#888' }}>
      {status}
    </span>
  )
}
