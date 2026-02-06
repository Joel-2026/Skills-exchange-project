
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import SkillCard from '../components/SkillCard';
import { Search as SearchIcon, Filter } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Search() {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();

    // Filters State
    const [searchTerm, setSearchTerm] = useState(searchParams.get('category') || '');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterMode, setFilterMode] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    const navigate = useNavigate();

    const CATEGORIES = ['All', 'Technology', 'Music', 'Language', 'Lifestyle', 'Business', 'Academics'];

    useEffect(() => {
        fetchSkills();
    }, []);

    async function fetchSkills() {
        setLoading(true);
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

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching skills:', error);
        } else {
            setSkills(data);
        }
        setLoading(false);
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

        return matchesSearch && matchesMode && matchesCategory;
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
        setSortBy('newest');
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row gap-8">

                {/* Sidebar Filters */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-100 dark:border-gray-700 sticky top-4 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                <Filter className="w-5 h-5 mr-2 text-indigo-500" />
                                Filters
                            </h3>
                            {(searchTerm || filterCategory !== 'All' || filterMode !== 'all') && (
                                <button onClick={clearFilters} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
                                    Reset
                                </button>
                            )}
                        </div>

                        {/* Search Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <SearchIcon className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-9 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-2 border"
                                    placeholder="Keywords..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                            <div className="space-y-2">
                                {CATEGORIES.map(cat => (
                                    <div key={cat} className="flex items-center">
                                        <input
                                            id={`cat-${cat}`}
                                            name="category"
                                            type="radio"
                                            checked={filterCategory === cat}
                                            onChange={() => setFilterCategory(cat)}
                                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                        />
                                        <label htmlFor={`cat-${cat}`} className="ml-3 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                            {cat}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mode Filter */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mode</label>
                            <select
                                value={filterMode}
                                onChange={(e) => setFilterMode(e.target.value)}
                                className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="all">Any Location</option>
                                <option value="online">Online</option>
                                <option value="offline">In-Person</option>
                            </select>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    <div className="sm:flex sm:items-center sm:justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {filteredSkills.length} Result{filteredSkills.length !== 1 && 's'} Found
                        </h2>
                        <div className="flex items-center mt-4 sm:mt-0">
                            <label className="mr-2 text-sm text-gray-500 dark:text-gray-400">Sort by:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 dark:text-gray-300">Loading skills...</div>
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
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            </div>
        </div>
    );
}
