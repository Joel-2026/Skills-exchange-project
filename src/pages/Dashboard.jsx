import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';  // Import useNavigate
import { supabase } from '../lib/supabaseClient';
import { Clock, BookOpen, PlusCircle } from 'lucide-react';

export default function Dashboard() {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) getProfile(session.user.id);
        });
    }, []);

    async function getProfile(userId) {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (error) {
            console.error('Error loading profile:', error.message);
        } finally {
            setLoading(false);
        }
    }

    async function seedData() {
        if (!profile) return;
        const confirmSeed = confirm("Add 10 mock skills to the database? You will be listed as the provider.");
        if (!confirmSeed) return;

        const MOCK_SKILLS = [
            { title: 'Intro to Python', category: 'Technology', description: 'Learn the basics of Python programming.', mode: 'online' },
            { title: 'Guitar Basics', category: 'Music', description: 'Strum your first chords in 30 minutes.', mode: 'offline' },
            { title: 'French Conversation', category: 'Language', description: 'Practice speaking French with a native speaker.', mode: 'online' },
            { title: 'Yoga for Beginners', category: 'Lifestyle', description: 'Relaxing yoga session for stress relief.', mode: 'online' },
            { title: 'Accounting 101', category: 'Business', description: 'Understand balance sheets and income statements.', mode: 'online' },
            { title: 'Calculus Help', category: 'Academics', description: 'Get help with derivatives and integrals.', mode: 'online' },
            { title: 'Vegan Cooking', category: 'Lifestyle', description: 'Healthy and delicious plant-based recipes.', mode: 'offline' },
            { title: 'Digital Marketing', category: 'Business', description: 'SEO and Social Media strategies.', mode: 'online' },
            { title: 'Piano Lessons', category: 'Music', description: 'Reading sheet music and basic scales.', mode: 'offline' },
            { title: 'React.js Mentorship', category: 'Technology', description: 'Code review and best practices.', mode: 'online' },
        ];

        const skillsToInsert = MOCK_SKILLS.map(s => ({
            provider_id: profile.id,
            title: s.title,
            category: s.category,
            description: s.description,
            mode: s.mode
        }));

        const { error } = await supabase.from('skills').insert(skillsToInsert);
        if (error) alert(error.message);
        else {
            alert('Mock skills added! Go to "Explore Skills" to see them.');
            window.location.reload();
        }
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-white dark:bg-gray-800 transition-colors">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                            Welcome back, {profile?.full_name || session?.user.email}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                            Manage your exchanges and skills.
                        </p>
                        <button onClick={seedData} className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-400 underline">
                            (Dev) Add Demo Data
                        </button>
                    </div>
                    <div className="flex items-center bg-indigo-50 px-4 py-2 rounded-full">
                        <Clock className="h-5 w-5 text-indigo-600 mr-2" />
                        <span className="text-xl font-bold text-indigo-700">{profile?.credits || 0}</span>
                        <span className="ml-1 text-sm text-indigo-600">Credits</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                {/* Action Card 1 */}
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-all">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <BookOpen className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">I want to learn</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900 dark:text-white">Find a Teacher</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3 transition-colors">
                        <div className="text-sm">
                            <Link to="/search" className="font-medium text-indigo-600 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-200">
                                Browse Skills &rarr;
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Action Card 2 */}
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-all">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <PlusCircle className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">I want to teach</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900 dark:text-white">List a Skill</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3 transition-colors">
                        <div className="text-sm">
                            <Link to="/add-skill" className="font-medium text-indigo-600 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-200">
                                List a New Skill &rarr;
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Skill Categories */}
            <div className="mb-8">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Browse by Category</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {['Technology', 'Music', 'Language', 'Lifestyle', 'Business', 'Academics'].map((category) => (
                        <Link
                            key={category}
                            to={`/search?category=${category}`}
                            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        >
                            <span className="text-gray-900 dark:text-white font-medium">{category}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent/Recommended Skills */}
            <RecentSkills profile={profile} />

            <RequestsList session={session} />
        </div>
    );
}

