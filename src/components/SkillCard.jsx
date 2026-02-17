import { supabase } from '../lib/supabaseClient';
import { Clock, MapPin, Monitor, User, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import { useState, useEffect, memo } from 'react';

function SkillCard({ skill, showProvider = true, onBook }) {
    const isOnline = skill.mode === 'online';
    const [isSaved, setIsSaved] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        checkUserAndSavedStatus();
    }, [skill.id]);

    async function checkUserAndSavedStatus() {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
            const { data } = await supabase
                .from('saved_skills')
                .select('id')
                .eq('user_id', user.id)
                .eq('skill_id', skill.id)
                .single();
            setIsSaved(!!data);
        }
    }

    async function toggleSave(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!user) return alert('Please login to save skills.');

        if (isSaved) {
            const { error } = await supabase
                .from('saved_skills')
                .delete()
                .eq('user_id', user.id)
                .eq('skill_id', skill.id);
            if (!error) setIsSaved(false);
        } else {
            const { error } = await supabase
                .from('saved_skills')
                .insert([{ user_id: user.id, skill_id: skill.id }]);
            if (!error) setIsSaved(true);
        }
    }

    return (

        <div className="card-glass overflow-hidden rounded-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative group animate-fade-in">
            <div className="absolute top-3 right-3 z-10">
                <button
                    onClick={toggleSave}
                    className={`p-2 rounded-full backdrop-blur-md shadow-lg transition-all duration-300 transform hover:scale-110 ${isSaved ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' : 'bg-white/90 dark:bg-gray-800/90 text-gray-400 hover:text-red-500'}`}
                >
                    <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
            </div>

            <div className="p-6">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md">
                        {skill.category || 'General'}
                    </span>
                    {skill.proficiency && (
                        <span className="badge-gradient">
                            {skill.proficiency}
                        </span>
                    )}
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md flex items-center gap-1">
                        {skill.mode === 'online' ? (
                            <>
                                <Monitor className="w-3 h-3" />
                                {skill.mode}
                            </>
                        ) : (
                            <>
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[100px]" title={skill.location || 'In-Person'}>
                                    {skill.location || 'In-Person'}
                                </span>
                            </>
                        )}
                    </span>
                </div>

                <div className="mt-4">
                    <Link to={`/skill/${skill.id}`} className="block group">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate group-hover:text-gradient-primary transition-all duration-300 text-shadow" title={skill.title}>
                            {skill.title}
                        </h3>
                    </Link>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2" title={skill.description}>
                        {skill.description}
                    </p>
                </div>

                {showProvider && skill.profiles && (
                    <div className="mt-5 flex items-center">
                        <div className="flex-shrink-0">
                            <Link to={`/profile/${skill.profiles.id}`}>
                                {skill.profiles.avatar_url ? (
                                    <img className="h-10 w-10 rounded-full ring-2 ring-orange-500/50 transition-all hover:ring-4" src={skill.profiles.avatar_url} alt="" />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center ring-2 ring-orange-500/50">
                                        <User className="h-5 w-5 text-white" />
                                    </div>
                                )}
                            </Link>
                        </div>
                        <div className="ml-3">
                            <Link to={`/profile/${skill.profiles.id}`} className="hover:text-gradient-primary transition-all duration-300">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{skill.profiles.full_name || 'Anonymous'}</p>
                            </Link>
                            {skill.averageRating > 0 && (
                                <div className="flex items-center mt-0.5">
                                    <StarRating rating={skill.averageRating} readOnly={true} size={12} />
                                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({skill.reviewCount})</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 px-6 py-4 flex gap-3">
                <Link
                    to={`/skill/${skill.id}`}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-sm font-semibold rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-300 transform hover:scale-105"
                >
                    View
                </Link>
                {onBook ? (
                    <button
                        onClick={() => onBook(skill)}
                        className="flex-1 inline-flex justify-center items-center px-4 py-2.5 text-sm font-semibold rounded-lg shadow-md btn-primary"
                    >
                        Request
                    </button>
                ) : (
                    <div className="flex-1 text-sm text-gray-400 italic text-center flex items-center justify-center">Managed</div>
                )}
            </div>
        </div>
    );
}

export default memo(SkillCard);


