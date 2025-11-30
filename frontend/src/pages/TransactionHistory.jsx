import { useState, useEffect } from 'react';
import { transactionAPI } from '../api';
import { Clock, Loader, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function TransactionHistory() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await transactionAPI.getHistory();
            setTransactions(response.data.transactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <Loader className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-white mb-8">Transaction History</h1>

                <div className="card">
                    {transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No transactions yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Type</th>
                                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Amount</th>
                                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Counterparty</th>
                                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Date</th>
                                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center space-x-2">
                                                    {tx.action === 'sent' ? (
                                                        <ArrowUpRight className="w-5 h-5 text-red-400" />
                                                    ) : (
                                                        <ArrowDownLeft className="w-5 h-5 text-green-400" />
                                                    )}
                                                    <span className="text-white capitalize">{tx.action}</span>
                                                </div>
                                            </td>
                                            <td className={`py-3 px-4 font-semibold ${tx.action === 'sent' ? 'text-red-400' : 'text-green-400'}`}>
                                                {tx.action === 'sent' ? '' : '+'}{tx.amount.toFixed(2)} CW
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 font-mono text-xs">
                                                {tx.counterparty ? `${tx.counterparty.substring(0, 12)}...` : 'N/A'}
                                            </td>
                                            <td className="py-3 px-4 text-gray-400">
                                                {new Date(tx.timestamp).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${tx.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
