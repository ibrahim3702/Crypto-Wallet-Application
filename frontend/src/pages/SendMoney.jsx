import { useState } from 'react';
import { transactionAPI, walletAPI, userAPI } from '../api';
import { Send, Loader, CheckCircle, Search, User } from 'lucide-react';

export default function SendMoney() {
    const [formData, setFormData] = useState({
        receiver_wallet_id: '',
        amount: '',
        note: '',
        private_key: '',
    });
    const [searchEmail, setSearchEmail] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResult, setSearchResult] = useState(null);
    const [useEmail, setUseEmail] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleEmailSearch = async () => {
        if (!searchEmail) return;

        setSearchLoading(true);
        setError('');
        setSearchResult(null);

        try {
            const response = await userAPI.searchByEmail(searchEmail);
            setSearchResult(response.data);
            setFormData({ ...formData, receiver_wallet_id: response.data.wallet_id });
        } catch (err) {
            setError(err.response?.data?.error || 'User not found');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount) // Convert string to number
            };
            const response = await transactionAPI.sendMoney(payload);
            setSuccess(`Transaction created! TX ID: ${response.data.tx_id}`);
            setFormData({ receiver_wallet_id: '', amount: '', note: '', private_key: '' });
            setSearchEmail('');
            setSearchResult(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-10 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="section-title">Transfer</p>
                        <h1 className="text-3xl font-bold text-white">Send funds with confidence</h1>
                        <p className="text-gray-400 mt-2">Look up a recipient by email or paste their wallet ID.</p>
                    </div>
                    <div className="pill bg-white/10">
                        <Send className="w-4 h-4 text-[#7fffd4]" />
                        <span className="text-sm">Secure & signed</span>
                    </div>
                </div>

                <div className="card">
                    {error && (
                        <div className="bg-red-400/10 border border-red-400/40 text-red-200 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-emerald-400/10 border border-emerald-400/40 text-emerald-200 px-4 py-3 rounded-lg mb-4 flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            {success}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 mb-6">
                        <button
                            type="button"
                            onClick={() => setUseEmail(true)}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${useEmail
                                ? 'bg-gradient-to-r from-[#5a6cf3] to-[#7fffd4] text-gray-900'
                                : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                        >
                            <User className="w-4 h-4 inline mr-2" />
                            Search by Email
                        </button>
                        <button
                            type="button"
                            onClick={() => { setUseEmail(false); setSearchResult(null); }}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${!useEmail
                                ? 'bg-gradient-to-r from-[#5a6cf3] to-[#7fffd4] text-gray-900'
                                : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                        >
                            Enter Wallet ID
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {useEmail ? (
                            <div>
                                <label className="block text-gray-300 text-sm font-semibold mb-2">
                                    Recipient Email
                                </label>
                                <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                                    <input
                                        type="email"
                                        value={searchEmail}
                                        onChange={(e) => setSearchEmail(e.target.value)}
                                        className="input-field flex-1"
                                        placeholder="recipient@example.com"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleEmailSearch}
                                        disabled={searchLoading || !searchEmail}
                                        className="btn-secondary px-4 flex items-center justify-center"
                                    >
                                        {searchLoading ? (
                                            <Loader className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Search className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>

                                {searchResult && (
                                    <div className="mt-3 p-3 surface border border-emerald-400/20">
                                        <p className="text-emerald-300 text-sm font-semibold mb-1">User found</p>
                                        <p className="text-gray-200 text-sm font-medium">{searchResult.full_name}</p>
                                        <p className="text-gray-400 text-xs">{searchResult.email}</p>
                                        <p className="text-gray-500 text-xs font-mono mt-1">{searchResult.wallet_id}</p>
                                    </div>
                                )}

                                {!searchResult && searchEmail && !searchLoading && (
                                    <p className="mt-2 text-xs text-gray-400">
                                        Tip: Make sure the email is registered.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div>
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
                        )}

                        <div>
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

                        <div>
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

                        <div>
                            <label className="block text-gray-300 text-sm font-semibold mb-2">
                                Private Key
                            </label>
                            <div className="bg-amber-400/10 border border-amber-400/40 rounded-lg p-3 mb-2">
                                <p className="text-amber-200 text-xs">
                                    Paste your private key in PEM format (starts with -----BEGIN RSA PRIVATE KEY-----). You can find it on your Profile page.
                                </p>
                            </div>
                            <textarea
                                value={formData.private_key}
                                onChange={(e) => setFormData({ ...formData, private_key: e.target.value })}
                                className="input-field font-mono text-xs"
                                placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                                rows={8}
                                required
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Your private key signs and secures this transaction.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || (useEmail && !formData.receiver_wallet_id)}
                            className="w-full btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
