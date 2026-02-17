import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Award, CheckCircle, Loader } from 'lucide-react';

export default function IssueCertificateModal({ isOpen, onClose, request, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [learnerName, setLearnerName] = useState(request?.profiles?.full_name || '');

    if (!isOpen || !request) return null;

    const handleIssue = async () => {
        if (!learnerName.trim()) {
            alert("Please enter the learner's name for the certificate.");
            return;
        }
        setLoading(true);

        try {
            // 1. Get current credits for transaction
            const { data: learner } = await supabase.from('profiles').select('credits').eq('id', request.learner_id).single();
            const { data: provider } = await supabase.from('profiles').select('credits').eq('id', request.provider_id).single(); // Should be current user

            if (!learner || !provider) throw new Error("Could not fetch profile data.");

            // 2. Insert Certificate
            const { data: certificate, error: certError } = await supabase
                .from('certificates')
                .insert([{
                    learner_id: request.learner_id,
                    provider_id: request.provider_id,
                    skill_id: request.skill_id,
                    learner_name: learnerName,
                    issued_at: new Date()
                }])
                .select()
                .single();

            if (certError) throw certError;

            // 3. Update Request Status
            const { error: reqError } = await supabase
                .from('requests')
                .update({ status: 'completed' })
                .eq('id', request.id);

            if (reqError) throw reqError;

            // 4. Transact Credits (Provider only, Learner paid on booking)
            // await supabase.from('profiles').update({ credits: learner.credits - 1 }).eq('id', request.learner_id);
            await supabase.from('profiles').update({ credits: provider.credits + 1 }).eq('id', request.provider_id);

            // 5. Notification
            await supabase.from('notifications').insert([{
                user_id: request.learner_id,
                type: 'session_completed',
                message: `Session completed! You received a certificate for "${request.skills.title}".`,
                link: `/certificate/${certificate.id}`
            }]);

            alert('Certificate issued and session marked as completed!');
            onSuccess();
            onClose();

        } catch (error) {
            console.error('Issue failed:', error);
            alert('Failed to issue certificate: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
                        <button onClick={onClose} className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none">
                            <span className="sr-only">Close</span>
                            <X className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                            <Award className="h-6 w-6 text-green-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                Issue Certificate
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    You are about to complete the session for <strong>{request.skills.title}</strong>.
                                    <br />
                                    Please confirm the learner's name as it should appear on the certificate.
                                </p>

                                <div className="mt-4">
                                    <label htmlFor="learnerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Learner Name
                                    </label>
                                    <input
                                        type="text"
                                        name="learnerName"
                                        id="learnerName"
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                                        value={learnerName}
                                        onChange={(e) => setLearnerName(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            disabled={loading}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={handleIssue}
                        >
                            {loading ? <Loader className="animate-spin h-5 w-5" /> : 'Issue & Complete'}
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
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
