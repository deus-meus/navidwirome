import { useEffect } from 'react'
import { useConfirmStore } from '../../store/useConfirmStore'

export default function ConfirmModal() {
  const {
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    danger,
    hasInput,
    inputValue,
    inputPlaceholder,
    inputType,
    setInputValue,
    handleConfirm,
    handleCancel,
  } = useConfirmStore()

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, handleCancel])

  if (!isOpen) {
    return null
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleConfirm()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none"
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-md bg-surface-container-low border border-outline-variant rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              danger
                ? 'bg-red-500/15 border border-red-500/30 text-red-400'
                : 'bg-primary/20 border border-primary/30 text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[22px] leading-none">
              {danger ? 'warning' : hasInput ? 'edit' : 'help'}
            </span>
          </div>

          <div className="space-y-1 flex-1 min-w-0 pt-0.5">
            <h3 className="font-serif text-lg font-semibold text-on-surface leading-tight">
              {title}
            </h3>
            {message && (
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {message}
              </p>
            )}
          </div>
        </div>

        {hasInput ? (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <input
              type={inputType || 'text'}
              autoFocus
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-surface-container border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary font-mono transition-colors"
            />

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-outline-variant/60">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container font-label-md text-xs font-medium cursor-pointer transition-colors leading-none"
              >
                {cancelText}
              </button>
              <button
                type="submit"
                className={`px-5 py-2.5 rounded-xl font-label-md text-xs font-semibold shadow-md cursor-pointer transition-colors leading-none ${
                  danger
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-primary hover:bg-primary-bright text-white'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/60">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container font-label-md text-xs font-medium cursor-pointer transition-colors leading-none"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`px-5 py-2.5 rounded-xl font-label-md text-xs font-semibold shadow-md cursor-pointer transition-colors leading-none ${
                danger
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-primary hover:bg-primary-bright text-white'
              }`}
            >
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
