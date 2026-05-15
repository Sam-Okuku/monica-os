interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon = '○', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl mb-3"
        style={{ background: '#F0EFFF', color: '#C4B5FD' }}
      >
        {icon}
      </div>
      <p className="text-[13px] font-semibold mb-1" style={{ color: '#374151' }}>{title}</p>
      {description && (
        <p className="text-[11px] leading-relaxed max-w-[180px]" style={{ color: '#6B7280' }}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-[11px] font-semibold transition-colors"
          style={{ color: '#7C3AED' }}
        >
          {action.label} →
        </button>
      )}
    </div>
  )
}