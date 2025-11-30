import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { userAPI, walletAPI } from '../api';
import { User, Mail, Wallet, Key, Loader } from 'lucide-react';

export default function Profile() {
    const { user } = useAuth();
    const [walletInfo, setWalletInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWalletInfo();
    }, []);

    const fetchWalletInfo = async () => {
        try {
            const response = await walletAPI.getMyInfo();
            setWalletInfo(response.data);
        } catch (error) {
            console.error('Error fetching wallet info:', error);
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
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>

                <div className="space-y-6">
                    <div className="card">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                            <User className="w-5 h-5 mr-2" />
                            Personal Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-gray-400 text-sm">Full Name</label>
                                <p className="text-white font-semibold">{user?.full_name}</p>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm">Email</label>
                                <p className="text-white font-semibold">{user?.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                            <Wallet className="w-5 h-5 mr-2" />
                            Wallet Information
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-gray-400 text-sm">Wallet ID</label>
                                <p className="text-white font-mono text-sm break-all">{user?.wallet_id}</p>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm">Balance</label>
                                <p className="text-white font-bold text-2xl">{walletInfo?.balance.toFixed(2)} CW</p>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm">UTXOs</label>
                                <p className="text-white">{walletInfo?.utxo_count} unspent outputs</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                            <Key className="w-5 h-5 mr-2" />
                            Public Key
                        </h2>
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <p className="text-white font-mono text-xs break-all">{user?.public_key}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
