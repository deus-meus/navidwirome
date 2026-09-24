export default function EqualizerBars({ className = '' }) {
  return (
    <div
      data-testid="equalizer-bars"
      className={`inline-flex items-end justify-center gap-0.5 h-4 w-4 ${className}`}
    >
      <span className="w-1 bg-primary rounded-full animate-pulse h-4" />
      <span className="w-1 bg-primary rounded-full animate-bounce h-2.5" />
      <span className="w-1 bg-primary rounded-full animate-pulse h-3.5" />
    </div>
  )
}
