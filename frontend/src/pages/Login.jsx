import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Wallet, Mail, Lock, Loader } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1 = email, 2 = OTP
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const { login, verifyOTP, loading } = useAuth();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const result = await login(email);
        if (result.success) {
            setMessage('OTP sent to your email!');
            setStep(2);
        } else {
            setError(result.error);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');

        const result = await verifyOTP(email, otp);
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
                    <h1 className="text-3xl font-bold text-white mb-2">CryptoWallet Nova</h1>
                    <p className="text-gray-400">Secure entry with email + OTP</p>
                </div>

                <div className="card">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">Login</h2>

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
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm font-semibold mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input-field pl-10"
                                        placeholder="your@email.com"
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
                                    'Send OTP'
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm font-semibold mb-2">
                                    Enter OTP
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="input-field pl-10"
                                        placeholder="123456"
                                        maxLength={6}
                                        required
                                    />
                                </div>
                                <p className="text-sm text-gray-400 mt-2">
                                    Check your email for the OTP code.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary flex items-center justify-center mb-3"
                            >
                                {loading ? (
                                    <Loader className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Verify OTP'
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full btn-secondary"
                            >
                                Back
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <p className="text-gray-400">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-[#7fffd4] hover:text-white font-semibold">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
