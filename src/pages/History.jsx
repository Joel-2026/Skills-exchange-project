
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

export default function History() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchHistory() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch requests where I am either learner or provider AND status is 'completed'
            const { data, error } = await supabase
                .from('requests')
                .select(`
                    *,
                    skills (title, description),
                    provider:profiles!public_requests_provider_id_fkey (full_name, avatar_url),
                    learner:profiles!public_requests_learner_id_fkey (full_name, avatar_url)
                `)
                .eq('status', 'completed')
                .order('created_at', { ascending: false });

            if (data) {
                const mapped = data.map(session => {
                    const isProvider = session.provider_id === user.id;
                    const partner = isProvider ? session.learner : session.provider;
                    const role = isProvider ? 'Teaching' : 'Learning';
                    return { ...session, partner, role };
                });
                setSessions(mapped);
            }
            setLoading(false);
        }
        fetchHistory();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading history...</div>;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Class History</h1>

            {sessions.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
                    <p className="text-gray-500 dark:text-gray-400">No completed classes yet.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md transition-colors">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sessions.map(session => (
                            <li key={session.id}>
                                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                {session.partner?.avatar_url ? (
                                                    <img className="h-10 w-10 rounded-full" src={session.partner.avatar_url} alt="" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600" />
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">{session.skills.title}</div>
                                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mr-2 ${session.role === 'Teaching' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        {session.role}
                                                    </span>
                                                    with {session.partner?.full_name}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="text-sm text-gray-500">
                                                Completed on {new Date(session.created_at).toLocaleDateString()}
                                            </div>
                                            {/* Placeholder for future Review feature */}
                                            {session.role === 'Learning' && (
                                                <button className="mt-1 flex items-center text-xs text-yellow-600 hover:text-yellow-700">
                                                    <Star className="w-3 h-3 mr-1" />
                                                    Leave Review
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
