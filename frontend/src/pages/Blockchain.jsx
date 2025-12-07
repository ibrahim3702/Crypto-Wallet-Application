import { useState, useEffect } from 'react';
import { blockchainAPI } from '../api';
import { Blocks, Loader, Package, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function Blockchain() {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBlock, setSelectedBlock] = useState(null);
    const [showMineModal, setShowMineModal] = useState(false);
    const [mining, setMining] = useState(false);
    const [mineResult, setMineResult] = useState(null);

    useEffect(() => {
        fetchBlockchain();
    }, []);

    const fetchBlockchain = async () => {
        try {
            const response = await blockchainAPI.getChain();
            setBlocks(response.data.blockchain.reverse());
        } catch (error) {
            console.error('Error fetching blockchain:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMineClick = () => {
        setShowMineModal(true);
        setMineResult(null);
    };

    const confirmMine = async () => {
        setMining(true);
        setMineResult(null);
        try {
            const response = await blockchainAPI.mine();
            setMineResult({
                success: true,
                message: 'Block mined successfully!',
                data: response.data
            });
            fetchBlockchain();
        } catch (error) {
            setMineResult({
                success: false,
                message: error.response?.data?.error || 'Mining failed'
            });
        } finally {
            setMining(false);
        }
    };

    const closeMineModal = () => {
        setShowMineModal(false);
        setMineResult(null);
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
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="section-title">Explorer</p>
                        <h1 className="text-3xl font-bold text-white">Blockchain</h1>
                    </div>
                    <button onClick={handleMineClick} className="btn-primary">
                        Mine Block
                    </button>
                </div>                <div className="grid grid-cols-1 gap-4">
                    {blocks.map((block, index) => (
                        <div key={block.index} className="card hover:border-white/20 transition cursor-pointer" onClick={() => setSelectedBlock(block)}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 rounded-lg bg-white/10 border border-white/10">
                                        <Package className="w-8 h-8 text-[#7fffd4]" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Block #{block.index}</h3>
                                        <p className="text-gray-400 text-sm">
                                            {new Date(block.timestamp * 1000).toLocaleString()}
                                        </p>
                                        <p className="text-gray-500 text-xs font-mono mt-1">
                                            {block.hash.substring(0, 32)}...
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-300 text-sm">{block.transactions.length} Transactions</p>
                                    <p className="text-gray-500 text-xs">Nonce: {block.nonce}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {selectedBlock && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setSelectedBlock(null)}>
                        <div className="frosted-panel p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <h2 className="text-2xl font-bold text-white mb-4">Block #{selectedBlock.index}</h2>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-gray-400">Hash:</span>
                                    <p className="text-white font-mono text-xs break-all">{selectedBlock.hash}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400">Previous Hash:</span>
                                    <p className="text-white font-mono text-xs break-all">{selectedBlock.prev_hash}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400">Merkle Root:</span>
                                    <p className="text-white font-mono text-xs break-all">{selectedBlock.merkle_root}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-gray-400">Timestamp:</span>
                                        <p className="text-white">{new Date(selectedBlock.timestamp * 1000).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Nonce:</span>
                                        <p className="text-white">{selectedBlock.nonce}</p>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-400">Transactions: {selectedBlock.transactions.length}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedBlock(null)} className="mt-4 btn-secondary w-full">
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {showMineModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={closeMineModal}>
                        <div className="frosted-panel p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-white">Mine New Block</h2>
                                <button onClick={closeMineModal} className="text-gray-300 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {!mineResult ? (
                                <>
                                    <p className="text-gray-200 mb-6">
                                        Mine now to include pending transactions and claim the 50 CW reward.
                                    </p>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={confirmMine}
                                            disabled={mining}
                                            className="btn-primary flex-1 flex items-center justify-center"
                                        >
                                            {mining ? (
                                                <>
                                                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                                                    Mining...
                                                </>
                                            ) : (
                                                'Confirm Mine'
                                            )}
                                        </button>
                                        <button onClick={closeMineModal} className="btn-secondary flex-1">
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={`flex items-center p-4 rounded-lg mb-4 ${mineResult.success ? 'bg-emerald-400/15 text-emerald-200' : 'bg-red-400/15 text-red-200'
                                        }`}>
                                        {mineResult.success ? (
                                            <CheckCircle className="w-6 h-6 mr-3" />
                                        ) : (
                                            <AlertCircle className="w-6 h-6 mr-3" />
                                        )}
                                        <div>
                                            <p className="font-semibold">{mineResult.message}</p>
                                            {mineResult.success && mineResult.data && (
                                                <p className="text-sm mt-1">
                                                    Block #{mineResult.data.block.index} | {mineResult.data.transactions_count} transactions
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={closeMineModal} className="btn-primary w-full">
                                        Close
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
