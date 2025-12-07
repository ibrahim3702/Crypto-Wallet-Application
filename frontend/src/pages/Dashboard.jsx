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
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="w-12 h-12 text-[#7fffd4] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-10 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="section-title">Overview</p>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">Control center, reimagined</h1>
                        <p className="text-gray-400 mt-2">Track balances, flows, and the chain at a glance.</p>
                    </div>
                    <div className="pill bg-white/10 border-white/20">
                        <Activity className="w-4 h-4 text-[#7fffd4]" />
                        <span className="text-sm text-white">Live sync enabled</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="card lg:col-span-2 overflow-hidden relative">
                        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-[#7fffd4]/10 blur-3xl" />
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div>
                                <p className="text-gray-400 text-sm mb-2">Total Balance</p>
                                <h2 className="text-4xl font-bold text-white mb-1">{balance.toFixed(4)} CW</h2>
                                <p className="text-gray-400 text-sm">${(balance * 50123.45).toFixed(2)} USD</p>
                            </div>
                            <div className="flex items-center text-emerald-300 text-sm bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/30">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                <span>+2.5% today</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 relative z-10">
                            <button
                                onClick={() => navigate('/send')}
                                className="btn-primary flex items-center justify-center gap-2"
                            >
                                <Send className="w-5 h-5" />
                                <span>Send</span>
                            </button>
                            <button className="btn-secondary flex items-center justify-center gap-2">
                                <Download className="w-5 h-5" />
                                <span>Receive</span>
                            </button>
                        </div>
                    </div>

                    <div className="card space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-400">Network status</p>
                            <span className="pill tag-success">Healthy</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <div className="w-3/4 h-full bg-gradient-to-r from-[#5a6cf3] to-[#7fffd4]" />
                        </div>
                        <div className="text-sm text-gray-300">Blocks and transactions are syncing in real-time.</div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <p className="section-title">Balance</p>
                            <h3 className="text-white font-semibold">Last 24 hours</h3>
                        </div>
                        <Activity className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="mt-4">
                        <BalanceChart data={chartData} />
                    </div>
                </div>

                <div className="card">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <p className="section-title">Activity</p>
                            <h3 className="text-white font-semibold text-lg">Recent transactions</h3>
                        </div>
                        <Link to="/transactions" className="btn-ghost text-sm">View all</Link>
                    </div>

                    {recentTransactions.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">No transactions yet</div>
                    ) : (
                        <div className="space-y-3">
                            {recentTransactions.map((tx, index) => {
                                const isReceived = tx.action === 'received' || tx.action === 'mined';
                                return (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 surface hover:border-white/20 transition"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2 rounded-xl ${isReceived ? 'bg-emerald-400/15' : 'bg-red-400/15'} border border-white/5`}>
                                                {isReceived ? (
                                                    <ArrowDownLeft className="w-5 h-5 text-emerald-300" />
                                                ) : (
                                                    <ArrowUpRight className="w-5 h-5 text-red-300" />
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
                                            <p className={`font-semibold ${isReceived ? 'text-emerald-300' : 'text-red-300'}`}>
                                                {isReceived ? '+' : ''}{Math.abs(tx.amount || 0).toFixed(2)} CW
                                            </p>
                                            <p className="text-gray-400 text-sm">
                                                ${(Math.abs(tx.amount || 0) * 25001.72).toFixed(2)}
                                            </p>
                                        </div>
                                        <span className={`pill ${tx.status === 'success' ? 'tag-success' : 'tag-warn'}`}>
                                            {tx.status === 'success' ? 'Confirmed' : 'Pending'}
                                        </span>
                                        <Link to="/transactions" className="text-[#7fffd4] hover:text-white text-sm font-medium">
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
