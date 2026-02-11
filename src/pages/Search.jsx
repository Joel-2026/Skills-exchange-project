
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import SkillCard from '../components/SkillCard';
import { Search as SearchIcon, Filter } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Spinner from '../components/Spinner';

export default function Search() {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();

    // Filters State
    const [searchTerm, setSearchTerm] = useState(searchParams.get('category') || '');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterMode, setFilterMode] = useState('all');
    const [filterProficiency, setFilterProficiency] = useState('all');
    const [filterGroupSessions, setFilterGroupSessions] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [groupSessions, setGroupSessions] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    const navigate = useNavigate();

    const CATEGORIES = [
        'All', 'Technology', 'Music', 'Language', 'Lifestyle', 'Business', 'Academics',
        'Design', 'Marketing', 'Health & Fitness', 'Cooking', 'Art', 'Finance',
        'Personal Development', 'DIY & Crafts'
    ];

    useEffect(() => {
        fetchSkills();
        fetchGroupSessions();
    }, []);

    async function fetchSkills() {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        let query = supabase
            .from('skills')
            .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
            .order('created_at', { ascending: false });

        if (user) {
            query = query.neq('provider_id', user.id);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching skills:', error);
        } else {
            // Fetch ratings for these providers
            if (data && data.length > 0) {
                const providerIds = [...new Set(data.map(s => s.provider_id))];
                const { data: reviews } = await supabase
                    .from('reviews')
                    .select('target_id, rating')
                    .in('target_id', providerIds);

                const ratingsMap = {};
                if (reviews) {
                    reviews.forEach(r => {
                        if (!ratingsMap[r.target_id]) {
                            ratingsMap[r.target_id] = { total: 0, count: 0 };
                        }
                        ratingsMap[r.target_id].total += r.rating;
                        ratingsMap[r.target_id].count += 1;
                    });
                }

                const skillsWithRatings = data.map(skill => {
                    const ratingData = ratingsMap[skill.provider_id];
                    return {
                        ...skill,
                        averageRating: ratingData ? ratingData.total / ratingData.count : 0,
                        reviewCount: ratingData ? ratingData.count : 0
                    };
                });
                setSkills(skillsWithRatings);
            } else {
                setSkills([]);
            }
        }
        setLoading(false);
    }

    async function fetchGroupSessions() {
        const { data } = await supabase
            .from('group_sessions')
            .select('skill_id, requests(id), skills(max_students)')
            .eq('status', 'scheduled');
        setGroupSessions(data || []);
    }

    const filteredSkills = skills.filter(skill => {
        // Search Term Logic
        const matchesSearch =
            skill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            skill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            skill.category?.toLowerCase().includes(searchTerm.toLowerCase());

        // Mode Logic
        const matchesMode = filterMode === 'all' || skill.mode === filterMode;

        // Category Logic
        const matchesCategory = filterCategory === 'All' || skill.category === filterCategory;

        // Proficiency Logic
        const matchesProficiency = filterProficiency === 'all' || skill.proficiency === filterProficiency;

        // Group Sessions Logic
        const hasGroupSession = groupSessions.some(gs => {
            const currentParticipants = gs.requests?.length || 0;
            const maxStudents = gs.skills?.max_students || 1;
            return gs.skill_id === skill.id && currentParticipants < maxStudents;
        });
        const matchesGroupSessions = !filterGroupSessions || hasGroupSession;

        return matchesSearch && matchesMode && matchesCategory && matchesProficiency && matchesGroupSessions;
    }).sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
        if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        return 0;
    });

    const handleBook = async (skill) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Please login to book a session');
            return;
        }
        if (user.id === skill.provider_id) {
            alert("You can't book your own skill!");
            return;
        }

        const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
        if (profile.credits < 1) {
            alert("You don't have enough credits!");
            return;
        }

        if (confirm(`Request a session for "${skill.title}"? This will cost 1 credit upon completion.`)) {
            const { error } = await supabase.from('requests').insert([
                {
                    skill_id: skill.id,
                    learner_id: user.id,
                    provider_id: skill.provider_id,
                    status: 'pending'
                }
            ]);

            if (error) {
                alert('Error booking session: ' + error.message);
            } else {
                // Notify Provider
                await supabase.from('notifications').insert([{
                    user_id: skill.provider_id,
                    type: 'request_received',
                    message: `New request: ${user.email} wants to learn "${skill.title}"`,
                    link: '/dashboard'
                }]);

                alert('Request sent! Check your dashboard.');
            }
        }
    }

    const clearFilters = () => {
        setSearchTerm('');
        setFilterCategory('All');
        setFilterMode('all');
        setFilterProficiency('all');
        setFilterGroupSessions(false);
        setSortBy('newest');
    }

    return (
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col gap-6">

                {/* Filter Toggle Button */}
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => setShowFilters(true)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        <Filter className="w-5 h-5 mr-2 text-indigo-500" />
                        Filters
                    </button>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {filteredSkills.length} Result{filteredSkills.length !== 1 && 's'} Found
                    </h2>
                </div>

                {/* Filter Sidebar Drawer */}
                {/* Backdrop */}
                {
                    showFilters && (
                        <div
                            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                            onClick={() => setShowFilters(false)}
                        ></div>
                    )
                }

                {/* Sidebar */}
                <div className={`fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${showFilters ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto`}>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                                <Filter className="w-5 h-5 mr-2 text-indigo-500" />
                                Filters
                            </h3>
                            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                                <span className="sr-only">Close filters</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {(searchTerm || filterCategory !== 'All' || filterMode !== 'all' || filterProficiency !== 'all' || filterGroupSessions) && (
                                <button
                                    onClick={() => { clearFilters(); setShowFilters(false); }}
                                    className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800 rounded-md py-2"
                                >
                                    Reset All Filters
                                </button>
                            )}

                            {/* Search Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <SearchIcon className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-9 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-2 border"
                                        placeholder="Search skills..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Proficiency Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Proficiency</label>
                                <select
                                    value={filterProficiency}
                                    onChange={(e) => setFilterProficiency(e.target.value)}
                                    className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                    <option value="all">Any Level</option>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>

                            {/* Mode Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mode</label>
                                <select
                                    value={filterMode}
                                    onChange={(e) => setFilterMode(e.target.value)}
                                    className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                    <option value="all">Any Location</option>
                                    <option value="online">Online</option>
                                    <option value="offline">In-Person</option>
                                </select>
                            </div>

                            {/* Sort By */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort By</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <main className="flex-1">

                    {loading ? (
                        <Spinner size="lg" />
                    ) : filteredSkills.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                            <SearchIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No skills found</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filters.</p>
                            <button onClick={clearFilters} className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-indigo-700 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800">
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredSkills.map((skill) => (
                                <SkillCard
                                    key={skill.id}
                                    skill={skill}
                                    onBook={handleBook}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div >
        </div >
    );
}
