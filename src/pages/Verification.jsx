import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Upload, Loader, Video, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

export default function Verification() {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [status, setStatus] = useState(''); // uploading, updating, success
    const [currentStatus, setCurrentStatus] = useState(null); // unsubmitted, pending, rejected, approved
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Check if already verified
    React.useEffect(() => {
        const checkVerification = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_verified, onboarding_completed, verification_status')
                    .eq('id', user.id)
                    .single();

                const dbStatus = profile?.verification_status || 'unsubmitted';
                setCurrentStatus(dbStatus);

                if (!profile?.onboarding_completed) {
                    navigate('/onboarding', { replace: true });
                } else if (dbStatus === 'approved' || profile?.is_verified) {
                    navigate('/dashboard', { replace: true });
                }
            }
        };
        checkVerification();
    }, [navigate]);

    // Poll for status updates if currentStatus is pending
    React.useEffect(() => {
        let interval;
        if (currentStatus === 'pending') {
            interval = setInterval(async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('is_verified, verification_status')
                        .eq('id', user.id)
                        .single();
                        
                    if (profile?.verification_status === 'approved' || profile?.is_verified) {
                        navigate('/dashboard', { replace: true });
                    } else if (profile?.verification_status === 'rejected') {
                        setCurrentStatus('rejected');
                    }
                }
            }, 3000); // Check every 3 seconds
        }
        return () => clearInterval(interval);
    }, [currentStatus, navigate]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    }

    const handleUpload = async () => {
        if (!file) {
            alert('Please select a video file first.');
            return;
        }

        setLoading(true);
        setStatus('uploading');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Upload video to storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('verifications')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            setStatus('updating');

            // 2. Get public URL
            const { data: publicData } = supabase.storage
                .from('verifications')
                .getPublicUrl(fileName);

            const videoUrl = publicData.publicUrl;

            // 3. Update profile to 'pending' instead of instantly 'verified'
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ 
                    verification_status: 'pending',
                    verification_video_url: videoUrl 
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setStatus('success');
            
            // Wait for 1.5s to show success state then switch UI to pending
            setTimeout(() => {
                setCurrentStatus('pending');
                setStatus('');
            }, 1500);

        } catch (error) {
            console.error('Error uploading verification video:', error);
            alert(`Upload failed: ${error.message}`);
            setLoading(false);
            setStatus('');
        }
    };

    if (currentStatus === null) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><Loader className="animate-spin text-indigo-600 w-8 h-8" /></div>;
    }

    if (currentStatus === 'pending') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
                <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white dark:bg-gray-800 py-12 px-8 shadow-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
                    <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Under Review</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Thank you for submitting your verification video. Our admin team is currently reviewing it.
                        You will be granted access to the dashboard once approved.
                    </p>
                    <button onClick={() => window.location.reload()} className="mt-8 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">
                        Check Status Again
                    </button>
                    
                    <button onClick={async () => { await supabase.auth.signOut(); window.location.href='/login'}} className="mt-4 block w-full text-center text-sm font-medium text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center flex-col items-center">
                    <Video className="w-12 h-12 text-indigo-600 mb-4" />
                    <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        Verify Your Skill
                    </h2>
                </div>
                {currentStatus === 'rejected' && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-lg flex items-start space-x-3 text-red-800 dark:text-red-200 mx-4">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                        <p className="text-sm font-medium">Your previous verification video was rejected. Please ensure you clearly show yourself performing the skill and try again.</p>
                    </div>
                )}
                <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400 px-4">
                    To keep our community genuine, please upload a short video (under 1 min) showing yourself performing or talking about your skill to verify your identity.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-2xl border border-gray-100 dark:border-gray-700 sm:px-10 transition-colors">
                    <div className="space-y-6">
                        {/* Video Upload Area */}
                        {!previewUrl ? (
                            <div 
                                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer hover:border-indigo-500 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="space-y-1 text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                                        <span className="relative bg-transparent rounded-md font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer">
                                            <span>Upload a video</span>
                                            <input 
                                                id="file-upload" 
                                                name="file-upload" 
                                                type="file" 
                                                className="sr-only" 
                                                accept="video/*"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                            />
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                        MP4, WebM up to 50MB
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-2 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 shadow-sm relative group">
                                <video 
                                    src={previewUrl} 
                                    controls 
                                    className="w-full max-h-64 object-cover"
                                />
                                <div className="p-3 bg-gray-50 dark:bg-gray-700 flex justify-between items-center bg-opacity-90 absolute bottom-0 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-sm font-medium truncate text-gray-700 dark:text-gray-200">
                                        {file?.name}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setFile(null);
                                            setPreviewUrl('');
                                        }}
                                        disabled={loading}
                                        className="text-sm text-red-600 hover:text-red-500 font-bold bg-white dark:bg-gray-800 px-3 py-1 rounded-md disabled:opacity-50 inline-flex items-center space-x-1"
                                    >
                                        <XCircle className="w-4 h-4" /> <span>Remove</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={loading || !file}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all active:scale-95"
                        >
                            {status === 'uploading' && <><Loader className="animate-spin -ml-1 mr-2 h-4 w-4" /> Uploading...</>}
                            {status === 'updating' && <><Loader className="animate-spin -ml-1 mr-2 h-4 w-4" /> Verifying...</>}
                            {status === 'success' && <><CheckCircle className="-ml-1 mr-2 h-4 w-4" /> Submitted!</>}
                            {!status && 'Submit Verification'}
                        </button>
                    </div>
                </div>
                {/* Sign Out for safety if stuck */}
                 <button onClick={async () => { await supabase.auth.signOut(); window.location.href='/login'}} className="mt-4 mx-auto block text-sm font-medium text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                    Sign Out
                </button>
            </div>
        </div>
    );
}
