import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { walletAPI, transactionAPI, blockchainAPI } from '../api';
import { Send, Download, TrendingUp, ArrowUpRight, ArrowDownLeft, Loader, Activity } from 'lucide-react';
import BalanceChart from '../components/BalanceChart';

export default function Dashboard() {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);
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

            setBalance(balanceRes.data.balance || 0);
            const allTransactions = txRes.data.transactions || [];
            setRecentTransactions(allTransactions.slice(0, 3));
            setStats(statsRes.data);

            // Generate balance history for last 24 hours
            const balanceHistory = generateBalanceHistory(allTransactions, balanceRes.data.balance || 0);
            setChartData(balanceHistory);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateBalanceHistory = (transactions, currentBalance) => {
        const now = new Date();
        const history = [];

        // Sort transactions by timestamp (oldest first)
        const sortedTxs = [...transactions]
            .filter(tx => tx.timestamp)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Calculate balance at each hour for last 24 hours
        for (let i = 23; i >= 0; i--) {
            const hourDate = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hourStart = hourDate.getTime();
            const hourEnd = hourStart + 60 * 60 * 1000;

            // Calculate balance at this hour by working backwards from current balance
            let balanceAtHour = currentBalance;
            sortedTxs.forEach(tx => {
                const txTime = new Date(tx.timestamp).getTime();
                if (txTime >= hourEnd) {
                    // Transaction happened after this hour, subtract its effect
                    balanceAtHour -= tx.amount;
                }
            });

            history.push({
                time: hourDate.getHours() + ':00',
                value: Math.max(0, balanceAtHour),
                date: hourDate
            });
        }

        return history;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
                <Loader className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0E27] py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

                {/* Balance Card */}
                <div className="card mb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-gray-400 text-sm mb-2">Total Balance</p>
                            <h2 className="text-4xl font-bold text-white mb-1">{balance.toFixed(4)} BTC</h2>
                            <p className="text-gray-400 text-sm">${(balance * 50123.45).toFixed(2)} USD</p>
                        </div>
                        <div className="flex items-center text-green-500 text-sm">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            <span>+2.5%</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/send')}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition"
                        >
                            <Send className="w-5 h-5" />
                            <span>Send</span>
                        </button>
                        <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition border border-gray-700">
                            <Download className="w-5 h-5" />
                            <span>Receive</span>
                        </button>
                    </div>
                </div>

                {/* Balance Chart */}
                <div className="card mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-semibold">Balance Chart (24h)</h3>
                        <Activity className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="mt-4">
                        <BalanceChart data={chartData} />
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="card">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-white font-semibold text-lg">Recent Activity</h3>
                        <Link to="/transactions" className="text-blue-500 hover:text-blue-400 text-sm">
                            View All
                        </Link>
                    </div>

                    {recentTransactions.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            No transactions yet
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentTransactions.map((tx, index) => {
                                const isReceived = tx.action === 'received' || tx.action === 'mined';
                                return (
                                    <div key={index} className="flex items-center justify-between p-4 bg-[#1A1F3A] rounded-lg hover:bg-[#1F2544] transition">
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2 rounded-full ${isReceived ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                                                {isReceived ? (
                                                    <ArrowDownLeft className="w-5 h-5 text-green-500" />
                                                ) : (
                                                    <ArrowUpRight className="w-5 h-5 text-red-500" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">
                                                    {isReceived ? 'Received from' : 'Sent to'}
                                                </p>
                                                <p className="text-gray-400 text-sm">
                                                    {tx.counterparty?.substring(0, 10)}...
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-semibold ${isReceived ? 'text-green-500' : 'text-red-500'}`}>
                                                {isReceived ? '+' : ''}{Math.abs(tx.amount || 0).toFixed(2)} BTC
                                            </p>
                                            <p className="text-gray-400 text-sm">
                                                ${(Math.abs(tx.amount || 0) * 25001.72).toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tx.status === 'success'
                                                ? 'bg-green-900/30 text-green-400'
                                                : 'bg-yellow-900/30 text-yellow-400'
                                                }`}>
                                                {tx.status === 'success' ? 'Confirmed' : 'Pending'}
                                            </span>
                                        </div>
                                        <Link to="/transactions" className="text-blue-500 hover:text-blue-400 text-sm font-medium">
                                            View
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
