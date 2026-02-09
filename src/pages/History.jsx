
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

            // 1. Fetch completed REQUESTS (One-on-one sessions OR as a learner in a group)
            const { data: requestsData, error: reqError } = await supabase
                .from('requests')
                .select(`
                    *,
                    skills (title, description),
                    provider:profiles!public_requests_provider_id_fkey (full_name, avatar_url),
                    learner:profiles!public_requests_learner_id_fkey (full_name, avatar_url)
                `)
                .eq('status', 'completed')
                .or(`provider_id.eq.${user.id},learner_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (reqError) console.error('Error fetching request history:', reqError);

            // 2. Fetch completed GROUP SESSIONS (As a HOST)
            // Requests only show up for learners. As a host, I need to see the sessions I created.
            const { data: groupData, error: groupError } = await supabase
                .from('group_sessions')
                .select(`
                    *,
                    skills (title, description)
                `)
                .eq('provider_id', user.id)
                .eq('status', 'completed')
                .order('created_at', { ascending: false });

            if (groupError) console.error('Error fetching group history:', groupError);

            // 3. Merge and formatting
            let combined = [];

            if (requestsData) {
                const mappedRequests = requestsData.map(session => {
                    const isProvider = session.provider_id === user.id;
                    const partner = isProvider ? session.learner : session.provider;
                    // For group sessions joined as learner, partner is provider.
                    const role = isProvider ? 'Teaching' : 'Learning';
                    return {
                        id: session.id,
                        type: 'request',
                        created_at: session.created_at,
                        skill_title: session.skills?.title,
                        role,
                        partner,
                        status: session.status
                    };
                });
                combined = [...combined, ...mappedRequests];
            }

            if (groupData) {
                const mappedGroups = groupData.map(session => {
                    return {
                        id: session.id,
                        type: 'group_session',
                        created_at: session.created_at,
                        skill_title: session.skills?.title,
                        role: 'Teaching', // As a host of a group session
                        partner: { full_name: 'Group Class' }, // No single partner
                        status: session.status
                    };
                });
                combined = [...combined, ...mappedGroups];
            }

            // sort by created_at desc
            combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            setSessions(combined);
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
                                                <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">{session.skill_title}</div>
                                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mr-2 ${session.role === 'Teaching' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        {session.role}
                                                    </span>
                                                    with <Link to={`/profile/${session.partner?.id || session.partner?.user_id}`} className="hover:underline hover:text-indigo-600 dark:hover:text-indigo-400">
                                                        {session.partner?.full_name}
                                                    </Link>
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
