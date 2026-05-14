interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon = '○', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-6">
      <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center text-xl mb-4 text-gray-200">
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      {description && (
        <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-xs text-[#6C63B6] hover:text-[#4A4390] font-medium transition-colors"
        >
          {action.label} →
        </button>
      )}
    </div>
  )
}