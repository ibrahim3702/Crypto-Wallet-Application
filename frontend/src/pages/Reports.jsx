import { useState, useEffect, useRef } from 'react';
import { reportsAPI, transactionAPI, systemAPI } from '../api';
import { BarChart3, Loader, TrendingUp, TrendingDown, DollarSign, Download } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import InfoModal from '../components/InfoModal';

export default function Reports() {
    const [monthly, setMonthly] = useState(null);
    const [zakatHistory, setZakatHistory] = useState([]);
    const [stats, setStats] = useState(null);
    const [systemLogs, setSystemLogs] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('last30');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [showZakatConfirm, setShowZakatConfirm] = useState(false);
    const [confirmingZakat, setConfirmingZakat] = useState(false);
    const [modal, setModal] = useState({ open: false, title: '', message: '', variant: 'info' });
    const chartRef = useRef(null);
    const chartDataRef = useRef(null);

    useEffect(() => {
        fetchReports();
    }, []);

    useEffect(() => {
        if (transactions.length > 0) {
            filterTransactionsByTimeRange();
        }
    }, [transactions, timeRange, customStartDate, customEndDate]);

    useEffect(() => {
        if (filteredTransactions.length > 0) {
            drawChart();
        }
    }, [filteredTransactions]);

    const fetchReports = async () => {
        try {
            const [monthlyRes, zakatRes, statsRes, logsRes, txRes] = await Promise.all([
                reportsAPI.getMonthly(),
                reportsAPI.getZakat(),
                reportsAPI.getStats(),
                systemAPI.getSystemLogs(),
                transactionAPI.getHistory(),
            ]);

            setMonthly(monthlyRes.data);
            setZakatHistory(zakatRes.data.zakat_records || []);
            setStats(statsRes.data);
            setSystemLogs(logsRes.data.logs || []);
            setTransactions(txRes.data.transactions || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
            setZakatHistory([]);
            setSystemLogs([]);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleTriggerZakat = () => {
        setShowZakatConfirm(true);
    };

    const confirmTriggerZakat = async () => {
        try {
            setConfirmingZakat(true);
            await systemAPI.triggerZakat();
            setModal({ open: true, title: 'Zakat triggered', message: 'Zakat deduction executed for eligible wallets. Check transaction history.', variant: 'success' });
            await fetchReports();
        } catch (error) {
            console.error('Error triggering Zakat:', error);
            setModal({ open: true, title: 'Trigger failed', message: error.response?.data?.error || error.message || 'Failed to trigger Zakat', variant: 'error' });
        } finally {
            setConfirmingZakat(false);
            setShowZakatConfirm(false);
        }
    };

    const filterTransactionsByTimeRange = () => {
        const now = new Date();
        let startDate;

        switch (timeRange) {
            case 'last30':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'last90':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case 'thisYear':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'custom':
                if (customStartDate && customEndDate) {
                    startDate = new Date(customStartDate);
                    const endDate = new Date(customEndDate);
                    const filtered = transactions.filter(tx => {
                        const txDate = new Date(tx.timestamp);
                        return txDate >= startDate && txDate <= endDate;
                    });
                    setFilteredTransactions(filtered);
                    return;
                } else {
                    setFilteredTransactions(transactions);
                    return;
                }
            default:
                setFilteredTransactions(transactions);
                return;
        }

        const filtered = transactions.filter(tx => {
            const txDate = new Date(tx.timestamp);
            return txDate >= startDate;
        });
        setFilteredTransactions(filtered);
    };

    const handleTimeRangeChange = (range) => {
        setTimeRange(range);
        if (range === 'custom') {
            setShowCustomDatePicker(true);
        } else {
            setShowCustomDatePicker(false);
        }
    };

    const handleExportAll = () => {
        try {
            const exportData = {
                monthly_report: monthly,
                zakat_history: zakatHistory,
                statistics: stats,
                transactions: filteredTransactions,
                system_logs: systemLogs,
                export_date: new Date().toISOString(),
                time_range: timeRange
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `crypto-wallet-report-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setModal({ open: true, title: 'Export ready', message: 'Report exported successfully as JSON.', variant: 'success' });
        } catch (error) {
            console.error('Error exporting report:', error);
            setModal({ open: true, title: 'Export failed', message: error.message || 'Could not export report', variant: 'error' });
        }
    };

    const drawChart = () => {
        const canvas = chartRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Get device pixel ratio for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        // Set actual size in memory (scaled to account for extra pixel density)
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        // Scale context to ensure correct drawing operations
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (filteredTransactions.length === 0) {
            ctx.fillStyle = '#6B7280';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No transaction data available for selected range', width / 2, height / 2);
            return;
        }

        // Group transactions by day
        const now = new Date();
        const daysToShow = timeRange === 'last90' ? 90 : timeRange === 'thisYear' ? 365 : 30;
        const startDate = new Date(now.getTime() - daysToShow * 24 * 60 * 60 * 1000);

        // Create daily buckets
        const dailyData = {};
        filteredTransactions.forEach(tx => {
            const txDate = new Date(tx.timestamp);
            if (txDate >= startDate) {
                const dateKey = txDate.toISOString().split('T')[0];
                if (!dailyData[dateKey]) {
                    dailyData[dateKey] = 0;
                }
                dailyData[dateKey] += Math.abs(tx.amount) * 1000; // Convert to dollars
            }
        });

        // Create data points for selected range
        const dataPoints = [];
        for (let i = daysToShow - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateKey = date.toISOString().split('T')[0];
            const label = i === 0 ? 'Today' : i === 7 || i === 14 || i === 21 || i === 28 ? `${Math.floor(i / 7)}w ago` : '';
            dataPoints.push({
                value: dailyData[dateKey] || 0,
                label: label,
                showLabel: label !== '',
                date: date,
                dateKey: dateKey
            });
        }

        // If all values are 0, show a message
        const hasData = dataPoints.some(p => p.value > 0);
        if (!hasData) {
            ctx.fillStyle = '#6B7280';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No transactions in the last 30 days', width / 2, height / 2);
            return;
        }

        const maxValue = Math.max(...dataPoints.map(d => d.value), 1);
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Store data for hover interaction
        chartDataRef.current = { dataPoints, maxValue, padding, chartWidth, chartHeight, width, height };

        // Draw grid lines
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Draw area chart
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);

        dataPoints.forEach((point, index) => {
            const x = padding + (chartWidth / (dataPoints.length - 1)) * index;
            const y = height - padding - (point.value / maxValue) * chartHeight;
            ctx.lineTo(x, y);
        });

        ctx.lineTo(width - padding, height - padding);
        ctx.closePath();

        // Fill gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw line
        ctx.beginPath();
        dataPoints.forEach((point, index) => {
            const x = padding + (chartWidth / (dataPoints.length - 1)) * index;
            const y = height - padding - (point.value / maxValue) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw data points
        dataPoints.forEach((point, index) => {
            if (point.value > 0) {
                const x = padding + (chartWidth / (dataPoints.length - 1)) * index;
                const y = height - padding - (point.value / maxValue) * chartHeight;

                ctx.beginPath();
                ctx.arc(x, y, hoveredPoint === index ? 5 : 3, 0, 2 * Math.PI);
                ctx.fillStyle = hoveredPoint === index ? '#60A5FA' : '#3B82F6';
                ctx.fill();

                // Draw highlight ring on hover
                if (hoveredPoint === index) {
                    ctx.beginPath();
                    ctx.arc(x, y, 8, 0, 2 * Math.PI);
                    ctx.strokeStyle = 'rgba(96, 165, 250, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        });

        // Draw X-axis labels with improved rendering
        ctx.fillStyle = '#D1D5DB';
        ctx.font = '600 11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        dataPoints.forEach((point, index) => {
            if (point.showLabel) {
                const x = padding + (chartWidth / (dataPoints.length - 1)) * index;
                ctx.fillText(point.label, x, height - 15);
            }
        });

        // Draw Y-axis labels with improved rendering
        ctx.fillStyle = '#D1D5DB';
        ctx.font = '600 11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= 4; i++) {
            const value = (maxValue / 4) * (4 - i);
            const y = padding + (chartHeight / 4) * i;
            ctx.fillText(`$${value.toFixed(0)}`, padding - 10, y);
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
        <div className="min-h-screen py-10">
            <div className="max-w-7xl mx-auto px-4 space-y-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="section-title">Insights</p>
                        <h1 className="text-3xl font-bold text-white mb-2">Analytics & Reports</h1>
                        <p className="text-gray-400 text-sm">View transaction patterns, Zakat deductions, and system logs.</p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleTriggerZakat}
                            className="btn-secondary flex items-center space-x-2"
                            disabled={loading}
                        >
                            <DollarSign className="w-4 h-4" />
                            <span>Trigger Zakat</span>
                        </button>
                        <button
                            onClick={handleExportAll}
                            className="btn-primary flex items-center space-x-2"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export All</span>
                        </button>
                    </div>
                </div>

                {/* Time Range Filters */}
                <div className="mb-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {[
                            { label: 'Last 30 Days', value: 'last30' },
                            { label: 'Last 90 Days', value: 'last90' },
                            { label: 'This Year', value: 'thisYear' },
                            { label: 'Custom Range', value: 'custom' }
                        ].map((range) => (
                            <button
                                key={range.value}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${timeRange === range.value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-[#252b42] text-gray-400 hover:bg-[#2d3349]'
                                    }`}
                                onClick={() => handleTimeRangeChange(range.value)}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                    {showCustomDatePicker && (
                        <div className="flex items-center space-x-3 bg-[#252b42] p-4 rounded-lg border border-gray-700">
                            <div className="flex flex-col">
                                <label className="text-gray-400 text-xs mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="bg-[#1a1f37] text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-gray-400 text-xs mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="bg-[#1a1f37] text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <button
                                onClick={filterTransactionsByTimeRange}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mt-5 transition"
                                disabled={!customStartDate || !customEndDate}
                            >
                                Apply
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats Cards */}
                {monthly && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-[#252b42] rounded-xl p-6 border border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-gray-400 text-sm">Total Transactions</p>
                            </div>
                            <p className="text-white font-bold text-3xl mb-2">{stats?.total_transactions || 0}</p>
                            <div className="flex items-center text-green-500 text-sm">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                <span>+5.2%</span>
                            </div>
                        </div>

                        <div className="bg-[#252b42] rounded-xl p-6 border border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-gray-400 text-sm">Total Volume Sent</p>
                            </div>
                            <p className="text-white font-bold text-3xl mb-2">${(monthly.total_sent * 1000).toFixed(2)}</p>
                            <div className="flex items-center text-red-500 text-sm">
                                <TrendingDown className="w-4 h-4 mr-1" />
                                <span>-1.8%</span>
                            </div>
                        </div>

                        <div className="bg-[#252b42] rounded-xl p-6 border border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-gray-400 text-sm">Total Volume Received</p>
                            </div>
                            <p className="text-white font-bold text-3xl mb-2">${(monthly.total_received * 1000).toFixed(2)}</p>
                            <div className="flex items-center text-green-500 text-sm">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                <span>+12.3%</span>
                            </div>
                        </div>

                        <div className="bg-[#252b42] rounded-xl p-6 border border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-gray-400 text-sm">Avg. Transaction</p>
                            </div>
                            <p className="text-white font-bold text-3xl mb-2">${stats?.total_transactions > 0 ? ((monthly.total_sent + monthly.total_received) * 1000 / stats.total_transactions).toFixed(2) : '0.00'}</p>
                            <div className="flex items-center text-green-500 text-sm">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                <span>+2.1%</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Transaction Volume Chart */}
                    <div className="lg:col-span-2 bg-[#252b42] rounded-xl p-6 border border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-white font-semibold text-lg mb-1">Transaction Volume</h2>
                                <div className="flex items-center space-x-2">
                                    <span className="text-2xl font-bold text-white">${((monthly.total_sent + monthly.total_received) * 1000).toFixed(2)}</span>
                                    <span className="text-green-500 text-sm">Last 30 Days</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <canvas
                                ref={chartRef}
                                style={{ width: '100%', height: '250px' }}
                                className="cursor-crosshair"
                                onMouseMove={(e) => {
                                    const canvas = chartRef.current;
                                    if (!canvas || !chartDataRef.current) return;

                                    const rect = canvas.getBoundingClientRect();
                                    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
                                    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

                                    const { dataPoints, padding, chartWidth, chartHeight, width, height, maxValue } = chartDataRef.current;

                                    let closestIndex = -1;
                                    let minDistance = Infinity;

                                    dataPoints.forEach((point, index) => {
                                        const pointX = padding + (chartWidth / (dataPoints.length - 1)) * index;
                                        const pointY = height - padding - (point.value / maxValue) * chartHeight;
                                        const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));

                                        if (distance < 15 && distance < minDistance) {
                                            minDistance = distance;
                                            closestIndex = index;
                                        }
                                    });

                                    if (closestIndex !== hoveredPoint) {
                                        setHoveredPoint(closestIndex);
                                    }
                                }}
                                onMouseLeave={() => setHoveredPoint(null)}
                            ></canvas>

                            {/* Tooltip */}
                            {hoveredPoint !== null && chartDataRef.current && chartDataRef.current.dataPoints && chartDataRef.current.dataPoints[hoveredPoint] && (
                                <div
                                    className="absolute bg-[#1a1f37] border border-gray-600 rounded-lg p-3 shadow-xl pointer-events-none z-10"
                                    style={{
                                        left: `${((hoveredPoint / (chartDataRef.current.dataPoints.length - 1)) * 100)}%`,
                                        top: '10px',
                                        transform: 'translateX(-50%)'
                                    }}
                                >
                                    <div className="text-xs text-gray-400 mb-1">
                                        {chartDataRef.current.dataPoints[hoveredPoint].date.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </div>
                                    <div className="text-sm font-bold text-white">
                                        ${chartDataRef.current.dataPoints[hoveredPoint].value.toFixed(2)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Transaction Flow Donut */}
                    <div className="bg-[#252b42] rounded-xl p-6 border border-gray-700">
                        <h2 className="text-white font-semibold text-lg mb-6">Transaction Flow</h2>
                        <div className="flex justify-center items-center h-48">
                            {(() => {
                                const total = monthly.total_sent + monthly.total_received;
                                const incomingPct = total > 0 ? (monthly.total_received / total * 100).toFixed(0) : 50;
                                const outgoingPct = total > 0 ? (monthly.total_sent / total * 100).toFixed(0) : 50;
                                const circumference = 440;
                                const incomingDash = (incomingPct / 100) * circumference;
                                const outgoingDash = (outgoingPct / 100) * circumference;
                                const totalDisplay = ((monthly.total_sent + monthly.total_received) * 1000 / 1000).toFixed(1);
                                return (
                                    <svg width="180" height="180" viewBox="0 0 180 180">
                                        <circle cx="90" cy="90" r="70" fill="none" stroke="#10B981" strokeWidth="20" strokeDasharray={`${incomingDash} ${circumference}`} transform="rotate(-90 90 90)" />
                                        <circle cx="90" cy="90" r="70" fill="none" stroke="#3B82F6" strokeWidth="20" strokeDasharray={`${outgoingDash} ${circumference}`} strokeDashoffset={`-${incomingDash}`} transform="rotate(-90 90 90)" />
                                        <text x="90" y="85" textAnchor="middle" fill="white" fontSize="12" fontWeight="500">Total Flow</text>
                                        <text x="90" y="105" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">${totalDisplay}K</text>
                                    </svg>
                                );
                            })()}
                        </div>
                        <div className="mt-6 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                                    <span className="text-gray-400 text-sm">Incoming ({((monthly.total_received / (monthly.total_sent + monthly.total_received)) * 100).toFixed(0)}%)</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-[#3B82F6]"></div>
                                    <span className="text-gray-400 text-sm">Outgoing ({((monthly.total_sent / (monthly.total_sent + monthly.total_received)) * 100).toFixed(0)}%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Logs */}
                <div className="card">
                    <div className="mb-4">
                        <h2 className="text-white font-semibold text-lg mb-1">System Logs</h2>
                        <p className="text-gray-400 text-sm">Recent system activities, including PoW and signature validations.</p>
                    </div>

                    <div className="mb-6 overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">TIMESTAMP</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">EVENT TYPE</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">SEVERITY</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">DETAILS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!systemLogs || systemLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-6 text-gray-400">No system logs found</td>
                                    </tr>
                                ) : (
                                    systemLogs.slice(0, 10).map((log, index) => {
                                        const getStatusColor = (severity) => {
                                            switch ((severity || '').toLowerCase()) {
                                                case 'error': return 'bg-red-900/30 text-red-400';
                                                case 'warning': return 'bg-yellow-900/30 text-yellow-400';
                                                default: return 'bg-green-900/30 text-green-400';
                                            }
                                        };

                                        const getDetailsText = (entry) => {
                                            if (entry.details) {
                                                return JSON.stringify(entry.details).substring(0, 80) + (JSON.stringify(entry.details).length > 80 ? '...' : '');
                                            }
                                            if (entry.message) return entry.message;
                                            return 'N/A';
                                        };

                                        return (
                                            <tr key={index} className="border-b border-white/5">
                                                <td className="py-3 px-4 text-gray-400 text-sm">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </td>
                                                <td className="py-3 px-4 text-white text-sm capitalize">{log.event || 'Unknown'}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(log.severity)}`}>
                                                        {log.severity || 'Info'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-300 text-sm font-mono">
                                                    {getDetailsText(log)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <ConfirmModal
                open={showZakatConfirm}
                title="Trigger Zakat deduction?"
                description="This will deduct Zakat from all eligible wallets immediately. Proceed?"
                confirmLabel="Trigger Zakat"
                cancelLabel="Cancel"
                loading={confirmingZakat}
                onConfirm={confirmTriggerZakat}
                onCancel={() => setShowZakatConfirm(false)}
            />
            <InfoModal
                open={modal.open}
                title={modal.title}
                message={modal.message}
                variant={modal.variant === 'error' ? 'error' : 'success'}
                onClose={() => setModal({ ...modal, open: false })}
            />
        </div>
    );
}
