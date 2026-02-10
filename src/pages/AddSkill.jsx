
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { BookOpen } from 'lucide-react';

export default function AddSkill() {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [proficiency, setProficiency] = useState('Beginner');
    const [mode, setMode] = useState('online');
    const [location, setLocation] = useState('');
    const [maxStudents, setMaxStudents] = useState(1);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in to add a skill.');

            const { error } = await supabase.from('skills').insert([
                {
                    provider_id: user.id,
                    title,
                    category,
                    description,
                    mode,
                    location: mode === 'offline' ? location : null,
                    proficiency,
                    max_students: maxStudents
                }
            ]);

            if (error) throw error;

            alert('Skill listed successfully!');
            navigate('/profile'); // Redirect to profile to see the listing
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
                        List a New Skill
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Share your knowledge and earn credits.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg transition-colors">
                <div className="px-4 py-5 sm:p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Skill Title
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="title"
                                    id="title"
                                    required
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 border"
                                    placeholder="e.g. Advanced Guitar Techniques"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Category
                            </label>
                            <div className="mt-1">
                                <select
                                    id="category"
                                    name="category"
                                    required
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 border"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    <option value="">Select a category</option>
                                    <option value="Technology">Technology</option>
                                    <option value="Music">Music</option>
                                    <option value="Language">Language</option>
                                    <option value="Lifestyle">Lifestyle</option>
                                    <option value="Business">Business</option>
                                    <option value="Academics">Academics</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Description
                            </label>
                            <div className="mt-1">
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    required
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 border"
                                    placeholder="Describe what you will teach..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Proficiency */}
                        <div>
                            <label htmlFor="proficiency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Proficiency Level
                            </label>
                            <div className="mt-1">
                                <select
                                    id="proficiency"
                                    name="proficiency"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 border"
                                    value={proficiency}
                                    onChange={(e) => setProficiency(e.target.value)}
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                        </div>

                        {/* Mode */}
                        <div>
                            <label htmlFor="mode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Session Mode
                            </label>
                            <div className="mt-1">
                                <select
                                    id="mode"
                                    name="mode"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 border"
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value)}
                                >
                                    <option value="online">Online</option>
                                    <option value="offline">In-Person</option>
                                    <option value="any">Any</option>
                                </select>
                            </div>
                        </div>

                        {/* Location (Conditional) */}
                        {mode === 'offline' && (
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Meetup Location
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="location"
                                        id="location"
                                        required
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 border"
                                        placeholder="e.g. City Library, Main Street Coffee Shop"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Where will you meet the learner?
                                </p>
                            </div>
                        )}



                        <div className="pt-5">
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                                >
                                    {loading ? 'Publishing...' : 'Publish Skill'}
                                </button>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
