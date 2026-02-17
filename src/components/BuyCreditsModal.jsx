import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, CreditCard, CheckCircle, Loader } from 'lucide-react';

export default function BuyCreditsModal({ isOpen, onClose, onSuccess, userId }) {
    const [loading, setLoading] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);

    if (!isOpen) return null;

    const PACKAGES = [
        { credits: 5, price: 5, label: 'Starter Pack' },
        { credits: 10, price: 9, label: 'Value Pack' }, // Discounted
        { credits: 20, price: 16, label: 'Pro Pack' }   // More discounted
    ];

    const handleBuy = async () => {
        if (!selectedPackage) return;
        setLoading(true);

        try {
            // 1. Simulate Payment Delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 2. Get current credits
            const { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', userId)
                .single();

            if (fetchError) throw fetchError;

            // 3. Update credits
            const newBalance = (profile.credits || 0) + selectedPackage.credits;
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ credits: newBalance })
                .eq('id', userId);

            if (updateError) throw updateError;

            // 4. Success
            alert(`Successfully purchased ${selectedPackage.credits} credits!`);
            onSuccess(); // Refresh dashboard data
            onClose();
        } catch (error) {
            console.error('Purchase failed:', error);
            alert('Purchase failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

                {/* Background overlay */}
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
                        <button
                            type="button"
                            className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={onClose}
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                            <CreditCard className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                Buy Credits
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    Select a credit package to purchase. Credits are used to request sessions from mentors.
                                </p>

                                <div className="grid grid-cols-1 gap-4">
                                    {PACKAGES.map((pkg) => (
                                        <div
                                            key={pkg.credits}
                                            onClick={() => setSelectedPackage(pkg)}
                                            className={`
                                                relative rounded-lg border p-4 cursor-pointer flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                                                ${selectedPackage === pkg
                                                    ? 'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                    : 'border-gray-300 dark:border-gray-600'}
                                            `}
                                        >
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-lg">{pkg.credits} Credits</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{pkg.label}</p>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-xl font-bold text-gray-900 dark:text-white">${pkg.price}</span>
                                                {selectedPackage === pkg && (
                                                    <CheckCircle className="h-6 w-6 text-indigo-600 ml-3" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            disabled={loading || !selectedPackage}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleBuy}
                        >
                            {loading ? (
                                <>
                                    <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                    Processing...
                                </>
                            ) : (
                                `Pay $${selectedPackage?.price || '0'}`
                            )}
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
