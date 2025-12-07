import { CheckCircle, AlertCircle } from 'lucide-react';

export default function InfoModal({ open, title, message, variant = 'info', onClose }) {
    if (!open) return null;

    const isError = variant === 'error';
    const Icon = isError ? AlertCircle : CheckCircle;
    const badgeClass = isError ? 'text-red-300 bg-red-400/10 border-red-400/30' : 'text-emerald-200 bg-emerald-400/10 border-emerald-400/30';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="relative w-full max-w-md frosted-panel p-6">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${badgeClass}`}>
                    <Icon className="w-4 h-4" />
                    <span>{isError ? 'Notice' : 'Success'}</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-3 mb-2">{title}</h2>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end">
                    <button onClick={onClose} className="btn-secondary min-w-[120px]">Close</button>
                </div>
            </div>
        </div>
    );
}
