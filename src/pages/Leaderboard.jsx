
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Award, Star, Trophy, Medal } from 'lucide-react';
import Spinner from '../components/Spinner';

export default function Leaderboard() {
    const [activeTab, setActiveTab] = useState('teachers'); // 'teachers', 'earners', 'referrers'
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        calculateLeaderboard();
    }, [activeTab]);

    async function calculateLeaderboard() {
        setLeaders([]);
        setLoading(true);
        try {
            let leaderboardData = [];

            if (activeTab === 'teachers') {
                // 1. Top Teachers (Sessions Taught)
                const { data: requests, error } = await supabase
                    .from('requests')
                    .select('provider_id')
                    .eq('status', 'completed');

                if (error) throw error;

                const counts = {};
                requests.forEach(r => counts[r.provider_id] = (counts[r.provider_id] || 0) + 1);
                const providerIds = Object.keys(counts);

                if (providerIds.length > 0) {
                    const { data: profiles, error: profileError } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, bio')
                        .in('id', providerIds);

                    if (profileError) throw profileError;

                    leaderboardData = profiles.map(profile => ({
                        ...profile,
                        score: counts[profile.id] || 0,
                        metric: 'Sessions'
                    }));
                }
            }
            else if (activeTab === 'earners') {
                // 2. Top Earners (Total Credits)
                const { data: profiles, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, bio, credits')
                    .order('credits', { ascending: false })
                    .limit(20);

                if (error) throw error;

                leaderboardData = profiles.map(profile => ({
                    ...profile,
                    score: profile.credits || 0,
                    metric: 'Credits'
                }));
            }
            else if (activeTab === 'referrers') {
                // 3. Top Referrers (Most Invites)
                const { data: referrals, error } = await supabase
                    .from('referrals')
                    .select('referrer_id');

                if (error) throw error;

                const counts = {};
                referrals.forEach(r => counts[r.referrer_id] = (counts[r.referrer_id] || 0) + 1);
                const referrerIds = Object.keys(counts);

                if (referrerIds.length > 0) {
                    const { data: profiles, error: profileError } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, bio')
                        .in('id', referrerIds);

                    if (profileError) throw profileError;

                    leaderboardData = profiles.map(profile => ({
                        ...profile,
                        score: counts[profile.id] || 0,
                        metric: 'Invites'
                    }));
                }
            }

            // Sort by score descending
            leaderboardData.sort((a, b) => b.score - a.score);
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
                    Recognizing our top {activeTab === 'teachers' ? 'providers' : activeTab === 'earners' ? 'earners' : 'influencers'}.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center space-x-4 mb-8">
                <button
                    onClick={() => setActiveTab('teachers')}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${activeTab === 'teachers'
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    Top Teachers
                </button>
                <button
                    onClick={() => setActiveTab('earners')}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${activeTab === 'earners'
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    Top Earners
                </button>
                <button
                    onClick={() => setActiveTab('referrers')}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${activeTab === 'referrers'
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    Top Referrers
                </button>
            </div>

            {loading ? (
                <Spinner size="lg" />
            ) : leaders.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No data found for this category yet. Be the first!</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md transition-colors border border-gray-100 dark:border-gray-700">
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
                                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${activeTab === 'teachers' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                    activeTab === 'earners' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                }`}>
                                                {leader.score} {leader.metric}
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
