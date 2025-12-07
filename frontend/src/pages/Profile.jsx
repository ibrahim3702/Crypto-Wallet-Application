import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { userAPI, walletAPI } from '../api';
import { User, Mail, Wallet, Key, Loader, Eye, EyeOff, Copy } from 'lucide-react';
import InfoModal from '../components/InfoModal';

export default function Profile() {
    const { user } = useAuth();
    const [walletInfo, setWalletInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [privateKey, setPrivateKey] = useState('');
    const [modal, setModal] = useState({ open: false, title: '', message: '', variant: 'info' });

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
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="w-12 h-12 text-[#7fffd4] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-10 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <p className="section-title">Account</p>
                    <h1 className="text-3xl font-bold text-white">Profile</h1>
                </div>

                <div className="space-y-6">
                    <div className="card">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                            <User className="w-5 h-5 mr-2" />
                            Personal Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="surface p-4 border-white/10">
                                <label className="text-gray-400 text-sm">Full Name</label>
                                <p className="text-white font-semibold">{user?.full_name}</p>
                            </div>
                            <div className="surface p-4 border-white/10">
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="surface p-4 border-white/10">
                                <label className="text-gray-400 text-sm">Wallet ID</label>
                                <p className="text-white font-mono text-sm break-all">{user?.wallet_id}</p>
                            </div>
                            <div className="surface p-4 border-white/10">
                                <label className="text-gray-400 text-sm">Balance</label>
                                <p className="text-white font-bold text-2xl">{walletInfo?.balance.toFixed(2)} CW</p>
                            </div>
                            <div className="surface p-4 border-white/10">
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
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <p className="text-white font-mono text-xs break-all">{user?.public_key}</p>
                        </div>
                    </div>

                    <div className="card bg-white/5 border border-red-400/20">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <Key className="w-5 h-5 mr-2" />
                                Private Key
                            </h2>
                            <button
                                onClick={async () => {
                                    if (!showPrivateKey) {
                                        try {
                                            const response = await userAPI.getPrivateKey();
                                            setPrivateKey(response.data.private_key || response.data.encrypted_private_key);
                                            setShowPrivateKey(true);
                                        } catch (error) {
                                            setModal({ open: true, title: 'Could not retrieve key', message: 'Please try again or relogin.', variant: 'error' });
                                        }
                                    } else {
                                        setShowPrivateKey(false);
                                        setPrivateKey('');
                                    }
                                }}
                                className="flex items-center space-x-2 text-sm text-red-300 hover:text-red-200"
                            >
                                {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                <span>{showPrivateKey ? 'Hide' : 'Reveal'}</span>
                            </button>
                        </div>
                        <div className="bg-amber-400/10 border border-amber-400/40 rounded-lg p-3 mb-3">
                            <p className="text-amber-200 text-xs">
                                ⚠️ Never share your private key with anyone. You need it to sign transactions.
                            </p>
                        </div>
                        {showPrivateKey ? (
                            <div className="bg-black/40 p-4 rounded-lg border border-white/10">
                                <p className="text-white font-mono text-xs break-all select-all mb-3">{privateKey}</p>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(privateKey);
                                        setModal({ open: true, title: 'Copied', message: 'Private key copied to clipboard.', variant: 'success' });
                                    }}
                                    className="flex items-center space-x-2 text-sm text-[#7fffd4] hover:text-white"
                                >
                                    <Copy className="w-4 h-4" />
                                    <span>Copy to Clipboard</span>
                                </button>
                            </div>
                        ) : (
                            <div className="bg-black/40 p-4 rounded-lg text-center border border-white/5">
                                <p className="text-gray-500">••••••••••••••••••••••••••••</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
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
