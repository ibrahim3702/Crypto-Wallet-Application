import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Wallet, User, Mail, CreditCard, Loader } from 'lucide-react';
import InfoModal from '../components/InfoModal';

export default function Signup() {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        cnic: '',
    });
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1 = signup, 2 = OTP
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [walletInfo, setWalletInfo] = useState(null);
    const { signup, verifyOTP, loading } = useAuth();
    const [modal, setModal] = useState({ open: false, title: '', message: '', variant: 'info' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const result = await signup(formData);
        if (result.success) {
            setMessage('Account created! OTP sent to your email.');
            setWalletInfo(result.data);
            setStep(2);
        } else {
            setError(result.error);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');

        const result = await verifyOTP(formData.email, otp);
        if (!result.success) {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-10">
            <div className="max-w-md w-full space-y-6">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-[#5a6cf3] to-[#7fffd4] shadow-xl shadow-[#5a6cf3]/30 mb-4">
                        <Wallet className="w-10 h-10 text-gray-900" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                    <p className="text-gray-400">Join the decentralized wallet system</p>
                </div>

                <div className="card">
                    {error && (
                        <div className="bg-red-400/10 border border-red-400/40 text-red-200 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="bg-emerald-400/10 border border-emerald-400/40 text-emerald-200 px-4 py-3 rounded-lg mb-4">
                            {message}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm font-semibold mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        className="input-field pl-10"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-semibold mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="input-field pl-10"
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-semibold mb-2">
                                    CNIC / National ID
                                </label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="cnic"
                                        value={formData.cnic}
                                        onChange={handleChange}
                                        className="input-field pl-10"
                                        placeholder="12345-1234567-1"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary flex items-center justify-center"
                            >
                                {loading ? (
                                    <Loader className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            {walletInfo && (
                                <>
                                    <div className="bg-amber-400/10 border border-amber-400/40 rounded-lg p-4">
                                        <p className="text-amber-200 text-sm font-semibold mb-2">⚠️ IMPORTANT - Save Your Private Key!</p>
                                        <p className="text-amber-100 text-xs mb-3">
                                            This is your ONLY chance to see your private key. Save it securely - you'll need it to send transactions.
                                        </p>
                                        <p className="text-gray-400 text-xs mb-1">Private Key:</p>
                                        <div className="bg-black/40 p-3 rounded border border-white/10">
                                            <p className="text-white text-xs break-all font-mono select-all">
                                                {walletInfo.private_key || walletInfo.encrypted_private_key}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(walletInfo.private_key || walletInfo.encrypted_private_key);
                                                setModal({ open: true, title: 'Copied', message: 'Private key copied to clipboard.', variant: 'success' });
                                            }}
                                            className="mt-2 text-xs text-[#7fffd4] hover:text-white"
                                        >
                                            📋 Click to copy
                                        </button>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                        <p className="text-gray-300 text-sm font-semibold mb-2">Your Wallet ID:</p>
                                        <p className="text-white text-xs break-all font-mono">{walletInfo.wallet_id}</p>
                                    </div>
                                </>
                            )}

                            <form onSubmit={handleVerifyOTP} className="space-y-4">
                                <div>
                                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                                        Enter OTP
                                    </label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="input-field"
                                        placeholder="123456"
                                        maxLength={6}
                                        required
                                    />
                                    <p className="text-sm text-gray-400 mt-2">
                                        Check your email for the OTP code
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full btn-primary flex items-center justify-center"
                                >
                                    {loading ? (
                                        <Loader className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Verify & Complete Registration'
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <p className="text-gray-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-[#7fffd4] hover:text-white font-semibold">
                                Login
                            </Link>
                        </p>
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
