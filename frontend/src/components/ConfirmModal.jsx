import { X } from 'lucide-react';

export default function ConfirmModal({ open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, loading = false }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
            <div className="relative w-full max-w-md frosted-panel p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="section-title">Confirmation</p>
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                    </div>
                    <button onClick={onCancel} className="p-2 text-gray-300 hover:text-white" aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {description && <p className="text-gray-300 mb-6">{description}</p>}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="btn-primary flex-1 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : confirmLabel}
                    </button>
                    <button onClick={onCancel} className="btn-secondary flex-1">
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
