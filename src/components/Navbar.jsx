import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Menu, X, Bell, Search, User, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Navbar() {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const isHidden = ['/login', '/onboarding'].includes(location.pathname);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            if (user) {
                fetchNotifications(user.id);
                subscribeToNotifications(user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchNotifications(session.user.id);
                subscribeToNotifications(session.user.id);
            } else {
                setNotifications([]);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const fetchNotifications = async (userId) => {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
    };

    const subscribeToNotifications = (userId) => {
        supabase
            .channel('notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
                payload => {
                    setNotifications(current => [payload.new, ...current]);
                    setUnreadCount(c => c + 1);
                    // Optional: Play sound or show toast here
                })
            .subscribe();
    }

    const markAsRead = async () => {
        if (!user) return;
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length > 0) {
            await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
    }

    const handleLogout = async (e) => {
        if (e) e.preventDefault();
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            navigate('/login');
        }
    };

    if (isHidden) return null;

    return (
        <nav className="bg-white dark:bg-gray-800 shadow sticky top-0 z-50 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-bold text-gradient-primary">SkillExchange</span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
                        >
                            {theme === 'light' ? '🌙' : '☀️'}
                        </button>

                        {user ? (
                            <>
                                <Link to="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                                <Link to="/search" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                                    <Search className="w-4 h-4 mr-1" /> Explore
                                </Link>
                                <Link to="/forum" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                                    Forum
                                </Link>
                                <Link to="/leaderboard" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                                    Leaderboard
                                </Link>

                                {/* Notification Bell */}
                                <div className="relative">
                                    <button
                                        onClick={() => { setShowDropdown(!showDropdown); if (!showDropdown) markAsRead(); }}
                                        className="relative p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                                    >
                                        <Bell className="h-6 w-6" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                                        )}
                                    </button>

                                    {showDropdown && (
                                        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none">
                                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-200">Notifications</div>
                                            <div className="max-h-64 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">No notifications</div>
                                                ) : (
                                                    notifications.map(notif => (
                                                        <Link
                                                            key={notif.id}
                                                            to={notif.link || '#'}
                                                            className={`block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 ${!notif.is_read ? 'bg-indigo-50 dark:bg-indigo-900' : ''}`}
                                                            onClick={() => setShowDropdown(false)}
                                                        >
                                                            {notif.message}
                                                            <div className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleTimeString()}</div>
                                                        </Link>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Link to={`/profile/${user.id}`} className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                                    <User className="h-5 w-5" />
                                </Link>
                                <button onClick={handleLogout} className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </>
                        ) : (
                            <Link to="/login" className="flex items-center text-gray-700 dark:text-gray-300 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                                <LogIn className="w-4 h-4 mr-2" /> Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
