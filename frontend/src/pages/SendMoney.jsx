import { useState } from 'react';
import { transactionAPI, walletAPI } from '../api';
import { Send, Loader, CheckCircle } from 'lucide-react';

export default function SendMoney() {
    const [formData, setFormData] = useState({
        receiver_wallet_id: '',
        amount: '',
        note: '',
        private_key: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await transactionAPI.sendMoney(formData);
            setSuccess(`Transaction created! TX ID: ${response.data.tx_id}`);
            setFormData({ receiver_wallet_id: '', amount: '', note: '', private_key: '' });
        } catch (err) {
            setError(err.response?.data?.error || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-white mb-8">Send Money</h1>

                <div className="card">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg mb-4 flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-300 text-sm font-semibold mb-2">
                                Receiver Wallet ID
                            </label>
                            <input
                                type="text"
                                value={formData.receiver_wallet_id}
                                onChange={(e) => setFormData({ ...formData, receiver_wallet_id: e.target.value })}
                                className="input-field"
                                placeholder="Enter wallet ID"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-300 text-sm font-semibold mb-2">
                                Amount (CW)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="input-field"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-300 text-sm font-semibold mb-2">
                                Note (Optional)
                            </label>
                            <textarea
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                className="input-field"
                                placeholder="Add a note..."
                                rows={3}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-300 text-sm font-semibold mb-2">
                                Private Key
                            </label>
                            <textarea
                                value={formData.private_key}
                                onChange={(e) => setFormData({ ...formData, private_key: e.target.value })}
                                className="input-field font-mono text-xs"
                                placeholder="Paste your private key here"
                                rows={6}
                                required
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Your private key is required to sign the transaction
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary flex items-center justify-center"
                        >
                            {loading ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-5 h-5 mr-2" />
                                    Send Money
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
