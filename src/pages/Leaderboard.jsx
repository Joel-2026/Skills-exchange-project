
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Award, Star, Trophy, Medal } from 'lucide-react';
import Spinner from '../components/Spinner';

export default function Leaderboard() {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        calculateLeaderboard();
    }, []);

    async function calculateLeaderboard() {
        setLoading(true);
        try {
            // Fetch all completed requests to calculate "Sessions Taught"
            const { data: requests, error } = await supabase
                .from('requests')
                .select('provider_id')
                .eq('status', 'completed');

            if (error) throw error;

            // Tally up counts per provider
            const counts = {};
            requests.forEach(r => {
                counts[r.provider_id] = (counts[r.provider_id] || 0) + 1;
            });

            // Get IDs of providers with at least 1 session
            const provedierIds = Object.keys(counts);

            if (provedierIds.length === 0) {
                setLeaders([]);
                setLoading(false);
                return;
            }

            // Fetch profile details for these providers
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, bio')
                .in('id', provedierIds);

            if (profileError) throw profileError;

            // Merge counts and sort
            const leaderboardData = profiles.map(profile => ({
                ...profile,
                sessionsTaught: counts[profile.id] || 0
            })).sort((a, b) => b.sessionsTaught - a.sessionsTaught); // Descending

            setLeaders(leaderboardData);

        } catch (err) {
            console.error("Error calculating leaderboard:", err);
        } finally {
            setLoading(false);
        }
    }

    const getRankIcon = (index) => {
        if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
        if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
        if (index === 2) return <Medal className="w-6 h-6 text-orange-400" />;
        return <span className="text-gray-500 font-bold ml-2">#{index + 1}</span>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl text-gradient-primary inline-block">
                    Community Leaderboard
                </h2>
                <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                    Recognizing our top teachers and contributors.
                </p>
            </div>

            {loading ? (
                <Spinner size="lg" />
            ) : leaders.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <p className="text-gray-500 dark:text-gray-400">No completed sessions yet. Be the first!</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md transition-colors">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {leaders.map((leader, index) => (
                            <li key={leader.id}>
                                <div className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 px-4 py-4 sm:px-6 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center truncate">
                                            <div className="flex-shrink-0 mr-4 w-8 text-center flex justify-center">
                                                {getRankIcon(index)}
                                            </div>
                                            <Link to={`/profile/${leader.id}`}>
                                                <img
                                                    className="h-12 w-12 rounded-full object-cover border-2 border-indigo-100 dark:border-gray-600"
                                                    src={leader.avatar_url || `https://ui-avatars.com/api/?name=${leader.full_name}&background=random`}
                                                    alt={leader.full_name}
                                                />
                                            </Link>
                                            <div className="ml-4 truncate">
                                                <Link to={`/profile/${leader.id}`} className="text-lg font-medium text-indigo-600 dark:text-indigo-400 hover:underline truncate">
                                                    {leader.full_name}
                                                </Link>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{leader.bio || 'Community Member'}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-semibold">
                                                {leader.sessionsTaught} Sessions
                                            </div>
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
