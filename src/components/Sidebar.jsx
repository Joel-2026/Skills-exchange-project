
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { LayoutDashboard, Search, BookOpen, History as HistoryIcon, User, PlusCircle, LogOut, Calendar as CalendarIcon, Heart, MessageSquare, Trophy } from 'lucide-react';

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const fetchUserAndProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(data);
            }
        };

        fetchUserAndProfile();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()
                    .then(({ data }) => setProfile(data));
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const isActive = (path) => location.pathname === path;

    if (!user) return null;

    return (
        <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-gradient-sidebar dark:from-gray-800 dark:to-gray-900 pt-5 pb-4 overflow-y-auto transition-colors">
            <div className="flex flex-col items-center flex-shrink-0 px-4 mb-5">
                {/* Profile Circle */}
                <Link to="/profile" className="flex flex-col items-center group">
                    <div className="h-20 w-20 rounded-full border-4 border-white/20 dark:border-gray-600 overflow-hidden mb-3 group-hover:border-white dark:group-hover:border-gray-400 transition-colors">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full bg-white/20 dark:bg-gray-700 flex items-center justify-center text-white text-2xl font-bold">
                                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                        )}
                    </div>
                    <span className="text-white font-medium text-lg group-hover:text-yellow-100 dark:group-hover:text-gray-300 transition-colors">
                        {profile?.full_name || 'User'}
                    </span>
                    <span className="text-white/80 text-xs">
                        Credits: {profile?.credits || 0}
                    </span>
                </Link>
            </div>
            <div className="mt-5 flex-1 flex flex-col">
                <nav className="flex-1 px-2 space-y-1">
                    <Link
                        to="/dashboard"
                        className={`${isActive('/dashboard') ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'} group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 hover:scale-105 hover:translate-x-1`}
                    >
                        <LayoutDashboard className="mr-3 flex-shrink-0 h-6 w-6 transition-all duration-200 group-hover:scale-110 group-hover:drop-shadow-lg" aria-hidden="true" />
                        Dashboard
                    </Link>

                    <Link
                        to="/search"
                        className={`${isActive('/search') ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'} group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 hover:scale-105 hover:translate-x-1`}
                    >
                        <Search className="mr-3 flex-shrink-0 h-6 w-6 transition-all duration-200 group-hover:scale-125 group-hover:rotate-12" aria-hidden="true" />
                        Explore Skills
                    </Link>

                    <Link
                        to="/add-skill"
                        className={`${isActive('/add-skill') ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'} group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 hover:scale-105 hover:translate-x-1`}
                    >
                        <PlusCircle className="mr-3 flex-shrink-0 h-6 w-6 transition-all duration-300 group-hover:rotate-180 group-hover:scale-110" aria-hidden="true" />
                        List Skill
                    </Link>

                    <Link
                        to="/calendar"
                        className={`${isActive('/calendar') ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'} group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 hover:scale-105 hover:translate-x-1`}
                    >
                        <CalendarIcon className="mr-3 flex-shrink-0 h-6 w-6 transition-all duration-200 group-hover:scale-110 group-hover:-translate-y-1" aria-hidden="true" />
                        Calendar
                    </Link>



                    <Link
                        to="/leaderboard"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/leaderboard', { state: { refresh: Date.now() } });
                        }}
                        className={`${isActive('/leaderboard') ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'} group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 hover:scale-105 hover:translate-x-1`}
                    >
                        <Trophy className="mr-3 flex-shrink-0 h-6 w-6 transition-all duration-300 group-hover:-rotate-[20deg] group-hover:scale-125 group-hover:-translate-y-1" aria-hidden="true" />
                        Leaderboard
                    </Link>



                    <Link
                        to="/saved-skills"
                        className={`${isActive('/saved-skills') ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'} group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 hover:scale-105 hover:translate-x-1`}
                    >
                        <Heart className="mr-3 flex-shrink-0 h-6 w-6 transition-all duration-200 group-hover:scale-125 group-hover:fill-current" aria-hidden="true" />
                        Saved Skills
                    </Link>

                    <Link
                        to="/history"
                        className={`${isActive('/history') ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'} group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 hover:scale-105 hover:translate-x-1`}
                    >
                        <HistoryIcon className="mr-3 flex-shrink-0 h-6 w-6 transition-all duration-300 group-hover:rotate-[360deg] group-hover:scale-110" aria-hidden="true" />
                        History
                    </Link>

                    <Link
                        to="/forum"
                        className={`${isActive('/forum') ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'} group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 hover:scale-105 hover:translate-x-1`}
                    >
                        <MessageSquare className="mr-3 flex-shrink-0 h-6 w-6 transition-all duration-200 group-hover:scale-110 group-hover:-rotate-12" aria-hidden="true" />
                        Community Forum
                    </Link>

                    <Link
                        to="/settings"
                        className={`${isActive('/settings') ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'} group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 hover:scale-105 hover:translate-x-1`}
                    >
                        <User className="mr-3 flex-shrink-0 h-6 w-6 transition-all duration-300 group-hover:rotate-[360deg] group-hover:scale-110" aria-hidden="true" />
                        Settings
                    </Link>
                </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-white/10 p-4">
                <button
                    onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}
                    className="flex-shrink-0 w-full group block transition-all duration-300 hover:scale-105"
                >
                    <div className="flex items-center">
                        <LogOut className="inline-block h-5 w-5 text-white/70 group-hover:text-white transition-all duration-300 group-hover:-translate-x-1" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-white/70 group-hover:text-white transition-colors duration-300">Sign Out</p>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}
