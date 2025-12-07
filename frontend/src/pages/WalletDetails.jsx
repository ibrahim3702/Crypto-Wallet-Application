import { useState, useEffect } from 'react';
import { Wallet, Copy, Key, Calendar, DollarSign, ArrowUpRight, ArrowDownLeft, Hash, CheckCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { userAPI, walletAPI, transactionAPI } from '../api';
import InfoModal from '../components/InfoModal';

const WalletDetails = () => {
    const { user } = useAuth();
    const [walletInfo, setWalletInfo] = useState(null);
    const [utxos, setUtxos] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedField, setCopiedField] = useState('');
    const [modal, setModal] = useState({ show: false, type: '', message: '' });

    useEffect(() => {
        fetchWalletDetails();
    }, []);

    const fetchWalletDetails = async () => {
        setLoading(true);
        try {
            const [infoRes, utxoRes, txRes] = await Promise.all([
                walletAPI.getMyInfo(),
                walletAPI.getMyUTXOs(),
                transactionAPI.getHistory()
            ]);

            setWalletInfo(infoRes.data);
            setUtxos(utxoRes.data.utxos || []);
            console.log('User info:', user);
            console.log(txRes);
            setTransactions(txRes.data.transactions || []);
        } catch (error) {
            console.error('Failed to fetch wallet details:', error);
            setModal({ show: true, type: 'error', message: 'Failed to load wallet details' });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(''), 2000);
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const getTransactionIcon = (action) => {
        if (action === 'sent') return <ArrowUpRight className="w-5 h-5 text-red-400" />;
        return <ArrowDownLeft className="w-5 h-5 text-green-400" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5a6cf3]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] p-6">
            <InfoModal
                show={modal.show}
                type={modal.type}
                message={modal.message}
                onClose={() => setModal({ show: false, type: '', message: '' })}
            />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                        <Wallet className="w-10 h-10 text-[#5a6cf3]" />
                        Wallet Details
                    </h1>
                    <p className="text-gray-400">Complete information about your wallet</p>
                </div>

                {/* Wallet Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Basic Info */}
                    <div className="card p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-[#5a6cf3]" />
                            Basic Information
                        </h2>
                        <div className="space-y-4">
                            {/* Wallet ID */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Wallet ID</label>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-white/5 px-4 py-2 rounded-lg text-white font-mono text-sm break-all">
                                        {user?.wallet_id}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(user?.wallet_id, 'wallet')}
                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        {copiedField === 'wallet' ? (
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                        ) : (
                                            <Copy className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Balance */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Balance</label>
                                <div className="bg-gradient-to-r from-[#5a6cf3]/20 to-[#7fffd4]/20 px-4 py-3 rounded-lg">
                                    <div className="text-3xl font-bold text-white flex items-center gap-2">
                                        <DollarSign className="w-8 h-8 text-[#5a6cf3]" />
                                        {walletInfo?.balance?.toFixed(2) || '0.00'}
                                    </div>
                                </div>
                            </div>

                            {/* Creation Date */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Created On</label>
                                <div className="flex items-center gap-2 text-white">
                                    <Calendar className="w-5 h-5 text-[#5a6cf3]" />
                                    <span>
                                        {walletInfo?.created_at
                                            ? new Date(walletInfo.created_at).toLocaleDateString()
                                            : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Public Key */}
                    <div className="card p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <Key className="w-5 h-5 text-[#5a6cf3]" />
                            Public Key
                        </h2>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <button
                                    onClick={() => copyToClipboard(walletInfo?.public_key, 'public')}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    {copiedField === 'public' ? (
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <Copy className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>
                                <span className="text-sm text-gray-400">Click to copy</span>
                            </div>
                            <code className="block bg-white/5 px-4 py-3 rounded-lg text-white font-mono text-xs break-all leading-relaxed">
                                {walletInfo?.public_key}
                            </code>
                        </div>
                    </div>
                </div>

                {/* UTXOs */}
                <div className="card p-6 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Hash className="w-5 h-5 text-[#5a6cf3]" />
                        Unspent Outputs (UTXOs)
                        <span className="text-sm text-gray-400 ml-2">({utxos.length})</span>
                    </h2>
                    {utxos.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No UTXOs available</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Transaction ID</th>
                                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Index</th>
                                        <th className="text-right py-3 px-4 text-gray-400 font-semibold">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {utxos.map((utxo, index) => (
                                        <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-3 px-4">
                                                <code className="text-xs text-gray-300 font-mono">
                                                    {utxo.tx_id.substring(0, 16)}...
                                                </code>
                                            </td>
                                            <td className="py-3 px-4 text-white">{utxo.vout}</td>
                                            <td className="py-3 px-4 text-right">
                                                <span className="text-[#7fffd4] font-semibold">
                                                    ${utxo.amount.toFixed(2)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Recent Transactions */}
                <div className="card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <ArrowUpRight className="w-5 h-5 text-[#5a6cf3]" />
                        Recent Transactions
                        <span className="text-sm text-gray-400 ml-2">(Last 10)</span>
                    </h2>
                    {transactions.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No transactions yet</p>
                    ) : (
                        <div className="space-y-3">
                            {transactions.slice(0, 10).map((tx, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        {getTransactionIcon(tx.action)}
                                        <div>
                                            <p className="text-white font-medium">
                                                {tx.action === 'sent' ? 'Sent to' : 'Received from'}
                                            </p>
                                            <code className="text-xs text-gray-400 font-mono">
                                                {tx.counterparty?.substring(0, 16)}...
                                            </code>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p
                                            className={`font-semibold ${tx.action === 'sent' ? 'text-red-400' : 'text-green-400'
                                                }`}
                                        >
                                            {tx.action === 'sent' ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-400">{formatDate(tx.timestamp)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalletDetails;
