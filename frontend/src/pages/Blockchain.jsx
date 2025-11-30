import { useState, useEffect } from 'react';
import { blockchainAPI } from '../api';
import { Blocks, Loader, Package } from 'lucide-react';

export default function Blockchain() {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBlock, setSelectedBlock] = useState(null);

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

    const handleMine = async () => {
        if (!confirm('Mine pending transactions into a new block?')) return;

        setLoading(true);
        try {
            await blockchainAPI.mine();
            alert('Block mined successfully!');
            fetchBlockchain();
        } catch (error) {
            alert(error.response?.data?.error || 'Mining failed');
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
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">Blockchain Explorer</h1>
                    <button onClick={handleMine} className="btn-primary">
                        Mine Block
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {blocks.map((block, index) => (
                        <div key={block.index} className="card hover:bg-gray-700/50 transition cursor-pointer" onClick={() => setSelectedBlock(block)}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-indigo-500 p-3 rounded-lg">
                                        <Package className="w-8 h-8 text-white" />
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
                                    <p className="text-gray-400 text-sm">{block.transactions.length} Transactions</p>
                                    <p className="text-gray-500 text-xs">Nonce: {block.nonce}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {selectedBlock && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setSelectedBlock(null)}>
                        <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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
            </div>
        </div>
    );
}
