import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Wallet, LogOut, User, Send, Clock, BarChart3, Blocks, Package, BadgeDollarSign, ChevronDown, Shield, FileText, Info } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleValidateBlockchain = () => {
        setShowDropdown(false);
        navigate('/validate-blockchain');
    };

    const handleViewLogs = () => {
        setShowDropdown(false);
        navigate('/system-logs');
    };

    const handleViewWallet = () => {
        setShowDropdown(false);
        navigate('/wallet-details');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-black/40 border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <Link to="/dashboard" className="flex items-center space-x-3 group">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-[#5a6cf3] to-[#7fffd4] shadow-lg shadow-[#5a6cf3]/30">
                                <BadgeDollarSign className="w-6 h-6 text-gray-900" />
                            </div>
                            <div>
                                <span className="text-xs uppercase tracking-[0.25em] text-gray-400 block">Crypto Wallet</span>
                                <span className="text-lg font-bold text-white group-hover:text-[#7fffd4] transition">Nova</span>
                            </div>
                        </Link>

                        <div className="hidden md:flex space-x-2">
                            {[
                                { to: '/dashboard', label: 'Dashboard', icon: Wallet },
                                { to: '/send', label: 'Send', icon: Send },
                                { to: '/transactions', label: 'History', icon: Clock },
                                { to: '/blockchain', label: 'Chain', icon: Blocks },
                                { to: '/utxos', label: 'UTXOs', icon: Package },
                                { to: '/reports', label: 'Reports', icon: BarChart3 }
                            ].map(({ to, label, icon: Icon }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition"
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{label}</span>
                                </Link>
                            ))}

                            {/* More Options Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition"
                                >
                                    <span>More</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showDropdown && (
                                    <div className="absolute top-full mt-2 right-0 w-56 backdrop-blur-xl bg-[#1a1a2e]/95 border border-white/20 rounded-xl py-1 shadow-2xl z-50">
                                        <button
                                            onClick={handleValidateBlockchain}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-300 hover:text-white hover:bg-white/10 transition"
                                        >
                                            <Shield className="w-4 h-4" />
                                            <div>
                                                <p className="font-medium text-sm">Validate Blockchain</p>
                                                <p className="text-[10px] text-gray-400">Check integrity & revert</p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={handleViewLogs}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-300 hover:text-white hover:bg-white/10 transition"
                                        >
                                            <FileText className="w-4 h-4" />
                                            <div>
                                                <p className="font-medium text-sm">View Logs</p>
                                                <p className="text-[10px] text-gray-400">System activity</p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={handleViewWallet}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-300 hover:text-white hover:bg-white/10 transition"
                                        >
                                            <Info className="w-4 h-4" />
                                            <div>
                                                <p className="font-medium text-sm">Wallet Details</p>
                                                <p className="text-[10px] text-gray-400">Complete info</p>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-white">{user?.full_name}</p>
                            <p className="text-xs text-gray-400">{user?.wallet_id?.substring(0, 10)}...</p>
                        </div>
                        <Link to="/profile" className="p-2 rounded-lg hover:bg-white/10 text-gray-200 transition">
                            <User className="w-5 h-5" />
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg hover:bg-white/10 text-gray-200 transition"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
