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
            setTransactions(response.data.transactions || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="w-12 h-12 text-[#7fffd4] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-10 px-4">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <p className="section-title">History</p>
                    <h1 className="text-3xl font-bold text-white">Transactions</h1>
                    <p className="text-gray-400 mt-2">Every send, receive, and mined reward in one place.</p>
                </div>

                <div className="card">
                    {!transactions || transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-300">No transactions yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Type</th>
                                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Amount</th>
                                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Counterparty</th>
                                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Date</th>
                                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center space-x-2">
                                                    {tx.action === 'sent' ? (
                                                        <ArrowUpRight className="w-5 h-5 text-red-300" />
                                                    ) : (
                                                        <ArrowDownLeft className="w-5 h-5 text-emerald-300" />
                                                    )}
                                                    <span className="text-white capitalize">{tx.action}</span>
                                                </div>
                                            </td>
                                            <td className={`py-3 px-4 font-semibold ${tx.action === 'sent' ? 'text-red-300' : 'text-emerald-300'}`}>
                                                {tx.action === 'sent' ? '-' : '+'}{Math.abs(tx.amount).toFixed(2)} CW
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 font-mono text-xs">
                                                {tx.counterparty ? `${tx.counterparty.substring(0, 12)}...` : 'N/A'}
                                            </td>
                                            <td className="py-3 px-4 text-gray-300">
                                                {new Date(tx.timestamp).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`pill ${tx.status === 'success' ? 'tag-success' : 'tag-warn'}`}>
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