function RecentSkills({ profile }) {
    const [skills, setSkills] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        // If profile isn't loaded yet, wait.
        // Or if profile is loaded but no interests, just fetch recent.
        if (!profile) return;

        async function fetchSkills() {
            let query = supabase
                .from('skills')
                .select(`*, profiles(full_name, avatar_url)`)
                .order('created_at', { ascending: false })
                .limit(6); // Increased limit

            const interests = profile.interests || [];
            if (interests.length > 0) {
                // If user has interests, prioritize those categories
                // Note: Supabase basic filtering is strict. For a better rec system we might want "OR" but let's stick to strict "IN" for now as requested.
                // However, if we filter strictly, we might show nothing.
                // Let's try to fetch skills IN categories first.

                // Query 1: Matching Interests
                const { data: matched } = await supabase
                    .from('skills')
                    .select(`*, profiles(full_name, avatar_url)`)
                    .in('category', interests)
                    .order('created_at', { ascending: false })
                    .limit(6);

                if (matched && matched.length > 0) {
                    setSkills(matched);
                    setLoaded(true);
                    return;
                }
            }

            // Fallback (or if no profile/interests): Fetch generic recent
            const { data: recent } = await query;
            setSkills(recent || []);
            setLoaded(true);
        }

        fetchSkills();
    }, [profile]); // Re-run when profile loads

    if (!loaded) return <div className="mb-8 p-4 text-gray-500">Finding recommendations...</div>;

    const hasInterests = profile?.interests?.length > 0;
    const title = hasInterests ? "Recommended for You" : "Fresh Skills";

    return (
        <div className="mb-8">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{title}</h3>
            {skills.length === 0 ? (
                <p className="text-gray-500 text-sm">No skills found matching your interests yet. Check back later!</p>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {skills.map(skill => (
                        <div key={skill.id} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-100 dark:border-gray-700 p-4 transition-colors">
                            <div className="flex justify-between items-start">
                                <h4 className="text-md font-bold text-gray-900 dark:text-white truncate" title={skill.title}>{skill.title}</h4>
                                <span className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">{skill.category}</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2" title={skill.description}>{skill.description}</p>
                            <div className="mt-4 flex justify-between items-center">
                                <span className="text-xs text-gray-400">by <Link to={`/profile/${skill.provider_id || skill.profiles?.id}`} className="hover:underline">{skill.profiles?.full_name}</Link></span>
                                <Link to={`/search?category=${skill.title}`} className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline">View &rarr;</Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function RequestsList({ session }) {
    const [incoming, setIncoming] = useState([]);
    const [outgoing, setOutgoing] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // Hook for navigation

    useEffect(() => {
        if (session) fetchRequests();
    }, [session]);

    async function fetchRequests() {
        setLoading(true);
        // Fetch Incoming (I am the Provider)
        const { data: inc } = await supabase
            .from('requests')
            .select('*, skills(title), profiles:learner_id(full_name)')
            .eq('provider_id', session.user.id)
            .order('created_at', { ascending: false });

        // Fetch Outgoing (I am the Learner)
        const { data: out } = await supabase
            .from('requests')
            .select('*, skills(title), profiles:provider_id(full_name)')
            .eq('learner_id', session.user.id)
            .order('created_at', { ascending: false });

        setIncoming(inc ? inc.filter(r => r.status !== 'completed') : []);
        setOutgoing(out ? out.filter(r => r.status !== 'completed') : []);
        setLoading(false);
    }

    async function updateStatus(requestId, newStatus, requestData) {
        if (newStatus === 'completed') {
            const { data: learner } = await supabase.from('profiles').select('credits').eq('id', requestData.learner_id).single();
            const { data: provider } = await supabase.from('profiles').select('credits').eq('id', session.user.id).single();

            // 1. Update Request
            await supabase.from('requests').update({ status: 'completed' }).eq('id', requestId);

            // 2. Transact
            await supabase.from('profiles').update({ credits: learner.credits - 1 }).eq('id', requestData.learner_id);
            await supabase.from('profiles').update({ credits: provider.credits + 1 }).eq('id', session.user.id);

            // 3. Notify Learner
            await supabase.from('notifications').insert([{
                user_id: requestData.learner_id,
                type: 'session_completed',
                message: `Session completed! Credits exchanged for "${requestData.skills.title}".`,
                link: `/history`
            }]);

            alert('Session completed! Credits transferred.');
            window.location.reload();
        } else {
            // Accepted or Declined
            const { error } = await supabase
                .from('requests')
                .update({ status: newStatus })
                .eq('id', requestId);

            if (error) {
                alert('Update failed: ' + error.message);
            } else {
                // Notify Learner
                await supabase.from('notifications').insert([{
                    user_id: requestData.learner_id,
                    type: `request_${newStatus}`,
                    message: `Your request for "${requestData.skills.title}" was ${newStatus}.`,
                    link: `/session/${requestId}`
                }]);

                fetchRequests();
            }
        }
    }

    // Moved Helper Function OUTSIDE map or top of component
    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return <span className="font-bold text-green-600">Completed</span>;
            case 'accepted': return <span className="font-bold text-indigo-600">Ongoing</span>;
            case 'pending': return <span className="font-bold text-yellow-600">Pending</span>;
            case 'declined': return <span className="font-bold text-red-600">Declined</span>;
            default: return <span className="font-bold text-gray-600">{status}</span>;
        }
    };

    if (loading) return <div>Loading requests...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Incoming Requests */}
            {/* Incoming Requests */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Incoming Requests (To Teach)</h3>
                {incoming.length === 0 ? <p className="text-gray-500">No requests yet.</p> : (
                    <ul className="divide-y divide-gray-200">
                        {incoming.map(req => (
                            <li key={req.id} className="py-4">
                                <p className="text-sm font-medium text-indigo-600">{req.skills.title}</p>
                                <p className="text-sm text-gray-500">Learner: <Link to={`/profile/${req.learner_id}`} className="text-indigo-600 hover:underline">{req.profiles.full_name}</Link></p>
                                <p className="text-xs text-gray-400 mb-2">Status: {getStatusBadge(req.status)}</p>

                                {req.status === 'pending' && (
                                    <div className="flex space-x-2">
                                        <button onClick={() => updateStatus(req.id, 'accepted', req)} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Accept</button>
                                        <button onClick={() => updateStatus(req.id, 'declined', req)} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Decline</button>
                                    </div>
                                )}
                                {req.status === 'accepted' && (
                                    <div className="flex space-x-2 mt-2">
                                        <button onClick={() => updateStatus(req.id, 'completed', req)} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">Mark Completed</button>
                                        <Link to={`/session/${req.id}?mode=chat`} className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded flex items-center border hover:bg-gray-200">
                                            Chat Only
                                        </Link>
                                        <Link to={`/session/${req.id}?mode=video`} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center hover:bg-green-200">
                                            Video Class
                                        </Link>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Outgoing Requests */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">My Bookings (To Learn)</h3>
                {outgoing.length === 0 ? <p className="text-gray-500">No bookings made.</p> : (
                    <ul className="divide-y divide-gray-200">
                        {outgoing.map(req => (
                            <li key={req.id} className="py-4">
                                <p className="text-sm font-medium text-indigo-600">{req.skills.title}</p>
                                <p className="text-sm text-gray-500">Teacher: <Link to={`/profile/${req.provider_id}`} className="text-indigo-600 hover:underline">{req.profiles.full_name}</Link></p>
                                <p className="text-xs text-gray-400">Status: {getStatusBadge(req.status)}</p>
                                {req.status === 'accepted' && (
                                    <div className="flex space-x-2 mt-2">
                                        <Link to={`/session/${req.id}?mode=chat`} className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded flex items-center border hover:bg-gray-200">
                                            Chat Only
                                        </Link>
                                        <Link to={`/session/${req.id}?mode=video`} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center hover:bg-green-200">
                                            Video Class
                                        </Link>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
