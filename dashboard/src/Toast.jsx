import { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'info', duration = 4000, action = null) => {
        const id = Date.now() + Math.random();
        const toast = { id, message, type, action };

        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const toast = {
        success: (message, duration, action) => addToast(message, 'success', duration, action),
        error: (message, duration, action) => addToast(message, 'error', duration, action),
        warning: (message, duration, action) => addToast(message, 'warning', duration, action),
        info: (message, duration, action) => addToast(message, 'info', duration, action),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts, removeToast }) {
    return (
        <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                ))}
            </AnimatePresence>
        </div>
    );
}

function ToastItem({ toast, onClose }) {
    const icons = {
        success: <CheckCircle size={20} className="text-emerald-400" />,
        error: <XCircle size={20} className="text-rose-400" />,
        warning: <AlertCircle size={20} className="text-amber-400" />,
        info: <Info size={20} className="text-blue-400" />
    };

    const styles = {
        success: 'bg-emerald-500/10 border-emerald-500/20',
        error: 'bg-rose-500/10 border-rose-500/20',
        warning: 'bg-amber-500/10 border-amber-500/20',
        info: 'bg-blue-500/10 border-blue-500/20'
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`glass ${styles[toast.type]} border rounded-2xl p-4 pr-12 min-w-[320px] max-w-md shadow-2xl pointer-events-auto relative`}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    {icons[toast.type]}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold text-white leading-relaxed">
                        {toast.message}
                    </p>
                    {toast.action && (
                        <button
                            onClick={toast.action.onClick}
                            className="mt-2 text-xs font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors"
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>
            </div>
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
}

export default ToastProvider;
