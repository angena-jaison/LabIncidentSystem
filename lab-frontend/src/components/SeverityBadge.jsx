const COLORS = {
  Low: 'var(--color-low)',
  Medium: 'var(--color-medium)',
  High: 'var(--color-high)',
  Critical: 'var(--color-critical)',
}

export default function SeverityBadge({ severity }) {
  return (
    <span className="badge" style={{ background: COLORS[severity] || '#888' }}>
      {severity}
    </span>
  )
}
