import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Save, Bell, Lock, User } from 'lucide-react';

export default function Settings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState(null);
    const [profile, setProfile] = useState({
        full_name: '',
        bio: '',
        email_notifications: true,
        profile_visibility: 'public'
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile({
                    full_name: data.full_name || '',
                    bio: data.bio || '',
                    email_notifications: data.email_notifications ?? true,
                    profile_visibility: data.profile_visibility || 'public'
                });
            }
        }
        setLoading(false);
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();

        const updates = {
            id: user.id,
            full_name: profile.full_name,
            bio: profile.bio,
            email_notifications: profile.email_notifications,
            profile_visibility: profile.profile_visibility,
            updated_at: new Date()
        };

        const { error } = await supabase.from('profiles').upsert(updates);

        if (error) {
            alert(error.message);
        } else {
            alert('Settings saved!');
        }
        setSaving(false);
    }

    const referralLink = userId ? `${window.location.origin}/login?ref=${userId}` : 'Loading...';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        alert('Referral link copied!');
    };



    if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading settings...</div>;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Settings</h1>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleSave} className="divide-y divide-gray-200 dark:divide-gray-700">

                    {/* Profile Section */}
                    <div className="p-6 space-y-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                            <User className="w-5 h-5 mr-2 text-indigo-500" />
                            Profile Information
                        </h2>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={profile.full_name}
                                    onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Bio
                                </label>
                                <textarea
                                    rows={3}
                                    value={profile.bio}
                                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notifications Section */}
                    <div className="p-6 space-y-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                            <Bell className="w-5 h-5 mr-2 text-indigo-500" />
                            Notifications
                        </h2>
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="email_notifications"
                                    type="checkbox"
                                    checked={profile.email_notifications}
                                    onChange={e => setProfile({ ...profile, email_notifications: e.target.checked })}
                                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="email_notifications" className="font-medium text-gray-700 dark:text-gray-300">
                                    Email Notifications
                                </label>
                                <p className="text-gray-500 dark:text-gray-400">Receive emails about new requests and messages.</p>
                            </div>
                        </div>
                    </div>

                    {/* Privacy Section */}
                    <div className="p-6 space-y-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                            <Lock className="w-5 h-5 mr-2 text-indigo-500" />
                            Privacy
                        </h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Profile Visibility
                            </label>
                            <select
                                value={profile.profile_visibility}
                                onChange={e => setProfile({ ...profile, profile_visibility: e.target.value })}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                            >
                                <option value="public">Public (Visible to everyone)</option>
                                <option value="private">Private (Only visible to connections)</option>
                            </select>
                        </div>
                    </div>

                    {/* Invite Friends Section */}
                    <div className="p-6 space-y-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                            <span className="w-5 h-5 mr-2 text-indigo-500 flex items-center justify-center text-lg">🎁</span>
                            Invite Friends & Earn Credits
                        </h2>
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-md p-4 border border-indigo-100 dark:border-indigo-800">
                            <p className="text-sm text-indigo-800 dark:text-indigo-200 mb-4">
                                Share your unique link. When a friend signs up, you both get <span className="font-bold">3 credits</span>!
                            </p>

                            <div className="flex items-center space-x-2">
                                <input
                                    readOnly
                                    type="text"
                                    value={referralLink}
                                    className="flex-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm p-2 bg-white dark:bg-gray-800 dark:text-gray-300 text-gray-500"
                                />
                                <button
                                    type="button"
                                    onClick={copyToClipboard}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                                >
                                    Copy
                                </button>

                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
