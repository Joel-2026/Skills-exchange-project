
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Video, MessageSquare, CheckCircle, MapPin } from 'lucide-react';


export default function Ongoing() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOngoing();
    }, []);

    async function fetchOngoing() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch requests where I am either learner or provider AND status is 'accepted'
        const { data, error } = await supabase
            .from('requests')
            .select(`
                *,
                skills (title, description, mode, location),
                provider:profiles!public_requests_provider_id_fkey (full_name, avatar_url, credits),
                learner:profiles!public_requests_learner_id_fkey (full_name, avatar_url, credits)
            `)
            .eq('status', 'accepted')
            .or(`provider_id.eq.${user.id},learner_id.eq.${user.id}`);

        if (data) {
            const mapped = data.map(session => {
                const isProvider = session.provider_id === user.id;
                const partner = isProvider ? session.learner : session.provider;
                const role = isProvider ? 'Teaching' : 'Learning';
                return { ...session, partner, role, isProvider };
            });
            setSessions(mapped);
        }
        setLoading(false);
    }

    async function markCompleted(session) {
        if (!confirm('Are you sure you want to mark this session as completed? Credits will be transferred.')) return;

        // Transaction Logic (Simplified)
        // 1. Update Request Status
        await supabase.from('requests').update({ status: 'completed' }).eq('id', session.id);

        // 2. Transact Credits
        // We need accurate credit counts, so we fetched them in the select query.
        // However, for atomicity in a real app, use RPC. Here we read->write.

        const learnerId = session.learner_id;
        const providerId = session.provider_id;

        // Refetch to be safe or use what we have? Let's refetch profiles to be safe.
        const { data: learner } = await supabase.from('profiles').select('credits').eq('id', learnerId).single();
        const { data: provider } = await supabase.from('profiles').select('credits').eq('id', providerId).single();

        await supabase.from('profiles').update({ credits: learner.credits - 1 }).eq('id', learnerId);
        await supabase.from('profiles').update({ credits: provider.credits + 1 }).eq('id', providerId);

        alert('Session Completed! Credits transferred.');
        fetchOngoing(); // Refresh list (item should disappear)
    }

    // DEBUG: Create a test session to verify UI
    async function createTestSession() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get a random skill (or create one if none)
        let { data: skills } = await supabase.from('skills').select('id').limit(1);
        let skillId;

        if (!skills || skills.length === 0) {
            // Needed if DB is empty
            const { data: newSkill } = await supabase.from('skills').insert({
                provider_id: user.id,
                title: 'Debug Skill',
                category: 'Debug',
                mode: 'online',
                description: 'Generated for testing.'
            }).select().single();
            skillId = newSkill.id;
        } else {
            skillId = skills[0].id;
        }

        const { error } = await supabase.from('requests').insert({
            learner_id: user.id,
            provider_id: user.id, // Self-session
            skill_id: skillId,
            status: 'accepted'
        });

        if (error) {
            alert('Debug Create Failed: ' + error.message);
        } else {
            alert('Test Session Created! Refreshing...');
            fetchOngoing();
        }
    }

    if (loading) return <Spinner size="lg" />;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Ongoing Classes</h1>

            {sessions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500">No active sessions at the moment.</p>
                    <Link to="/search" className="mt-2 inline-block text-indigo-600 hover:text-indigo-500">
                        Find a skill to learn &rarr;
                    </Link>
                    <div className="mt-4">
                        <button onClick={createTestSession} className="text-xs text-gray-400 hover:text-gray-600 underline">
                            (Debug) Simulate Active Session
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {sessions.map(session => (
                        <div key={session.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 flex flex-col">
                            <div className="p-5 flex-1">
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${session.role === 'Teaching' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                        {session.role}
                                    </span>
                                    <span className="text-xs text-gray-400">{new Date(session.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 truncate" title={session.skills.title}>
                                    {session.skills.title}
                                </h3>
                                {session.skills.mode === 'offline' && session.skills.location && (
                                    <p className="mt-1 text-xs text-gray-500 flex items-center">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {session.skills.location}
                                    </p>
                                )}
                                <div className="mt-4 flex items-center">
                                    <div className="flex-shrink-0">
                                        <Link to={`/profile/${session.partner?.id}`}>
                                            {session.partner?.avatar_url ? (
                                                <img className="h-8 w-8 rounded-full hover:opacity-80 transition-opacity" src={session.partner.avatar_url} alt="" />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-gray-200 hover:opacity-80 transition-opacity" />
                                            )}
                                        </Link>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900">
                                            with <Link to={`/profile/${session.partner?.id}`} className="hover:underline">{session.partner?.full_name}</Link>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex flex-col gap-2">
                                <div className="flex justify-between space-x-2">
                                    <Link
                                        to={`/session/${session.id}?mode=chat`}
                                        className="flex-1 flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Chat
                                    </Link>
                                    <Link
                                        to={`/session/${session.id}?mode=video`}
                                        className="flex-1 flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white btn-primary"
                                    >
                                        <Video className="w-4 h-4 mr-2" />
                                        Class
                                    </Link>
                                </div>

                                {session.role === 'Teaching' && (
                                    <button
                                        onClick={() => markCompleted(session)}
                                        className="w-full flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Mark Completed
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
