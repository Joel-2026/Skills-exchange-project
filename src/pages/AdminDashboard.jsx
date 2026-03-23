import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader, CheckCircle, XCircle, ShieldCheck, Users, BookOpen, MessageSquare, Activity, AlertTriangle, Trash2, Video, LayoutDashboard, Check } from 'lucide-react';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('verification');
    const [loading, setLoading] = useState(true);

    const [pendingUsers, setPendingUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [reports, setReports] = useState([]);
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        if (activeTab === 'verification') fetchPendingUsers();
        else if (activeTab === 'stats') fetchStats();
        else if (activeTab === 'reports') fetchReports();
        else if (activeTab === 'moderation') fetchGlobalPosts();
    }, [activeTab]);

    // --- FETCHERS ---
    const fetchPendingUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, verification_video_url, email')
            .eq('verification_status', 'pending');
        if (!error) setPendingUsers(data || []);
        setLoading(false);
    };

    const fetchStats = async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_platform_stats');
        if (!error) setStats(data);
        else console.error(error);
        setLoading(false);
    };

    const fetchReports = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('reports')
            .select('*, profiles:reporter_id(full_name, email)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (!error) setReports(data || []);
        setLoading(false);
    };

    const fetchGlobalPosts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('posts')
            .select('id, title, body, created_at, profiles:user_id(full_name)')
            .order('created_at', { ascending: false })
            .limit(50);
        if (!error) setPosts(data || []);
        setLoading(false);
    };

    // --- ACTIONS ---
    const handleVerifyAction = async (userId, action) => {
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const isVerified = action === 'approve';
        const originalUsers = [...pendingUsers];
        setPendingUsers(prev => prev.filter(user => user.id !== userId));

        const { error } = await supabase.rpc('admin_update_verification', {
            target_user_id: userId,
            new_status: newStatus,
            new_is_verified: isVerified
        });

        if (error) {
            alert('Error updating user: ' + error.message);
            setPendingUsers(originalUsers);
        }
    };

    const handleResolveReport = async (reportId) => {
        const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
        if (!error) setReports(prev => prev.filter(r => r.id !== reportId));
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to globally delete this post?')) return;
        
        // Fast optimistic UI delete
        setPosts(prev => prev.filter(p => p.id !== postId));
        
        const { error } = await supabase.rpc('admin_delete_post', { target_post_id: postId });
        if (error) {
            alert('Failed to delete: ' + error.message);
            fetchGlobalPosts(); // Revert
        }
    };

    // --- RENDERERS ---
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="mb-8 flex items-center space-x-3">
                <ShieldCheck className="w-10 h-10 text-yellow-500 drop-shadow-sm" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Admin Dashboard</h1>
            </div>

            {/* TABS */}
            <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'verification', name: 'Verifications', icon: Video },
                        { id: 'stats', name: 'Platform Stats', icon: Activity },
                        { id: 'reports', name: 'Report Queue', icon: AlertTriangle },
                        { id: 'moderation', name: 'Global Posts', icon: LayoutDashboard }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200
                                ${activeTab === tab.id 
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                            `}
                        >
                            <tab.icon className={`
                                ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}
                                -ml-0.5 mr-2 h-5 w-5 transition-colors
                            `} />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            {/* CONTENT */}
            <div className="min-h-[400px]">
                {loading && <div className="flex justify-center items-center py-12"><Loader className="animate-spin text-indigo-600 w-10 h-10" /></div>}

                {/* VERIFICATIONS TAB */}
                {!loading && activeTab === 'verification' && (
                    pendingUsers.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
                            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4 drop-shadow-md" />
                            <h3 className="text-xl font-medium text-gray-900 dark:text-white">All caught up!</h3>
                            <p className="mt-2 text-gray-500 dark:text-gray-400">There are no pending verifications.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingUsers.map(user => (
                                <div key={user.id} className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-all">
                                    {user.verification_video_url ? (
                                        <video src={user.verification_video_url} controls className="w-full h-48 object-cover bg-black" />
                                    ) : (
                                        <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500">No video URL</div>
                                    )}
                                    <div className="p-5">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{user.full_name || 'Unnamed'}</h3>
                                        <p className="text-sm text-gray-500 mb-5 truncate">{user.email || 'No email'}</p>
                                        <div className="flex space-x-3">
                                            <button onClick={() => handleVerifyAction(user.id, 'approve')} className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-transform active:scale-95 shadow">
                                                <CheckCircle className="w-4 h-4 mr-2" /> Approve
                                            </button>
                                            <button onClick={() => handleVerifyAction(user.id, 'reject')} className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-transform active:scale-95 shadow">
                                                <XCircle className="w-4 h-4 mr-2" /> Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* STATS TAB */}
                {!loading && activeTab === 'stats' && stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="bg-blue-500" />
                        <StatCard title="Active Skills" value={stats.totalSkills} icon={BookOpen} color="bg-green-500" />
                        <StatCard title="Forum Posts" value={stats.totalPosts} icon={MessageSquare} color="bg-purple-500" />
                        <StatCard title="Group Sessions" value={stats.totalSessions} icon={Video} color="bg-orange-500" />
                    </div>
                )}

                {/* REPORTS TAB */}
                {!loading && activeTab === 'reports' && (
                    reports.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <CheckCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Inbox Zero</h3>
                            <p className="mt-1 text-gray-500">No pending reports.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reports.map(report => (
                                <div key={report.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <div>
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                {report.reported_item_type.toUpperCase()}
                                            </span>
                                            <span className="text-sm text-gray-500">Reported by {report.profiles?.full_name}</span>
                                        </div>
                                        <p className="text-gray-900 dark:text-white font-medium">Reason: {report.reason}</p>
                                        <p className="text-xs text-gray-400 mt-1">ID: {report.reported_item_id}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleResolveReport(report.id)}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none transition-colors"
                                    >
                                        <Check className="w-4 h-4 mr-2 text-green-500" />
                                        Mark Resolved
                                    </button>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* MODERATION TAB */}
                {!loading && activeTab === 'moderation' && (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {posts.map(post => (
                                <li key={post.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 truncate">
                                            {post.profiles?.full_name}
                                        </p>
                                        <p className="text-base font-medium text-gray-900 dark:text-white line-clamp-1">
                                            {post.title}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                                            {post.body}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center space-x-4">
                                        <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</span>
                                        <button 
                                            onClick={() => handleDeletePost(post.id)}
                                            className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-transform hover:scale-110"
                                            title="Delete Post Globally"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

// Simple internal component for the stats cards
function StatCard({ title, value, icon: Icon, color }) {
    return (
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm hover:shadow-md rounded-2xl border border-gray-100 dark:border-gray-700 transition-shadow">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className={`rounded-xl p-3 ${color} bg-opacity-10 dark:bg-opacity-20`}>
                            <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} aria-hidden="true" />
                        </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
                            <dd>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
