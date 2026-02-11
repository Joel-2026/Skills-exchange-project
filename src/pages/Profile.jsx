
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { User, Save, Plus, Award, Trash2, Paperclip, Star, X, Check } from 'lucide-react';
import StarRating from '../components/StarRating';
import { ProfileSkeleton } from '../components/Skeleton';
import ImageCropper from '../components/ImageCropper';

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
    const [newSkill, setNewSkill] = useState({ title: '', description: '', category: '', mode: 'online', max_students: 1 });
    // Achievements state
    const [achievements, setAchievements] = useState([]);
    const [isAddingAchievement, setIsAddingAchievement] = useState(false);
    const [newAchievement, setNewAchievement] = useState({ title: '', description: '', image_url: '' });
    const [uploading, setUploading] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [groupSessions, setGroupSessions] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    // Cropping state
    const [cropImageSrc, setCropImageSrc] = useState(null);
    const [isCropping, setIsCropping] = useState(false);

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [badges, setBadges] = useState([]);

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

                // Fetch Reviews
                const { data: reviewsData } = await supabase
                    .from('reviews')
                    .select('*, reviewer:reviewer_id(full_name, avatar_url)')
                    .eq('target_id', targetUserId)
                    .order('created_at', { ascending: false });

                if (reviewsData) {
                    setReviews(reviewsData);
                    const total = reviewsData.reduce((acc, r) => acc + r.rating, 0);
                    setAverageRating(reviewsData.length ? (total / reviewsData.length).toFixed(1) : 0);
                }

                // Fetch Badges
                const { data: badgesData } = await supabase
                    .from('user_badges')
                    .select('*, badges(*)')
                    .eq('user_id', targetUserId)
                    .order('awarded_at', { ascending: false });

                if (badgesData) setBadges(badgesData.map(ub => ub.badges));

                // Fetch open group sessions (scheduled sessions with available spots)
                // Removed explicit FK hint !public_group_sessions_provider_id_fkey
                const { data: sessionsData, error: sessionsError } = await supabase
                    .from('group_sessions')
                    .select('*, skills(title, max_students, provider_id), requests(id), provider:profiles(full_name)')
                    .eq('provider_id', targetUserId)
                    .eq('status', 'scheduled');

                if (sessionsError) {
                    console.error('Error fetching profile group sessions:', sessionsError);
                }

                if (targetUserId === authUser.id) {
                    // If viewing own profile, show all my sessions (including non-scheduled ones? logic seems to only fetch scheduled above)
                    // Actually the above query filters by 'scheduled'.
                    // If we want to show *all* sessions on own profile, we might need a different query, but for "Available" section, scheduled is correct.
                    setGroupSessions(sessionsData || []);
                    setIsOwnProfile(true);
                    setUser(authUser);
                } else {
                    setGroupSessions(sessionsData || []);
                    setCurrentUser(authUser);
                }
                setLoading(false);
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
                    mode: newSkill.mode,
                    max_students: newSkill.max_students
                }
            ]).select();

            if (error) throw error;

            setMySkills([data[0], ...mySkills]);
            setIsAddingSkill(false);
            setNewSkill({ title: '', description: '', category: '', mode: 'online', max_students: 1 });
            alert('Skill added!');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function deleteSkill(skillId) {
        if (!confirm('Are you sure you want to delete this skill?')) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('skills').delete().eq('id', skillId);
            if (error) throw error;
            setMySkills(mySkills.filter(s => s.id !== skillId));
            alert('Skill deleted!');
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

    async function uploadAvatar(event) {
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setCropImageSrc(reader.result);
            setIsCropping(true);
        });
        reader.readAsDataURL(file);
        // Reset the input so the same file can be selected again if needed
        event.target.value = null;
    }

    async function onCropComplete(croppedBlob) {
        try {
            setIsUploadingAvatar(true);
            setIsCropping(false); // Close cropper

            const fileExt = 'jpeg'; // cropped image is jpeg
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            let { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, croppedBlob, {
                    contentType: 'image/jpeg'
                });

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);
        } catch (error) {
            alert(error.message);
        } finally {
            setIsUploadingAvatar(false);
            setCropImageSrc(null);
        }
    }

    function onCropCancel() {
        setIsCropping(false);
        setCropImageSrc(null);
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

    if (loading) return <ProfileSkeleton />;

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            {isCropping && cropImageSrc && (
                <ImageCropper
                    imageSrc={cropImageSrc}
                    onCropComplete={onCropComplete}
                    onCancel={onCropCancel}
                />
            )}
            {/* Profile Header with Avatar */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8 p-6 transition-colors">
                <div className="flex items-center space-x-6">
                    <div className="flex-shrink-0">
                        {avatarUrl ? (
                            <img
                                className="h-24 w-24 rounded-full object-cover border-4 border-indigo-100 dark:border-indigo-900"
                                src={avatarUrl}
                                alt={fullName}
                            />
                        ) : (
                            <span className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border-4 border-gray-200 dark:border-gray-600 flex items-center justify-center">
                                <User className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                            </span>
                        )}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{fullName || 'Anonymous User'}</h1>
                        <div className="flex items-center space-x-2 mt-1">
                            <StarRating rating={Math.round(averageRating)} readOnly size={16} />
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {averageRating > 0 ? averageRating : 'New'} ({reviews.length} reviews)
                            </span>
                        </div>
                        {bio && (
                            <p className="mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-line">{bio}</p>
                        )}
                        {badges.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {badges.map(badge => (
                                    <div key={badge.id} className="flex items-center bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 px-3 py-1 rounded-full text-xs border border-indigo-100 dark:border-indigo-800" title={badge.description}>
                                        <Award className="w-3 h-3 mr-1" />
                                        {badge.title}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                    <div className="px-4 sm:px-0">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Profile Details</h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {isOwnProfile ? 'Update your profile information.' : 'Public profile information.'}
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
                                    <label className="block text-sm font-medium text-gray-700">
                                        Profile Picture
                                    </label>
                                    <div className="mt-1 flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            {avatarUrl ? (
                                                <img
                                                    className="h-12 w-12 rounded-full object-cover"
                                                    src={avatarUrl}
                                                    alt="Current Avatar"
                                                />
                                            ) : (
                                                <span className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                                                    <User className="h-full w-full text-gray-300 dark:text-gray-500" />
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <input
                                                type="file"
                                                id="avatar-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={uploadAvatar}
                                                disabled={isUploadingAvatar}
                                            />
                                            <label
                                                htmlFor="avatar-upload"
                                                className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                            >
                                                {isUploadingAvatar ? 'Uploading...' : 'Change Photo'}
                                            </label>
                                        </div>
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Students</label>
                                    <select className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        value={newSkill.max_students} onChange={e => setNewSkill({ ...newSkill, max_students: parseInt(e.target.value) })}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                            <option key={num} value={num}>{num} {num === 1 ? 'student' : 'students'}</option>
                                        ))}
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
                                                <div className="flex items-center space-x-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${skill.mode === 'online' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                                        {skill.mode}
                                                    </span>
                                                    {isOwnProfile && (
                                                        <button
                                                            onClick={() => deleteSkill(skill.id)}
                                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                            title="Delete Skill"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-indigo-500 dark:text-indigo-400 mb-2 uppercase tracking-wide">{skill.category}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">{skill.description}</p>
                                            {skill.max_students && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                                    Max: {skill.max_students} {skill.max_students === 1 ? 'student' : 'students'}
                                                </p>
                                            )}
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

            {/* Available Group Sessions Section */}
            {groupSessions.length > 0 && (
                <>
                    <div className="hidden sm:block" aria-hidden="true">
                        <div className="py-5">
                            <div className="border-t border-gray-200" />
                        </div>
                    </div>

                    <div className="md:grid md:grid-cols-3 md:gap-6">
                        <div className="md:col-span-1">
                            <div className="px-4 sm:px-0">
                                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Available Group Sessions</h3>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    Join an open group session
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 md:mt-0 md:col-span-2">
                            <div className="space-y-3">
                                {groupSessions.map(session => {
                                    const currentParticipants = session.requests?.length || 0;
                                    const maxStudents = session.skills?.max_students || 1;
                                    const spotsLeft = maxStudents - currentParticipants;
                                    const alreadyJoined = session.requests?.some(req => req.learner_id === currentUser?.id);
                                    const isFull = spotsLeft <= 0;

                                    return (
                                        <div key={session.id} className="bg-white dark:bg-gray-800 shadow rounded-md p-4 border border-gray-100 dark:border-gray-700">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-white">{session.skills?.title}</h4>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {isFull ? (
                                                            <span className="text-red-500 font-medium">Full ({currentParticipants}/{maxStudents})</span>
                                                        ) : (
                                                            <span>{currentParticipants}/{maxStudents} spots filled • {spotsLeft} spots left</span>
                                                        )}
                                                    </p>
                                                    {session.scheduled_at && (
                                                        <p className="text-xs text-gray-400">
                                                            Scheduled: {new Date(session.scheduled_at).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                                {!isOwnProfile && !alreadyJoined && currentUser && !isFull && (
                                                    <button
                                                        onClick={() => joinGroupSession(session.id, session.skill_id, session.provider_id)}
                                                        className="ml-4 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                                                    >
                                                        Join Session
                                                    </button>
                                                )}
                                                {isFull && !isOwnProfile && !alreadyJoined && (
                                                    <span className="ml-4 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded">
                                                        Full
                                                    </span>
                                                )}
                                                {alreadyJoined && (
                                                    <span className="ml-4 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                                        Joined
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Reviews Section */}
            <div className="hidden sm:block" aria-hidden="true">
                <div className="py-5">
                    <div className="border-t border-gray-200" />
                </div>
            </div>

            <div className="md:grid md:grid-cols-3 md:gap-6 pb-10">
                <div className="md:col-span-1">
                    <div className="px-4 sm:px-0">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Reviews</h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            What others say.
                        </p>
                    </div>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                    {reviews.length === 0 ? (
                        <div className="text-gray-500 dark:text-gray-400 text-center py-4 bg-white dark:bg-gray-800 shadow rounded-md border border-gray-100 dark:border-gray-700">
                            No reviews yet.
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {reviews.map(review => (
                                    <li key={review.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="flex space-x-3">
                                            <div className="flex-shrink-0">
                                                {review.reviewer?.avatar_url ? (
                                                    <img className="h-10 w-10 rounded-full" src={review.reviewer.avatar_url} alt="" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                                        <User className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{review.reviewer?.full_name || 'User'}</h3>
                                                    <p className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <StarRating rating={review.rating} readOnly size={14} />
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-300">
                                                    {review.comment}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
