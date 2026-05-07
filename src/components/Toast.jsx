import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [confirmConfig, setConfirmConfig] = useState(null)

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const success = useCallback((message) => addToast(message, 'success'), [addToast])
  const error = useCallback((message) => addToast(message, 'error'), [addToast])
  
  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmConfig({ message, resolve })
    })
  }, [])

  return (
    <ToastContext.Provider value={{ success, error, confirm }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? '✓' : '✕'} {toast.message}
          </div>
        ))}
      </div>
      {confirmConfig && (
        <div className="modal-overlay" onClick={() => { confirmConfig.resolve(false); setConfirmConfig(null) }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <p style={{ marginBottom: '1.5rem' }}>{confirmConfig.message}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { confirmConfig.resolve(false); setConfirmConfig(null) }}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { confirmConfig.resolve(true); setConfirmConfig(null) }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}