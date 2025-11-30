import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Wallet, LogOut, User, Send, Clock, BarChart3, Blocks } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-800 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <Link to="/dashboard" className="flex items-center space-x-2">
                            <Wallet className="w-8 h-8 text-indigo-500" />
                            <span className="text-xl font-bold text-white">CryptoWallet</span>
                        </Link>

                        <div className="hidden md:flex space-x-4">
                            <Link to="/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1">
                                <Wallet className="w-4 h-4" />
                                <span>Dashboard</span>
                            </Link>
                            <Link to="/send" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1">
                                <Send className="w-4 h-4" />
                                <span>Send Money</span>
                            </Link>
                            <Link to="/transactions" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>History</span>
                            </Link>
                            <Link to="/blockchain" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1">
                                <Blocks className="w-4 h-4" />
                                <span>Blockchain</span>
                            </Link>
                            <Link to="/reports" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1">
                                <BarChart3 className="w-4 h-4" />
                                <span>Reports</span>
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-white">{user?.full_name}</p>
                            <p className="text-xs text-gray-400">{user?.wallet_id?.substring(0, 10)}...</p>
                        </div>
                        <Link to="/profile" className="text-gray-300 hover:text-white">
                            <User className="w-6 h-6" />
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-gray-300 hover:text-white"
                        >
                            <LogOut className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
