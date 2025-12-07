import { useState, useEffect } from 'react';
import { RefreshCw, Search, Filter, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { systemAPI } from '../api';

const SystemLogs = () => {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        filterLogs();
    }, [logs, searchTerm, statusFilter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await systemAPI.getSystemLogs();
            console.log('System logs response:', response);
            setLogs(response.data.logs || []);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterLogs = () => {
        let filtered = [...logs];

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(log =>
                log.event?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                JSON.stringify(log.details || {}).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by severity
        if (statusFilter !== 'all') {
            filtered = filtered.filter(log => log.severity === statusFilter);
        }

        setFilteredLogs(filtered);
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const formatDetails = (details) => {
        if (!details || Object.keys(details).length === 0) return 'N/A';
        return Object.entries(details)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    };

    const getStatusIcon = (severity) => {
        switch (severity) {
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-400" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-yellow-400" />;
            default:
                return <Info className="w-5 h-5 text-blue-400" />;
        }
    };

    const getStatusClass = (severity) => {
        switch (severity) {
            case 'error':
                return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'warning':
                return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
            default:
                return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                        <Clock className="w-10 h-10 text-[#5a6cf3]" />
                        System Logs
                    </h1>
                    <p className="text-gray-400">Monitor all system activities and events</p>
                </div>

                {/* Filters */}
                <div className="card p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search logs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="input-field pl-10 w-full"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="flex gap-2 items-center">
                            <Filter className="text-gray-400 w-5 h-5" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="input-field bg-[#1a1a2e]/80 text-white border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:border-[#5a6cf3] transition-colors cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 0.75rem center',
                                    paddingRight: '2.5rem',
                                    appearance: 'none'
                                }}
                            >
                                <option value="all" className="bg-[#1a1a2e] text-white">All Severity</option>
                                <option value="info" className="bg-[#1a1a2e] text-white">Info</option>
                                <option value="warning" className="bg-[#1a1a2e] text-white">Warning</option>
                                <option value="error" className="bg-[#1a1a2e] text-white">Error</option>
                            </select>
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={fetchLogs}
                            disabled={loading}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 mt-4 text-sm">
                        <span className="text-gray-400">
                            Total: <span className="text-white font-semibold">{logs.length}</span>
                        </span>
                        <span className="text-gray-400">
                            Filtered: <span className="text-white font-semibold">{filteredLogs.length}</span>
                        </span>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="card overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-8 h-8 text-[#5a6cf3] animate-spin" />
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">No logs found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-4 px-6 text-gray-400 font-semibold">Severity</th>
                                        <th className="text-left py-4 px-6 text-gray-400 font-semibold">Event</th>
                                        <th className="text-left py-4 px-6 text-gray-400 font-semibold">Details</th>
                                        <th className="text-left py-4 px-6 text-gray-400 font-semibold">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map((log, index) => (
                                        <tr
                                            key={log.id || index}
                                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(log.severity)}
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusClass(log.severity)}`}>
                                                        {log.severity || 'info'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-white font-medium">{log.event}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-gray-300 text-sm">{formatDetails(log.details)}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-gray-400 text-sm">
                                                    {formatTimestamp(log.timestamp)}
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
};

export default SystemLogs;
