
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { User, Save, Plus, Award, Trash2, Paperclip } from 'lucide-react';

export default function Profile() {
    const { userId } = useParams(); // Get userId from URL if present
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false); // Track if viewing own profile
    // Profile state
    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    // Skills state
    const [mySkills, setMySkills] = useState([]);
    const [isAddingSkill, setIsAddingSkill] = useState(false);
    const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);
    const [newSkill, setNewSkill] = useState({ title: '', description: '', category: '', mode: 'online' });
    // Achievements state
    const [achievements, setAchievements] = useState([]);
    const [isAddingAchievement, setIsAddingAchievement] = useState(false);
    const [newAchievement, setNewAchievement] = useState({ title: '', description: '', image_url: '' });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        async function getProfile() {
            setLoading(true);
            const { data: { user: authUser } } = await supabase.auth.getUser();

            // Determine whose profile we are viewing
            const targetUserId = userId || authUser?.id;
            const isOwner = authUser && targetUserId === authUser.id;

            setUser(authUser);
            setIsOwnProfile(isOwner);

            if (targetUserId) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', targetUserId)
                    .single();

                if (data) {
                    setFullName(data.full_name || '');
                    setBio(data.bio || '');
                    setAvatarUrl(data.avatar_url || '');
                }

                // Fetch Skills
                const { data: skillsData } = await supabase
                    .from('skills')
                    .select('*')
                    .eq('provider_id', targetUserId);

                if (skillsData) setMySkills(skillsData);

                // Fetch Achievements
                const { data: achievementsData } = await supabase
                    .from('achievements')
                    .select('*')
                    .eq('user_id', targetUserId)
                    .order('created_at', { ascending: false });

                if (achievementsData) setAchievements(achievementsData);
            }
            setLoading(false);
        }

        getProfile();
    }, [userId]);

    async function addSkill() {
        if (!newSkill.title || !user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from('skills').insert([
                {
                    provider_id: user.id,
                    title: newSkill.title,
                    description: newSkill.description,
                    category: newSkill.category,
                    mode: newSkill.mode
                }
            ]).select();

            if (error) throw error;

            setMySkills([data[0], ...mySkills]);
            setIsAddingSkill(false);
            setNewSkill({ title: '', description: '', category: '', mode: 'online' });
            alert('Skill added!');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function uploadImage(event) {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            let { error: uploadError } = await supabase.storage
                .from('achievements')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('achievements')
                .getPublicUrl(filePath);

            setNewAchievement({ ...newAchievement, image_url: publicUrl });
        } catch (error) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    }

    async function addAchievement() {
        if (!newAchievement.title || !newAchievement.image_url || !user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from('achievements').insert([
                {
                    user_id: user.id,
                    title: newAchievement.title,
                    description: newAchievement.description,
                    image_url: newAchievement.image_url
                }
            ]).select();

            if (error) throw error;

            setAchievements([data[0], ...achievements]);
            setIsAddingAchievement(false);
            setNewAchievement({ title: '', description: '', image_url: '' });
            alert('Achievement added!');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function deleteAchievement(id) {
        if (!confirm('Are you sure you want to delete this achievement?')) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('achievements').delete().eq('id', id);
            if (error) throw error;
            setAchievements(achievements.filter(a => a.id !== id));
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function updateProfile() {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: fullName,
                    bio,
                    avatar_url: avatarUrl,
                    updated_at: new Date(),
                });

            if (error) throw error;
            alert('Profile updated!');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                    <div className="px-4 sm:px-0">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Profile</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            This information will be displayed publicly so others can find you.
                        </p>
                    </div>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                    <div className="shadow sm:rounded-md sm:overflow-hidden">
                        <div className="px-4 py-5 bg-white dark:bg-gray-800 space-y-6 sm:p-6 transition-colors">

                            {/* Full Name */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-3 sm:col-span-2">
                                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                                        Full Name
                                    </label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        {isOwnProfile ? (
                                            <input
                                                type="text"
                                                name="full_name"
                                                id="full_name"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 border"
                                                placeholder="Jane Doe"
                                            />
                                        ) : (
                                            <div className="py-2 text-gray-900 dark:text-white font-medium">{fullName}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bio */}
                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                                    About
                                </label>
                                <div className="mt-1">
                                    {isOwnProfile ? (
                                        <textarea
                                            id="bio"
                                            name="bio"
                                            rows={3}
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                                            placeholder="I am a software engineer who loves teaching math..."
                                        />
                                    ) : (
                                        <div className="py-2 text-gray-700 dark:text-gray-300 whitespace-pre-line">{bio || 'No bio provided.'}</div>
                                    )}
                                </div>
                                {isOwnProfile && (
                                    <p className="mt-2 text-sm text-gray-500">
                                        Brief description for your profile. URLs are hyperlinked.
                                    </p>
                                )}
                            </div>

                            {/* Avatar URL (Simple Text Input for MVP) */}
                            {isOwnProfile && (
                                <div>
                                    <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700">
                                        Avatar URL
                                    </label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                            http://
                                        </span>
                                        <input
                                            type="text"
                                            name="avatar_url"
                                            id="avatar_url"
                                            value={avatarUrl}
                                            onChange={(e) => setAvatarUrl(e.target.value)}
                                            className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300 px-3 py-2 border"
                                            placeholder="example.com/me.png"
                                        />
                                    </div>
                                </div>
                            )}

                        </div>
                        {isOwnProfile && (
                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-right sm:px-6">
                                <button
                                    onClick={updateProfile}
                                    type="submit"
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Skills Section */}
            <div className="hidden sm:block" aria-hidden="true">
                <div className="py-5">
                    <div className="border-t border-gray-200" />
                </div>
            </div>

            <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                    <div className="px-4 sm:px-0">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{isOwnProfile ? 'My Skills' : `${fullName}'s Skills`}</h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Skills being offered.
                        </p>
                        {isOwnProfile && (
                            <button
                                onClick={() => setIsAddingSkill(!isAddingSkill)}
                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white btn-primary"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {isAddingSkill ? 'Cancel' : 'Add New Skill'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                    {isAddingSkill && (
                        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-6 p-6 border border-indigo-100 dark:border-gray-700 transition-colors">
                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Post a new skill</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Title</label>
                                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        value={newSkill.title} onChange={e => setNewSkill({ ...newSkill, title: e.target.value })} placeholder="e.g., Basic Guitar" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Category</label>
                                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        value={newSkill.category} onChange={e => setNewSkill({ ...newSkill, category: e.target.value })} placeholder="e.g., Music" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" rows={3}
                                        value={newSkill.description} onChange={e => setNewSkill({ ...newSkill, description: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mode</label>
                                    <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        value={newSkill.mode} onChange={e => setNewSkill({ ...newSkill, mode: e.target.value })}>
                                        <option value="online">Online</option>
                                        <option value="offline">In-Person</option>
                                        <option value="any">Any</option>
                                    </select>
                                </div>
                                <div className="text-right">
                                    <button onClick={addSkill} disabled={loading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white btn-primary">
                                        <Save className="w-4 h-4 mr-2" />
                                        Publish Skill
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {mySkills.length === 0 ? (
                        <div className="text-gray-500 dark:text-gray-400 text-center py-4 bg-white dark:bg-gray-800 shadow rounded-md">
                            No skills listed yet. Add one to earn credits!
                        </div>
                    ) : (
                        <div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(isSkillsExpanded ? mySkills : mySkills.slice(0, 4)).map(skill => (
                                    <div key={skill.id} className="relative flex flex-col">
                                        <div className="bg-white dark:bg-gray-800 shadow rounded-md p-4 flex-1 border border-indigo-50 dark:border-gray-700 hover:border-indigo-100 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-lg font-medium text-gray-900 dark:text-white truncate pr-2">{skill.title}</h4>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${skill.mode === 'online' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                                    {skill.mode}
                                                </span>
                                            </div>
                                            <p className="text-xs text-indigo-500 dark:text-indigo-400 mb-2 uppercase tracking-wide">{skill.category}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">{skill.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {mySkills.length > 4 && (
                                <div className="mt-4 text-center">
                                    <button
                                        onClick={() => setIsSkillsExpanded(!isSkillsExpanded)}
                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 text-sm font-medium focus:outline-none"
                                    >
                                        {isSkillsExpanded ? 'Show Less' : `See More (${mySkills.length - 4} more)`}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Achievements Section */}
            <div className="hidden sm:block" aria-hidden="true">
                <div className="py-5">
                    <div className="border-t border-gray-200" />
                </div>
            </div>

            <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                    <div className="px-4 sm:px-0">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Achievements</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Certificates and awards.
                        </p>
                        {isOwnProfile && (
                            <button
                                onClick={() => setIsAddingAchievement(!isAddingAchievement)}
                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white btn-primary"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {isAddingAchievement ? 'Cancel' : 'Add Achievement'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                    {isAddingAchievement && (
                        <div className="bg-white shadow sm:rounded-lg mb-6 p-6 border border-indigo-100">
                            <h4 className="text-md font-medium text-gray-900 mb-4">Add New Achievement</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Title</label>
                                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        value={newAchievement.title} onChange={e => setNewAchievement({ ...newAchievement, title: e.target.value })} placeholder="e.g., React Certification" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Image</label>
                                    <div className="mt-1 flex items-center">
                                        <input
                                            type="file"
                                            id="achievement-image-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={uploadImage}
                                            disabled={uploading}
                                        />
                                        <label
                                            htmlFor="achievement-image-upload"
                                            className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            <Paperclip className="w-5 h-5 mr-2 text-gray-500" />
                                            {uploading ? 'Uploading...' : 'Attach Image'}
                                        </label>
                                        {newAchievement.image_url && (
                                            <span className="ml-3 text-sm text-green-600">Image attached!</span>
                                        )}
                                    </div>
                                    {newAchievement.image_url && (
                                        <div className="mt-2">
                                            <img src={newAchievement.image_url} alt="Preview" className="h-20 w-auto rounded-md" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" rows={2}
                                        value={newAchievement.description} onChange={e => setNewAchievement({ ...newAchievement, description: e.target.value })} placeholder="Issued by..." />
                                </div>
                                <div className="text-right">
                                    <button onClick={addAchievement} disabled={loading || uploading || !newAchievement.image_url} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white btn-primary disabled:bg-gray-400">
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Achievement
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {achievements.length === 0 ? (
                        <div className="text-gray-500 text-center py-4 bg-white shadow rounded-md">
                            No achievements added yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {achievements.map(ach => (
                                <div key={ach.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                                    <div className="h-40 w-full bg-gray-100 relative">
                                        <img src={ach.image_url} alt={ach.title} className="h-full w-full object-cover" />
                                        <button
                                            onClick={() => deleteAchievement(ach.id)}
                                            className={`absolute top-2 right-2 bg-white/80 hover:bg-white p-1 rounded-full text-red-600 shadow-sm transition-colors ${!isOwnProfile ? 'hidden' : ''}`}
                                            title="Delete Achievement"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <h4 className="text-lg font-bold text-gray-900 truncate">{ach.title}</h4>
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ach.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
