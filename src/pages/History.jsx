
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import ReviewModal from '../components/ReviewModal';
import Spinner from '../components/Spinner';

export default function History() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewsWritten, setReviewsWritten] = useState(new Set()); // IDs of sessions reviewed
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [mainError, setMainError] = useState(null);

    useEffect(() => {
        async function fetchHistory() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setCurrentUser(user);

            // Fetch reviews I've written to know what buttons to hide
            const { data: myReviews } = await supabase
                .from('reviews')
                .select('session_id')
                .eq('reviewer_id', user.id);

            if (myReviews) {
                const reviewedSessionIds = new Set(myReviews.map(r => r.session_id));
                setReviewsWritten(reviewedSessionIds);
            }

            // 1. Fetch completed REQUESTS (One-on-one sessions OR as a learner in a group)
            const { data: requestsData, error: reqError } = await supabase
                .from('requests')
                .select(`
                    *,
                    skills (title, description),
                    provider:profiles!requests_provider_id_fkey (id, full_name, avatar_url),
                    learner:profiles!requests_learner_id_fkey (id, full_name, avatar_url)
                `)
                // .neq('status', 'pending') // REMOVED FOR DEBUGGING
                // .neq('status', 'accepted') // REMOVED FOR DEBUGGING
                .or(`provider_id.eq.${user.id},learner_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (reqError) {
                console.error('Error fetching request history:', reqError);
                setMainError(reqError);
            }

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

    if (loading) return <Spinner size="lg" />;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Class History</h1>

            {sessions.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
                    <p className="text-gray-500 dark:text-gray-400">No classes found (pending, active, or completed).</p>
                    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded text-xs text-left overflow-auto">
                        <p className="font-bold">Debug Info:</p>
                        <p>User ID: {currentUser?.id}</p>
                        <p>Requests Found (Complex Query): {sessions.length}</p>
                        {mainError && (
                            <div className="text-red-500 font-bold my-2">
                                Query Error: {mainError.message}
                                <br />
                                Hint: {mainError.hint || 'No hint'}
                            </div>
                        )}
                        <button
                            onClick={async () => {
                                const { count, error } = await supabase
                                    .from('requests')
                                    .select('*', { count: 'exact', head: true })
                                    .or(`provider_id.eq.${currentUser.id},learner_id.eq.${currentUser.id}`);
                                alert(`Raw Request Count in DB for you: ${count} (Error: ${error?.message})`);
                            }}
                            className="mt-2 text-indigo-500 underline"
                        >
                            Check Database Raw Count
                        </button>
                    </div>
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
                                                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${session.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            session.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                                                'bg-red-100 text-red-800'}`}>
                                                        {session.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="text-sm text-gray-500">
                                                {new Date(session.created_at).toLocaleDateString()}
                                            </div>
                                            {/* Review Button */}
                                            {session.partner?.id && !reviewsWritten.has(session.id) && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedSession(session);
                                                        setReviewModalOpen(true);
                                                    }}
                                                    className="mt-1 flex items-center text-xs text-yellow-600 hover:text-yellow-700 bg-yellow-50 px-2 py-1 rounded border border-yellow-200"
                                                >
                                                    <Star className="w-3 h-3 mr-1" />
                                                    Rate {session.role === 'Learning' ? 'Teacher' : 'Student'}
                                                </button>
                                            )}
                                            {session.partner?.id && reviewsWritten.has(session.id) && (
                                                <span className="mt-1 flex items-center text-xs text-green-600">
                                                    <Star className="w-3 h-3 mr-1 fill-green-600" />
                                                    Reviewed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <ReviewModal
                isOpen={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                reviewerId={currentUser?.id}
                targetId={selectedSession?.partner?.id || selectedSession?.partner?.user_id} // Make sure to get correct ID
                sessionId={selectedSession?.id}
                targetName={selectedSession?.partner?.full_name}
                onReviewSubmitted={() => {
                    setReviewsWritten(prev => new Set(prev).add(selectedSession.id));
                }}
            />
        </div>
    );
}
