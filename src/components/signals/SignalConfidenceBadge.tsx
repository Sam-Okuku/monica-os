interface Props { confidence: number }

export function SignalConfidenceBadge({ confidence }: Props) {
  const pct = Math.round(confidence * 100)
  const config =
    pct >= 90 ? { bg: '#D4EDDA', text: '#1A7A3A', label: `${pct}% confident` } :
    pct >= 75 ? { bg: '#FEF3C7', text: '#92400E', label: `${pct}% confident` } :
                { bg: '#FCE4EC', text: '#9C1B3E', label: `${pct}% — review carefully` }

  return (
    <span
      className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  )
}