import { useState, useEffect } from 'react';
import { reportsAPI, transactionAPI } from '../api';
import { BarChart3, Loader, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function Reports() {
    const [monthly, setMonthly] = useState(null);
    const [zakatHistory, setZakatHistory] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const [monthlyRes, zakatRes, statsRes] = await Promise.all([
                reportsAPI.getMonthly(),
                reportsAPI.getZakat(),
                reportsAPI.getStats(),
            ]);

            setMonthly(monthlyRes.data);
            setZakatHistory(zakatRes.data.zakat_records || []);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
            setZakatHistory([]);
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
            <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-white mb-8">Reports & Analytics</h1>

                {monthly && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="card bg-gradient-to-br from-green-600 to-green-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-200 text-sm">Total Received</p>
                                    <p className="text-white font-bold text-2xl">{monthly.total_received.toFixed(2)} CW</p>
                                </div>
                                <TrendingUp className="w-10 h-10 text-green-200" />
                            </div>
                        </div>

                        <div className="card bg-gradient-to-br from-red-600 to-red-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-200 text-sm">Total Sent</p>
                                    <p className="text-white font-bold text-2xl">{monthly.total_sent.toFixed(2)} CW</p>
                                </div>
                                <TrendingDown className="w-10 h-10 text-red-200" />
                            </div>
                        </div>

                        <div className="card bg-gradient-to-br from-purple-600 to-purple-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-200 text-sm">Zakat Deducted</p>
                                    <p className="text-white font-bold text-2xl">{monthly.total_zakat.toFixed(2)} CW</p>
                                </div>
                                <DollarSign className="w-10 h-10 text-purple-200" />
                            </div>
                        </div>

                        <div className="card bg-gradient-to-br from-indigo-600 to-indigo-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-indigo-200 text-sm">Current Balance</p>
                                    <p className="text-white font-bold text-2xl">{monthly.current_balance.toFixed(2)} CW</p>
                                </div>
                                <BarChart3 className="w-10 h-10 text-indigo-200" />
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card">
                        <h2 className="text-xl font-bold text-white mb-4">Transaction Statistics</h2>
                        {stats && (
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Total Transactions</span>
                                    <span className="text-white font-semibold">{stats.total_transactions}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Sent Count</span>
                                    <span className="text-white font-semibold">{stats.sent_count}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Received Count</span>
                                    <span className="text-white font-semibold">{stats.received_count}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <h2 className="text-xl font-bold text-white mb-4">Zakat History</h2>
                        {!zakatHistory || zakatHistory.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">No zakat deductions yet</p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {zakatHistory.slice(0, 5).map((record, index) => (
                                    <div key={index} className="flex justify-between p-2 bg-gray-700 rounded">
                                        <span className="text-gray-300 text-sm">
                                            {new Date(record.timestamp).toLocaleDateString()}
                                        </span>
                                        <span className="text-purple-400 font-semibold">{record.amount.toFixed(2)} CW</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
