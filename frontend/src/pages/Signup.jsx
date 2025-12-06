import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Wallet, User, Mail, CreditCard, Loader } from 'lucide-react';

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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 flex items-center justify-center px-4 py-8">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <Wallet className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                    <p className="text-gray-400">Join the decentralized wallet system</p>
                </div>

                <div className="card">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg mb-4">
                            {message}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleSignup}>
                            <div className="mb-4">
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

                            <div className="mb-4">
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

                            <div className="mb-6">
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
                        <div>
                            {walletInfo && (
                                <>
                                    <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4 mb-4">
                                        <p className="text-yellow-400 text-sm font-semibold mb-2">⚠️ IMPORTANT - Save Your Private Key!</p>
                                        <p className="text-yellow-300 text-xs mb-3">
                                            This is your ONLY chance to see your private key. Save it securely - you'll need it to send transactions.
                                        </p>
                                        <p className="text-gray-400 text-xs mb-1">Private Key:</p>
                                        <div className="bg-gray-900 p-3 rounded border border-gray-700">
                                            <p className="text-white text-xs break-all font-mono select-all">
                                                {walletInfo.private_key || walletInfo.encrypted_private_key}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(walletInfo.private_key || walletInfo.encrypted_private_key);
                                                alert('Private key copied to clipboard!');
                                            }}
                                            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
                                        >
                                            📋 Click to copy
                                        </button>
                                    </div>
                                    <div className="bg-indigo-500/10 border border-indigo-500 rounded-lg p-4 mb-4">
                                        <p className="text-indigo-400 text-sm font-semibold mb-2">Your Wallet ID:</p>
                                        <p className="text-white text-xs break-all font-mono">{walletInfo.wallet_id}</p>
                                    </div>
                                </>
                            )}

                            <form onSubmit={handleVerifyOTP}>
                                <div className="mb-4">
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
                            <Link to="/login" className="text-indigo-500 hover:text-indigo-400 font-semibold">
                                Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
