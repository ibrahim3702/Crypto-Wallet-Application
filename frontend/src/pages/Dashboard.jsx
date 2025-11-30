import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { walletAPI, transactionAPI, blockchainAPI } from '../api';
import { Wallet, Send, Clock, TrendingUp, ArrowUpRight, ArrowDownLeft, Loader } from 'lucide-react';

export default function Dashboard() {
    const [balance, setBalance] = useState(0);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [balanceRes, txRes, statsRes] = await Promise.all([
                walletAPI.getMyBalance(),
                transactionAPI.getHistory(),
                blockchainAPI.getStats(),
            ]);

            setBalance(balanceRes.data.balance);
            setRecentTransactions(txRes.data.transactions.slice(0, 5));
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

                {/* Balance Card */}
                <div className="card mb-8 bg-gradient-to-br from-indigo-600 to-purple-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-indigo-200 text-sm font-semibold mb-2">Total Balance</p>
                            <h2 className="text-4xl font-bold text-white">{balance.toFixed(2)} CW</h2>
                        </div>
                        <Wallet className="w-16 h-16 text-indigo-200" />
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Link to="/send" className="card hover:bg-gray-700 transition cursor-pointer">
                        <div className="flex items-center space-x-4">
                            <div className="bg-indigo-500 p-3 rounded-lg">
                                <Send className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">Send Money</h3>
                                <p className="text-gray-400 text-sm">Transfer to another wallet</p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/transactions" className="card hover:bg-gray-700 transition cursor-pointer">
                        <div className="flex items-center space-x-4">
                            <div className="bg-green-500 p-3 rounded-lg">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">Transactions</h3>
                                <p className="text-gray-400 text-sm">View your history</p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/reports" className="card hover:bg-gray-700 transition cursor-pointer">
                        <div className="flex items-center space-x-4">
                            <div className="bg-purple-500 p-3 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">Reports</h3>
                                <p className="text-gray-400 text-sm">View analytics</p>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Transactions */}
                    <div className="card">
                        <h3 className="text-xl font-bold text-white mb-4">Recent Transactions</h3>
                        {recentTransactions.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">No transactions yet</p>
                        ) : (
                            <div className="space-y-3">
                                {recentTransactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            {tx.action === 'sent' ? (
                                                <ArrowUpRight className="w-5 h-5 text-red-400" />
                                            ) : (
                                                <ArrowDownLeft className="w-5 h-5 text-green-400" />
                                            )}
                                            <div>
                                                <p className="text-white font-medium capitalize">{tx.action}</p>
                                                <p className="text-gray-400 text-xs">{new Date(tx.timestamp).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <p className={`font-semibold ${tx.action === 'sent' ? 'text-red-400' : 'text-green-400'}`}>
                                            {tx.action === 'sent' ? '' : '+'}{tx.amount.toFixed(2)} CW
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Blockchain Stats */}
                    <div className="card">
                        <h3 className="text-xl font-bold text-white mb-4">Blockchain Stats</h3>
                        {stats && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Total Blocks</span>
                                    <span className="text-white font-semibold">{stats.total_blocks}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Total Transactions</span>
                                    <span className="text-white font-semibold">{stats.total_transactions}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Pending Transactions</span>
                                    <span className="text-yellow-400 font-semibold">{stats.pending_transactions}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Total Users</span>
                                    <span className="text-white font-semibold">{stats.total_users}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">PoW Difficulty</span>
                                    <span className="text-white font-semibold">{stats.pow_difficulty}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
