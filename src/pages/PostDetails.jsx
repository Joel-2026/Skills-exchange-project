import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MessageSquare, ThumbsUp, ArrowLeft, Send } from 'lucide-react';

export default function PostDetails() {
    const { postId } = useParams();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [likesCount, setLikesCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);

    useEffect(() => {
        fetchPostDetails();
        checkUser();
    }, [postId]);

    async function checkUser() {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
            checkIfLiked(user.id);
        }
    }

    async function fetchPostDetails() {
        setLoading(true);
        // Fetch Post
        const { data: postData, error: postError } = await supabase
            .from('posts')
            .select('*, profiles(full_name, avatar_url, id)')
            .eq('id', postId)
            .single();

        if (postError) {
            console.error('Error fetching post:', postError);
            setLoading(false);
            return;
        }

        setPost(postData);

        // Fetch Comments
        const { data: commentsData, error: commentsError } = await supabase
            .from('comments')
            .select('*, profiles(full_name, avatar_url, id)')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (commentsError) console.error('Error fetching comments:', commentsError);
        else setComments(commentsData);

        // Fetch Likes Count
        const { count, error: likesError } = await supabase
            .from('post_likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

        if (!likesError) setLikesCount(count);

        setLoading(false);
    }

    async function checkIfLiked(userId) {
        const { data } = await supabase
            .from('post_likes')
            .select('user_id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .single();

        setHasLiked(!!data);
    }

    async function handleLike() {
        if (!user) return alert('Please login to like posts.');

        if (hasLiked) {
            const { error } = await supabase
                .from('post_likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', user.id);

            if (!error) {
                setHasLiked(false);
                setLikesCount(prev => prev - 1);
            }
        } else {
            const { error } = await supabase
                .from('post_likes')
                .insert([{ post_id: postId, user_id: user.id }]);

            if (!error) {
                setHasLiked(true);
                setLikesCount(prev => prev + 1);
            }
        }
    }

    async function handleCommentSubmit(e) {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        const { data, error } = await supabase
            .from('comments')
            .insert([{
                post_id: postId,
                user_id: user.id,
                content: newComment
            }])
            .select('*, profiles(full_name, avatar_url, id)')
            .single();

        if (error) {
            alert('Failed to post comment');
            console.error(error);
        } else {
            setComments([...comments, data]);
            setNewComment('');
        }
    }

    if (loading) return <div className="p-8 text-center">Loading discussion...</div>;
    if (!post) return <div className="p-8 text-center">Post not found.</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Link to="/forum" className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-6">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Forum
            </Link>

            {/* Post Content */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center mb-4">
                    <Link to={`/profile/${post.profiles?.id}`}>
                        <img
                            className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                            src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${post.profiles?.full_name}&background=random`}
                            alt={post.profiles?.full_name}
                        />
                    </Link>
                    <div className="ml-3">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{post.title}</h1>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <span>Posted by {post.profiles?.full_name}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
                    <p className="whitespace-pre-wrap">{post.body}</p>
                </div>

                <div className="mt-6 flex items-center space-x-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={handleLike}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${hasLiked ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <ThumbsUp className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                        <span>{likesCount} Likes</span>
                    </button>
                    <div className="flex items-center text-gray-500">
                        <MessageSquare className="w-5 h-5 mr-1" />
                        <span>{comments.length} Comments</span>
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Discussion</h3>

                {/* Comment Input */}
                <form onSubmit={handleCommentSubmit} className="mb-8 flex gap-3">
                    <img
                        src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=Me&background=random`}
                        className="w-8 h-8 rounded-full"
                        alt="My Avatar"
                    />
                    <div className="flex-1">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add to the discussion..."
                            className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white p-2 text-sm"
                            rows={2}
                        />
                        <div className="mt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={!newComment.trim()}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white btn-primary disabled:opacity-50"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Comment
                            </button>
                        </div>
                    </div>
                </form>

                {/* Comment List */}
                <div className="space-y-6">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                            <Link to={`/profile/${comment.profiles?.id}`} className="flex-shrink-0">
                                <img
                                    className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-600"
                                    src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${comment.profiles?.full_name}&background=random`}
                                    alt={comment.profiles?.full_name}
                                />
                            </Link>
                            <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-1">
                                    <Link to={`/profile/${comment.profiles?.id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:underline">
                                        {comment.profiles?.full_name}
                                    </Link>
                                    <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                            </div>
                        </div>
                    ))}

                    {comments.length === 0 && (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No comments yet. Be the first!</p>
                    )}
                </div>
            </div>
        </div>
    );
}
