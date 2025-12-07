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
            console.log('UTXOs response:', response);
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
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="w-12 h-12 text-[#7fffd4] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-10 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="section-title">Ledger</p>
                        <h1 className="text-3xl font-bold text-white">Unspent Transaction Outputs</h1>
                        <p className="text-gray-400 mt-2">See the coins that fuel your next transactions.</p>
                    </div>
                    <div className="pill bg-white/10">
                        <Coins className="w-4 h-4 text-[#7fffd4]" />
                        <span className="text-sm">{utxos.length} outputs</span>
                    </div>
                </div>

                <div className="card relative overflow-hidden">
                    <div className="absolute -right-12 -top-16 w-56 h-56 rounded-full bg-[#7fffd4]/10 blur-3xl" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-gray-300 text-sm">Total Balance from UTXOs</p>
                            <p className="text-white font-bold text-4xl">{totalBalance.toFixed(2)} CW</p>
                            <p className="text-gray-400 text-sm mt-1">{utxos.length} unspent outputs</p>
                        </div>
                        <Coins className="w-16 h-16 text-[#7fffd4]" />
                    </div>
                </div>

                {utxos.length === 0 ? (
                    <div className="card text-center py-12">
                        <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-300">No unspent outputs available</p>
                        <p className="text-gray-500 text-sm mt-2">Receive some coins to see UTXOs here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {utxos.map((utxo, index) => (
                            <div key={index} className="card hover:border-white/20 transition">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                                                <Package className="w-5 h-5 text-[#7fffd4]" />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-lg">{(utxo.amount || 0).toFixed(2)} CW</p>
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
                                                <p className="text-white font-mono text-xs break-all mt-1">{utxo.wallet_id || utxo.pubKeyHash || 'N/A'}</p>
                                            </div>

                                            {utxo.block_index !== undefined && (
                                                <div>
                                                    <span className="text-gray-400">Block Index:</span>
                                                    <span className="text-white ml-2">#{utxo.block_index}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400">Status:</span>
                                                {utxo.is_spent ? (
                                                    <span className="pill tag-danger">Spent</span>
                                                ) : utxo.is_locked ? (
                                                    <span className="pill tag-warn">🔒 Locked (Pending)</span>
                                                ) : (
                                                    <span className="pill tag-success">✓ Available</span>
                                                )}
                                            </div>

                                            {utxo.is_locked && utxo.locked_by && (
                                                <div>
                                                    <span className="text-gray-400">Locked by Transaction:</span>
                                                    <p className="text-amber-200 font-mono text-xs break-all mt-1">{utxo.locked_by}</p>
                                                </div>
                                            )}
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
