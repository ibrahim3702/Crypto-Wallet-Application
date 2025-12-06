import { useState, useEffect } from 'react';
import { walletAPI } from '../api';
import { Loader, Package, Coins } from 'lucide-react';

export default function UTXOs() {
    const [utxos, setUtxos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalBalance, setTotalBalance] = useState(0);

    useEffect(() => {
        fetchUTXOs();
    }, []);

    const fetchUTXOs = async () => {
        try {
            const response = await walletAPI.getMyUTXOs();
            setUtxos(response.data.utxos || []);
            setTotalBalance(response.data.total_balance || 0);
        } catch (error) {
            console.error('Error fetching UTXOs:', error);
            setUtxos([]);
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
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-white">Unspent Transaction Outputs (UTXOs)</h1>
                </div>

                <div className="card bg-gradient-to-br from-indigo-600 to-purple-600 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-indigo-200 text-sm">Total Balance from UTXOs</p>
                            <p className="text-white font-bold text-3xl">{totalBalance.toFixed(2)} CW</p>
                            <p className="text-indigo-200 text-sm mt-1">{utxos.length} unspent outputs</p>
                        </div>
                        <Coins className="w-16 h-16 text-indigo-200" />
                    </div>
                </div>

                {utxos.length === 0 ? (
                    <div className="card text-center py-12">
                        <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No unspent outputs available</p>
                        <p className="text-gray-500 text-sm mt-2">Receive some coins to see UTXOs here</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {utxos.map((utxo, index) => (
                            <div key={index} className="card hover:bg-gray-700/50 transition">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <div className="bg-indigo-500 p-2 rounded-lg">
                                                <Package className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-lg">{(utxo.value || 0).toFixed(2)} CW</p>
                                                <p className="text-gray-400 text-sm">Output #{utxo.vout || 0}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <span className="text-gray-400">Transaction ID:</span>
                                                <p className="text-white font-mono text-xs break-all mt-1">{utxo.tx_id || utxo.txid || 'N/A'}</p>
                                            </div>

                                            <div>
                                                <span className="text-gray-400">Public Key Hash:</span>
                                                <p className="text-white font-mono text-xs break-all mt-1">{utxo.pub_key_hash || utxo.pubKeyHash || 'N/A'}</p>
                                            </div>

                                            {utxo.block_index !== undefined && (
                                                <div>
                                                    <span className="text-gray-400">Block Index:</span>
                                                    <span className="text-white ml-2">#{utxo.block_index}</span>
                                                </div>
                                            )}

                                            <div>
                                                <span className="text-gray-400">Status:</span>
                                                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${utxo.is_spent ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'
                                                    }`}>
                                                    {utxo.is_spent ? 'Spent' : 'Unspent'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
