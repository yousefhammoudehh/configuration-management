import './Badge.css'

interface BadgeProps {
  type: 'list' | 'text' | 'number' | 'date'
  children: string
}

export function Badge({ type, children }: BadgeProps) {
  return <span className={`badge badge-${type}`}>{children}</span>
}
