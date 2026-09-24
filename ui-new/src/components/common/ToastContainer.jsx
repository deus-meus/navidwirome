import { useToastStore } from '../../store/useToastStore'

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none select-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container-high/95 text-on-surface border border-outline-variant shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0 leading-none">
            <span className="material-symbols-outlined text-[17px] leading-none">
              {toast.icon || 'info'}
            </span>
          </div>
          <span className="text-xs font-medium leading-snug flex-1">{toast.message}</span>
          <button
            type="button"
            aria-label="Dismiss toast"
            onClick={() => removeToast(toast.id)}
            className="text-on-surface-variant hover:text-on-surface transition-colors leading-none flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[15px] leading-none">close</span>
          </button>
        </div>
      ))}
    </div>
  )
}
