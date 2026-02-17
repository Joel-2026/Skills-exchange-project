import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Users, Calendar, CheckCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Spinner from '../components/Spinner';

export default function GroupSessions() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [skills, setSkills] = useState([]);
    const [groupSessions, setGroupSessions] = useState([]); // Sessions I'm hosting
    const [joinedSessions, setJoinedSessions] = useState([]); // Sessions I've joined
    const [loading, setLoading] = useState(true);
    const [openSessions, setOpenSessions] = useState([]);
    const [showCreateOpen, setShowCreateOpen] = useState(false);
    const [newOpenSession, setNewOpenSession] = useState({ skill_id: '', scheduled_at: '', max_students: '' });
    const [activeTab, setActiveTab] = useState('hosting'); // 'hosting' or 'joined'

    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUser(user);
            await fetchData(user.id);
        }
        init();
    }, []);

    async function fetchData(userId) {
        setLoading(true);

        // Fetch user's skills
        const { data: skillsData } = await supabase
            .from('skills')
            .select('*')
            .eq('provider_id', userId);

        setSkills(skillsData || []);

        // 1. Fetch sessions I am HOSTING
        const { data: hostingData, error: hostingError } = await supabase
            .from('group_sessions')
            .select('*, skills(title, max_students), requests(*, learner:profiles!requests_learner_id_fkey(full_name))')
            .eq('provider_id', userId)
            .order('created_at', { ascending: false });

        if (hostingError) console.error('Error fetching hosting sessions:', hostingError);
        setGroupSessions(hostingData || []);

        // 2. Fetch sessions I have JOINED (as a learner)
        // We look for requests where learner_id is me and group_session_id is set
        const { data: joinedRequests, error: joinedError } = await supabase
            .from('requests')
            .select('group_session_id, group_sessions:group_sessions(*, skills(title, max_students), provider:profiles(full_name), requests(id))')
            .eq('learner_id', userId)
            .eq('status', 'accepted')
            .not('group_session_id', 'is', null);

        if (joinedError) console.error('Error fetching joined sessions:', joinedError);

        // Map the requests back to a session structure
        const myJoinedSessions = joinedRequests?.map(req => {
            const session = req.group_sessions;
            // The requests array in session might be all requests for that session, or we might need to fetch them if we want to show participant count properly.
            // The query above fetches data for the session.
            return session;
        }).filter(Boolean) || [];

        setJoinedSessions(myJoinedSessions);


        // 3. Fetch OPEN sessions (for browsing)
        const { data: openSessionsData, error: openSessionsError } = await supabase
            .from('group_sessions')
            .select('*, skills(title, max_students, provider_id), requests(id), provider:profiles(full_name)')
            .eq('status', 'scheduled')
            .order('created_at', { ascending: false });

        if (openSessionsError) {
            console.error('Error fetching open sessions:', openSessionsError);
        }

        setOpenSessions(openSessionsData || []);
        setLoading(false);
    }

    async function createOpenSession() {
        if (!newOpenSession.skill_id) {
            alert('Please select a skill');
            return;
        }

        const selectedSkill = skills.find(s => s.id === newOpenSession.skill_id);
        // Default to 10 for group sessions, or use user input. 
        // We do NOT restrict by selectedSkill.max_students because that might be for 1-on-1 coaching.
        const maxStudents = newOpenSession.max_students ? parseInt(newOpenSession.max_students) : 10;

        try {
            const { data: session, error } = await supabase
                .from('group_sessions')
                .insert([{
                    skill_id: newOpenSession.skill_id,
                    provider_id: user.id,
                    scheduled_at: newOpenSession.scheduled_at || null,
                    status: 'scheduled',
                    max_students: maxStudents
                }])
                .select()
                .single();

            if (error) throw error;

            alert('Open group session created! Learners can now join.');
            setShowCreateOpen(false);
            setNewOpenSession({ skill_id: '', scheduled_at: '', max_students: '' });
            fetchData(user.id);
        } catch (error) {
            alert('Error creating open session: ' + error.message);
        }
    }

    async function joinOpenSession(sessionId, skillId) {
        try {
            // Check if session is full before joining
            const session = openSessions.find(s => s.id === sessionId);
            if (session) {
                const currentParticipants = session.requests?.length || 0;
                const maxStudents = session.max_students ?? session.skills?.max_students ?? 1;

                // Check if already joined
                const alreadyJoined = session.requests?.some(req => req.learner_id === user.id);
                if (alreadyJoined) {
                    alert('You cannot join session twice');
                    return;
                }

                if (currentParticipants >= maxStudents) {
                    alert('This session is full.');
                    return;
                }
            }

            // Deduct 1 Credit
            const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
            if (profile.credits < 1) {
                alert("You don't have enough credits to join this session!");
                return;
            }

            if (!confirm(`Join this session? 1 Credit will be deducted immediately.`)) return;

            const { error: creditError } = await supabase
                .from('profiles')
                .update({ credits: profile.credits - 1 })
                .eq('id', user.id);

            if (creditError) {
                alert('Error processing credit deduction: ' + creditError.message);
                return;
            }

            // Create a request for this session
            const { data: request, error: requestError } = await supabase
                .from('requests')
                .insert([{
                    skill_id: skillId,
                    learner_id: user.id,
                    provider_id: (openSessions.find(s => s.id === sessionId))?.provider_id,
                    status: 'accepted',
                    group_session_id: sessionId
                }])
                .select()
                .single();

            if (requestError) {
                // Refund if failed
                await supabase.from('profiles').update({ credits: profile.credits }).eq('id', user.id);
                throw requestError;
            }

            // Notify provider
            await supabase.from('notifications').insert([{
                user_id: session.provider_id,
                type: 'learner_joined_group',
                message: `A learner joined your group session for "${session.skills.title}"`,
                link: `/group-sessions`
            }]);

            alert('Successfully joined the group session! 1 Credit deducted.');
            fetchData(user.id);
        } catch (error) {
            if (error.code === '23505') { // Unique violation
                alert('You cannot join session twice');
            } else {
                alert('Error joining session: ' + error.message);
            }
        }
    }

    if (loading) return <Spinner size="lg" />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Group Sessions</h1>

            {/* Create Open Session Section */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8 transition-colors">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Create Open Group Session
                    </h2>
                    <button
                        onClick={() => setShowCreateOpen(!showCreateOpen)}
                        className={`text-sm px-4 py-2 rounded-md transition-colors ${showCreateOpen
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                    >
                        {showCreateOpen ? 'Cancel' : '+ New Open Session'}
                    </button>
                </div>

                {showCreateOpen && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Select Skill
                                </label>
                                <select
                                    value={newOpenSession.skill_id}
                                    onChange={(e) => {
                                        const skill = skills.find(s => s.id === e.target.value);
                                        // Only set default if not already set, or if switching skills and we want to reset? 
                                        // Actually, let's just keep the current value if it exists, or default to 10.
                                        // Better yet, just set skill_id, and let the user override max_students if they want.
                                        setNewOpenSession(prev => ({
                                            ...prev,
                                            skill_id: e.target.value,
                                            max_students: prev.max_students || '10'
                                        }));
                                    }}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                >
                                    <option value="">Choose a skill...</option>
                                    {skills.map(skill => (
                                        <option key={skill.id} value={skill.id}>
                                            {skill.title} (Default Max: {skill.max_students})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Max Learners (Optional override)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Default: 10"
                                    value={newOpenSession.max_students}
                                    onChange={(e) => setNewOpenSession({ ...newOpenSession, max_students: e.target.value })}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Scheduled Time (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={newOpenSession.scheduled_at}
                                onChange={(e) => setNewOpenSession({ ...newOpenSession, scheduled_at: e.target.value })}
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                            />
                        </div>
                        <button
                            onClick={createOpenSession}
                            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                        >
                            Create Open Session
                        </button>
                    </div>
                )}
            </div>

            {/* Browse Open Sessions (for learners) */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8 transition-colors">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Available Open Sessions
                </h2>

                {openSessions.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No open sessions available to join.</p>
                ) : (
                    <div className="space-y-3">
                        {openSessions.map(session => {
                            const currentParticipants = session.requests?.length || 0;
                            // Priority: session max > skill max > 1
                            const maxStudents = session.max_students ?? session.skills?.max_students ?? 1;
                            const spotsLeft = maxStudents - currentParticipants;
                            const isMySession = session.provider_id === user?.id;
                            const alreadyJoined = session.requests?.some(req => req.learner_id === user?.id);
                            const isFull = spotsLeft <= 0;

                            return (
                                <div key={session.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900 dark:text-white">{session.skills?.title}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                By: <Link to={`/profile/${session.provider_id}`} className="hover:underline hover:text-indigo-600 dark:hover:text-indigo-400">
                                                    {session.provider?.full_name}
                                                </Link>
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {isFull ? (
                                                    <span className="text-red-500 font-medium">Full ({currentParticipants}/{maxStudents})</span>
                                                ) : (
                                                    <span>{currentParticipants}/{maxStudents} spots filled • {spotsLeft} spots left</span>
                                                )}
                                            </p>

                                            {/* Visual Slots */}
                                            <div className="flex space-x-1 mt-2">
                                                {Array.from({ length: maxStudents }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-3 h-3 rounded-full ${i < currentParticipants
                                                            ? 'bg-indigo-500 dark:bg-indigo-400'
                                                            : 'bg-gray-200 dark:bg-gray-600'
                                                            }`}
                                                        title={i < currentParticipants ? "Taken" : "Available"}
                                                    />
                                                ))}
                                            </div>

                                            {session.scheduled_at && (
                                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    <span>
                                                        {new Date(session.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                        {' • '}
                                                        {new Date(session.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {!isMySession && !alreadyJoined && !isFull && (
                                            <button
                                                onClick={() => joinOpenSession(session.id, session.skill_id)}
                                                className="ml-4 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                                            >
                                                Join Session
                                            </button>
                                        )}
                                        {isFull && !isMySession && !alreadyJoined && (
                                            <span className="ml-4 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded">
                                                Full
                                            </span>
                                        )}
                                        {alreadyJoined && (
                                            <span className="ml-4 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                                Joined
                                            </span>
                                        )}
                                        {isMySession && (
                                            <span className="ml-4 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded">
                                                Your Session
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Your Group Sessions Tabs */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden transition-colors">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex">
                        <button
                            onClick={() => setActiveTab('hosting')}
                            className={`${activeTab === 'hosting'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm w-1/2 text-center`}
                        >
                            <span className="flex justify-center items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                Hosting ({groupSessions.length})
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('joined')}
                            className={`${activeTab === 'joined'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm w-1/2 text-center`}
                        >
                            <span className="flex justify-center items-center">
                                <Users className="w-4 h-4 mr-2" />
                                Joined ({joinedSessions.length})
                            </span>
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'hosting' ? (
                        groupSessions.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">You are not hosting any sessions.</p>
                        ) : (
                            <div className="space-y-4">
                                {groupSessions.map(session => (
                                    <div key={session.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-medium text-gray-900 dark:text-white">{session.skills?.title}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {session.requests?.length || 0} learners
                                                    {session.max_students && ` / ${session.max_students} max`}
                                                </p>
                                                {session.scheduled_at ? (
                                                    <div className="mt-2 text-sm">
                                                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                                                            <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                                                            <span className="font-medium">
                                                                {new Date(session.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </span>
                                                            <span className="mx-2">•</span>
                                                            <span className="font-medium">
                                                                {new Date(session.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-400 mt-1 italic">Time not scheduled</p>
                                                )}
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${session.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                session.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                }`}>
                                                {session.status}
                                            </span>
                                        </div>

                                        {/* Visual Slots for Hosted Sessions */}
                                        <div className="flex space-x-1 mb-3">
                                            {Array.from({ length: session.max_students || session.skills?.max_students || 1 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-3 h-3 rounded-full ${i < (session.requests?.length || 0)
                                                        ? 'bg-indigo-500 dark:bg-indigo-400'
                                                        : 'bg-gray-200 dark:bg-gray-600'
                                                        }`}
                                                    title={i < (session.requests?.length || 0) ? "Taken" : "Available"}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {session.requests?.map(req => (
                                                <span key={req.id} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                                    <Link to={`/profile/${req.learner_id}`} className="hover:underline">
                                                        {req.learner?.full_name}
                                                    </Link>
                                                </span>
                                            ))}
                                            {(!session.requests || session.requests.length === 0) && (
                                                <span className="text-xs text-gray-400 italic">No learners yet</span>
                                            )}
                                        </div>
                                        <div className="flex space-x-2 mt-2">
                                            {session.status === 'completed' ? (
                                                <button
                                                    disabled
                                                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 px-4 py-2 rounded-md cursor-not-allowed text-sm"
                                                >
                                                    Class Completed
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => navigate(`/group-session/${session.id}`)}
                                                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm"
                                                >
                                                    Start Class
                                                </button>
                                            )}

                                            {/* End Session Button for List View */}
                                            {session.status !== 'completed' && session.status !== 'cancelled' && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            // Update group session status
                                                            const { error: sessionError } = await supabase
                                                                .from('group_sessions')
                                                                .update({ status: 'completed' })
                                                                .eq('id', session.id);

                                                            if (sessionError) throw sessionError;

                                                            // Update all requests associated with this session to completed
                                                            const { error: reqError } = await supabase
                                                                .from('requests')
                                                                .update({ status: 'completed' })
                                                                .eq('group_session_id', session.id);

                                                            if (reqError) throw reqError;

                                                            alert('Session ended successfully.');
                                                            fetchData(user.id); // Refresh list
                                                        } catch (error) {
                                                            console.error('Error ending session:', error);
                                                            alert('Failed to end session');
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors text-sm"
                                                >
                                                    End Session
                                                </button>
                                            )}

                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const { error } = await supabase
                                                            .from('group_sessions')
                                                            .delete()
                                                            .eq('id', session.id);

                                                        if (error) throw error;

                                                        // Optimistically update UI
                                                        setGroupSessions(current => current.filter(s => s.id !== session.id));
                                                        setOpenSessions(current => current.filter(s => s.id !== session.id));

                                                        alert('Session deleted successfully.');
                                                    } catch (err) {
                                                        alert('Error deleting session: ' + err.message);
                                                    }
                                                }}
                                                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        joinedSessions.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">You haven't joined any sessions yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {joinedSessions.map(session => (
                                    <div key={session.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-medium text-gray-900 dark:text-white">{session.skills?.title}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Hosted by: <Link to={`/profile/${session.provider_id || session.provider?.id}`} className="hover:underline hover:text-indigo-600 dark:hover:text-indigo-400">
                                                        {session.provider?.full_name}
                                                    </Link>
                                                </p>
                                                {session.scheduled_at ? (
                                                    <div className="mt-2 text-sm">
                                                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                                                            <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                                                            <span className="font-medium">
                                                                {new Date(session.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </span>
                                                            <span className="mx-2">•</span>
                                                            <span className="font-medium">
                                                                {new Date(session.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-400 mt-1 italic">Time not scheduled</p>
                                                )}
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${session.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                                                }`}>
                                                {session.status}
                                            </span>
                                        </div>

                                        {/* Visual Slots for Joined Sessions */}
                                        <div className="flex space-x-1 mb-3">
                                            {Array.from({ length: session.max_students || session.skills?.max_students || 1 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-3 h-3 rounded-full ${i < (session.requests?.length || 0)
                                                        ? 'bg-indigo-500 dark:bg-indigo-400'
                                                        : 'bg-gray-200 dark:bg-gray-600'
                                                        }`}
                                                    title={i < (session.requests?.length || 0) ? "Taken" : "Available"}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => navigate(`/group-session/${session.id}`)}
                                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                                            >
                                                Join Class
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const { error } = await supabase
                                                            .from('requests')
                                                            .delete()
                                                            .eq('group_session_id', session.id)
                                                            .eq('learner_id', user.id);

                                                        if (error) throw error;

                                                        // Optimistically update UI
                                                        setJoinedSessions(current => current.filter(s => s.id !== session.id));

                                                        // Decrease participant count
                                                        // Update open sessions to show "Join" button again and decrease participant count
                                                        setOpenSessions(current => current.map(s => {
                                                            if (s.id === session.id) {
                                                                return {
                                                                    ...s,
                                                                    requests: s.requests ? s.requests.filter(r => r.learner_id !== user.id) : []
                                                                };
                                                            }
                                                            return s;
                                                        }));

                                                        // Refund Credit
                                                        const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
                                                        await supabase.from('profiles').update({ credits: profile.credits + 1 }).eq('id', user.id);

                                                        alert('You have left the session. 1 Credit refunded.');
                                                        fetchData(user.id);
                                                    } catch (err) {
                                                        alert('Error leaving session: ' + err.message);
                                                    }
                                                }}
                                                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors text-sm"
                                            >
                                                Leave
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
