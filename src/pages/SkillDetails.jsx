
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MapPin, Monitor, Clock, User, CheckCircle, ArrowLeft } from 'lucide-react';
import Spinner from '../components/Spinner';
import StarRating from '../components/StarRating';

export default function SkillDetails() {
    const { skillId } = useParams();
    const navigate = useNavigate();
    const [skill, setSkill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [averageRating, setAverageRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            const { data, error } = await supabase
                .from('skills')
                .select(`
                    *,
                    profiles (
                        id,
                        full_name,
                        avatar_url,
                        credits
                    )
                `)
                .eq('id', skillId)
                .single();

            if (error) {
                console.error('Error fetching skill:', error);
            } else {
                setSkill(data);

                // Fetch reviews for provider
                const { data: reviews } = await supabase
                    .from('reviews')
                    .select('rating')
                    .eq('target_id', data.provider_id);

                if (reviews && reviews.length > 0) {
                    const total = reviews.reduce((acc, r) => acc + r.rating, 0);
                    setAverageRating(total / reviews.length);
                    setReviewCount(reviews.length);
                }
            }
            setLoading(false);
        };

        fetchData();
    }, [skillId]);

    const handleBook = async () => {
        if (!user) {
            navigate('/login');
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
                navigate('/dashboard');
            }
        }
    };

    if (loading) return <Spinner size="lg" />;
    if (!skill) return <div className="text-center py-10">Skill not found</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
            </button>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="p-8">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                    {skill.category}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                    ${skill.proficiency === 'Advanced' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                        skill.proficiency === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                                    {skill.proficiency}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{skill.title}</h1>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg">
                            {skill.mode === 'online' ? (
                                <>
                                    <Monitor className="w-5 h-5 text-gray-400 mr-2" />
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">Online</span>
                                </>
                            ) : (
                                <>
                                    <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                                    <div className="flex flex-col">
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">In-Person</span>
                                        {skill.location && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{skill.location}</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 prose dark:prose-invert max-w-none">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">About this Class</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{skill.description}</p>
                    </div>

                    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">About the Instructor</h3>
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Link to={`/profile/${skill.profiles?.id}`}>
                                    {skill.profiles?.avatar_url ? (
                                        <img className="h-12 w-12 rounded-full" src={skill.profiles.avatar_url} alt="" />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                                        </div>
                                    )}
                                </Link>
                            </div>
                            <div className="ml-4">
                                <Link to={`/profile/${skill.profiles?.id}`} className="text-lg font-medium text-gray-900 dark:text-white hover:underline">
                                    {skill.profiles?.full_name || 'Anonymous'}
                                </Link>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Instructor
                                </p>
                                <div className="flex items-center mt-1">
                                    <StarRating rating={averageRating} readOnly={true} size={16} />
                                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                        ({averageRating.toFixed(1)}) • {reviewCount} reviews
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        {user && user.id !== skill.provider_id ? (
                            <button
                                onClick={handleBook}
                                className="w-full md:w-auto flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Request Session (1 Credit)
                            </button>
                        ) : user && user.id === skill.provider_id ? (
                            <div className="text-gray-500 italic">This is your skill.</div>
                        ) : (
                            <Link to="/login" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                Login to Request
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
