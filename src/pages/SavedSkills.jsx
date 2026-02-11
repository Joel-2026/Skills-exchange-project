import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import SkillCard from '../components/SkillCard';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SavedSkills() {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSavedSkills();
    }, []);

    async function fetchSavedSkills() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setLoading(false);
            return;
        }

        // Fetch saved skills with the skill details and profile
        const { data, error } = await supabase
            .from('saved_skills')
            .select(`
                skill_id,
                skills (*, profiles(*))
            `)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching saved skills:', error);
        } else {
            // Flatten the structure to match what SkillCard expects
            const formattedSkills = data.map(item => ({
                ...item.skills,
                // We might need to fetch ratings here if we want them, 
                // but for now let's just show basic info.
                // Or we can reuse the logic from Search.jsx if needed.
            }));
            setSkills(formattedSkills);
        }
        setLoading(false);
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center mb-6">
                <Heart className="w-8 h-8 text-red-500 mr-3 fill-current" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Skills</h1>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : skills.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700">
                    <Heart className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No saved skills</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Browse skills and click the heart icon to save them for later.
                    </p>
                    <div className="mt-6">
                        <Link to="/search" className="btn-primary px-4 py-2 rounded-md text-white">
                            Explore Skills
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {skills.map(skill => (
                        <SkillCard key={skill.id} skill={skill} />
                    ))}
                </div>
            )}
        </div>
    );
}
