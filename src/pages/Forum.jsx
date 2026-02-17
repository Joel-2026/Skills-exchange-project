
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { MessageSquare, Plus, User, MessageCircle, Trash2, Reply } from 'lucide-react';

export default function Forum() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', body: '' });
    const [user, setUser] = useState(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
        fetchPosts();
    }, []);

    async function fetchPosts() {
        setLoading(true);
        const { data, error } = await supabase
            .from('posts')
            .select('*, profiles:user_id(full_name, avatar_url), comments(count)')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching posts:', error);
        else setPosts(data);
        setLoading(false);
    }

    async function createPost() {
        console.log('Attempting to create post:', newPost);
        if (!newPost.title.trim() || !newPost.body.trim()) {
            alert('Please fill in both title and body fields');
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return alert('Please login first.');

        console.log('User ID:', user.id);

        const { data, error } = await supabase.from('posts').insert([{
            user_id: user.id,
            title: newPost.title,
            body: newPost.body
        }]).select();

        if (error) {
            console.error('Error creating post:', error);
            alert(`Failed to create post: ${error.message}`);
        } else {
            console.log('Post created successfully:', data);
            setNewPost({ title: '', body: '' });
            setIsCreating(false);
            fetchPosts();
        }
    }

    async function deletePost(postId) {
        if (!confirm('Are you sure you want to delete this discussion?')) return;

        const { data, error } = await supabase.from('posts').delete().eq('id', postId).select();

        if (error) {
            console.error('Error deleting post:', error);
            alert(`Failed to delete post: ${error.message}`);
        } else if (data.length === 0) {
            alert('Could not delete post. You might not have permission.');
        } else {
            setPosts(posts.filter(p => p.id !== postId));
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Community Forum</h2>
                    <p className="text-gray-500 dark:text-gray-400">Ask questions, share tips, and connect.</p>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white btn-primary"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Discussion
                </button>
            </div>

            {isCreating && (
                <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6 mb-8 border border-indigo-100 dark:border-gray-700 transition-colors">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Start a Discussion</h3>
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Title"
                            className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2 dark:bg-gray-700 dark:text-white"
                            value={newPost.title}
                            onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                        />
                        <textarea
                            rows={4}
                            placeholder="What's on your mind?"
                            className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2 dark:bg-gray-700 dark:text-white"
                            value={newPost.body}
                            onChange={e => setNewPost({ ...newPost, body: e.target.value })}
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createPost}
                                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white btn-primary"
                            >
                                Post
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 dark:text-gray-300">Loading discussions...</div>
            ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No discussions yet</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Be the first to start a conversation!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => {
                        const isOwner = (user && user.id === post.user_id);
                        return (
                            <div key={post.id} className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6 hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 relative group">
                                {isOwner && (
                                    null // Moved below date
                                )}
                                <div className="flex items-start">
                                    <Link to={`/profile/${post.user_id || post.profiles?.id}`}>
                                        <img
                                            className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                            src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${post.profiles?.full_name}&background=random`}
                                            alt={post.profiles?.full_name}
                                        />
                                    </Link>
                                    <div className="ml-4 flex-1">
                                        <div className="flex items-center justify-between">
                                            <Link to={`/forum/${post.id}`} className="hover:underline">
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white pr-8">{post.title}</h3>
                                            </Link>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(post.created_at).toLocaleDateString()}</span>
                                                {user && (
                                                    <button
                                                        onClick={() => deletePost(post.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                                                        title="Delete Discussion"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            by <Link to={`/profile/${post.user_id || post.profiles?.id}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                                                {post.profiles?.full_name}
                                            </Link>
                                        </p>
                                        <p className="mt-2 text-gray-800 dark:text-gray-200 text-sm line-clamp-3">{post.body}</p>

                                        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                                            <Link to={`/forum/${post.id}`} className="flex items-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                                <Reply className="w-4 h-4 mr-1" />
                                                {post.comments && post.comments[0] ? post.comments[0].count : 0} Replies
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
