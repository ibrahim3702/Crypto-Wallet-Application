import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { blockchainAPI } from '../api';
import InfoModal from '../components/InfoModal';
import ConfirmModal from '../components/ConfirmModal';

const ValidateBlockchain = () => {
    const navigate = useNavigate();
    const [validating, setValidating] = useState(false);
    const [result, setResult] = useState(null);
    const [modal, setModal] = useState({ show: false, type: '', message: '' });
    const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });

    const handleValidate = () => {
        setConfirmModal({
            show: true,
            message: 'This will validate the entire blockchain and automatically revert any problematic blocks. Do you want to proceed?',
            onConfirm: async () => {
                setConfirmModal({ show: false, message: '', onConfirm: null });
                setValidating(true);
                setResult(null);

                try {
                    const response = await blockchainAPI.validateAndRevert();
                    const data = response.data;
                    setResult(data);

                    if (data.valid) {
                        setModal({
                            show: true,
                            type: 'success',
                            message: `✅ Blockchain is valid! ${data.blocks} blocks verified successfully.`
                        });
                    } else {
                        setModal({
                            show: true,
                            type: 'success',
                            message: `🔄 Blockchain validation complete. ${data.reverted_blocks} problematic blocks have been reverted.`
                        });
                    }
                } catch (error) {
                    setModal({
                        show: true,
                        type: 'error',
                        message: 'Failed to validate blockchain: ' + (error.response?.data?.error || error.message)
                    });
                } finally {
                    setValidating(false);
                }
            }
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] p-6">
            <InfoModal
                show={modal.show}
                type={modal.type}
                message={modal.message}
                onClose={() => setModal({ show: false, type: '', message: '' })}
            />
            <ConfirmModal
                open={confirmModal.show}
                title="Validate Blockchain"
                description={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal({ show: false, message: '', onConfirm: null })}
            />

            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                        <Shield className="w-10 h-10 text-[#5a6cf3]" />
                        Validate Blockchain
                    </h1>
                    <p className="text-gray-400">Check blockchain integrity and revert problematic blocks</p>
                </div>

                {/* Info Card */}
                <div className="card p-6 mb-6">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Important Information</h3>
                            <ul className="text-gray-300 space-y-2 text-sm">
                                <li>• This operation validates the entire blockchain from the genesis block</li>
                                <li>• It checks each block's hash, previous hash, proof of work, and transaction integrity</li>
                                <li>• If any problematic blocks are found, they will be automatically reverted</li>
                                <li>• Reverted transactions will be moved back to the pending pool</li>
                                <li>• UTXOs will be recalculated and user balances will be updated</li>
                                <li>• This action is logged in the system logs</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Validate Button */}
                <div className="card p-8 text-center mb-6">
                    <Shield className="w-16 h-16 text-[#5a6cf3] mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-4">
                        {validating ? 'Validating Blockchain...' : 'Ready to Validate'}
                    </h2>
                    <p className="text-gray-400 mb-6">
                        {validating
                            ? 'Please wait while we check the blockchain integrity...'
                            : 'Click the button below to start the validation process'}
                    </p>
                    <button
                        onClick={handleValidate}
                        disabled={validating}
                        className={`btn-primary inline-flex items-center gap-3 px-8 py-4 text-lg ${validating ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {validating ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Validating...
                            </>
                        ) : (
                            <>
                                <Shield className="w-5 h-5" />
                                Validate Blockchain
                            </>
                        )}
                    </button>
                </div>

                {/* Results */}
                {result && (
                    <div className={`card p-6 ${result.valid ? 'border-2 border-green-500/30' : 'border-2 border-yellow-500/30'}`}>
                        <div className="flex items-start gap-4">
                            {result.valid ? (
                                <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
                            ) : (
                                <AlertTriangle className="w-8 h-8 text-yellow-400 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-4">
                                    {result.valid ? 'Blockchain is Valid ✅' : 'Blockchain Issues Detected & Fixed 🔄'}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {result.valid ? (
                                        <>
                                            <div className="bg-white/5 p-4 rounded-lg">
                                                <p className="text-gray-400 text-sm mb-1">Total Blocks</p>
                                                <p className="text-2xl font-bold text-white">{result.blocks}</p>
                                            </div>
                                            <div className="bg-white/5 p-4 rounded-lg">
                                                <p className="text-gray-400 text-sm mb-1">Status</p>
                                                <p className="text-lg font-semibold text-green-400">All Verified</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-white/5 p-4 rounded-lg">
                                                <p className="text-gray-400 text-sm mb-1">Problematic Block Index</p>
                                                <p className="text-2xl font-bold text-yellow-400">{result.problematic_index}</p>
                                            </div>
                                            <div className="bg-white/5 p-4 rounded-lg">
                                                <p className="text-gray-400 text-sm mb-1">Reverted Blocks</p>
                                                <p className="text-2xl font-bold text-yellow-400">{result.reverted_blocks}</p>
                                            </div>
                                            <div className="bg-white/5 p-4 rounded-lg">
                                                <p className="text-gray-400 text-sm mb-1">Reverted Transactions</p>
                                                <p className="text-2xl font-bold text-yellow-400">{result.reverted_transactions}</p>
                                            </div>
                                            <div className="bg-white/5 p-4 rounded-lg">
                                                <p className="text-gray-400 text-sm mb-1">Remaining Blocks</p>
                                                <p className="text-2xl font-bold text-white">{result.remaining_blocks}</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {!result.valid && (
                                    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                        <p className="text-sm font-semibold text-yellow-400 mb-2">Reason for Revert:</p>
                                        <p className="text-sm text-gray-300">{result.reason}</p>
                                        <p className="text-sm text-gray-400 mt-2">{result.message}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ValidateBlockchain;
