
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const GENRES = ['Technology', 'Music', 'Language', 'Lifestyle', 'Business', 'Academics', 'Other'];

export default function Onboarding() {
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const toggleGenre = (genre) => {
        if (selected.includes(genre)) {
            setSelected(selected.filter(g => g !== genre));
        } else {
            setSelected([...selected, genre]);
        }
    };

    const handleContinue = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase
                    .from('profiles')
                    .update({ interests: selected, onboarding_completed: true })
                    .eq('id', user.id);

                if (error) throw error;
            }
            navigate('/dashboard');
        } catch (error) {
            console.error('Error saving interests:', error);
            alert('Failed to save interests. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('profiles')
                    .update({ onboarding_completed: true })
                    .eq('id', user.id);
            }
            navigate('/dashboard');
        } catch (error) {
            console.error('Error skipping:', error);
            // Even if error, try to navigate?
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                    What are you interested in?
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    Select a few topics to help us recommend skills.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 transition-colors">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {GENRES.map((genre) => (
                            <button
                                key={genre}
                                onClick={() => toggleGenre(genre)}
                                className={`px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${selected.includes(genre)
                                    ? 'bg-gradient-primary border-transparent text-white'
                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleContinue}
                            disabled={loading || selected.length === 0}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Continue'}
                        </button>

                        <button
                            onClick={handleSkip}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 bg-transparent hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
                        >
                            Skip for now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
