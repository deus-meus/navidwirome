export default function Scrubber({
  value = 0,
  max = 100,
  onChange,
  className = '',
  color = 'bg-primary',
}) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0

  return (
    <div className={`relative flex items-center h-4 w-full group cursor-pointer ${className}`}>
      <div className="relative w-full h-[3px] rounded-full bg-outline-variant group-hover:h-[5px] transition-all">
        <div
          className={`absolute left-0 top-0 bottom-0 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min="0"
        max={max || 100}
        value={value || 0}
        onChange={(e) => onChange && onChange(parseFloat(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-valuenow={value}
        aria-valuemin="0"
        aria-valuemax={max}
      />
    </div>
  )
}
