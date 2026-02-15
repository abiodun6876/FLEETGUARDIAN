/**
 * Loading Skeleton Components for better perceived performance
 */

export function CardSkeleton() {
    return (
        <div className="glass p-8 rounded-[40px] border-white/5 animate-pulse">
            <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-white/5 rounded-2xl" />
                <div className="w-20 h-6 bg-white/5 rounded-lg" />
            </div>
            <div className="space-y-3">
                <div className="h-6 bg-white/5 rounded-lg w-3/4" />
                <div className="h-4 bg-white/5 rounded-lg w-1/2" />
            </div>
            <div className="mt-6 space-y-2">
                <div className="h-3 bg-white/5 rounded w-full" />
                <div className="h-3 bg-white/5 rounded w-5/6" />
            </div>
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="glass p-8 rounded-[40px] border-white/5 animate-pulse">
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-white/5 rounded-2xl" />
            </div>
            <div className="h-3 bg-white/5 rounded w-24 mb-2" />
            <div className="h-10 bg-white/5 rounded w-32 mb-4" />
            <div className="h-3 bg-white/5 rounded w-28" />
        </div>
    );
}

export function TableRowSkeleton({ columns = 4 }) {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-6 py-4">
                    <div className="h-4 bg-white/5 rounded w-full" />
                </td>
            ))}
        </tr>
    );
}

export function MapSkeleton() {
    return (
        <div className="h-[700px] glass rounded-[40px] border-white/5 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 animate-pulse">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
                        <p className="text-xs font-black text-amber-500 uppercase tracking-[0.3em]">
                            Loading Map Data...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ListSkeleton({ count = 3, type = 'card' }) {
    const SkeletonComponent = type === 'card' ? CardSkeleton : StatCardSkeleton;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonComponent key={i} />
            ))}
        </div>
    );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
    return (
        <div className="glass rounded-[32px] overflow-hidden border-white/5">
            <table className="w-full text-left">
                <thead className="bg-white/5">
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className="px-6 py-4">
                                <div className="h-3 bg-white/5 rounded w-20 animate-pulse" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRowSkeleton key={i} columns={columns} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
