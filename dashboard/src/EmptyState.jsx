import { motion } from 'framer-motion';

/**
 * Professional empty state component with illustrations and CTAs
 */
export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    variant = 'default'
}) {
    const variants = {
        default: 'text-slate-500',
        error: 'text-rose-500',
        warning: 'text-amber-500',
        info: 'text-blue-500'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
        >
            {Icon && (
                <div className={`mb-6 ${variants[variant]}`}>
                    <Icon size={64} strokeWidth={1.5} />
                </div>
            )}

            <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">
                {title}
            </h3>

            {description && (
                <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
                    {description}
                </p>
            )}

            {action && (
                <button
                    onClick={action.onClick}
                    className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-amber-600/20 hover:shadow-2xl hover:shadow-amber-600/30 transform hover:scale-105"
                >
                    {action.label}
                </button>
            )}
        </motion.div>
    );
}

// Preset empty states for common scenarios
export function NoDataState({ onAction, actionLabel = 'Add First Item' }) {
    return (
        <EmptyState
            icon={({ size }) => (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                </svg>
            )}
            title="No Data Yet"
            description="Get started by adding your first item to see it appear here."
            action={onAction ? { label: actionLabel, onClick: onAction } : null}
        />
    );
}

export function NoResultsState({ onClear }) {
    return (
        <EmptyState
            icon={({ size }) => (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
                </svg>
            )}
            title="No Results Found"
            description="We couldn't find anything matching your search. Try adjusting your filters or search terms."
            action={onClear ? { label: 'Clear Filters', onClick: onClear } : null}
            variant="info"
        />
    );
}

export function ErrorState({ onRetry, message }) {
    return (
        <EmptyState
            icon={({ size }) => (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                </svg>
            )}
            title="Something Went Wrong"
            description={message || "We encountered an error loading this data. Please try again."}
            action={onRetry ? { label: 'Retry', onClick: onRetry } : null}
            variant="error"
        />
    );
}
