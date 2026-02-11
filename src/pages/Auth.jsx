
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, Loader } from 'lucide-react';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Check for referral code on mount to switch to Sign Up
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('ref')) {
            setIsSignUp(true);
        }
    }, []);

    const handleSocialLogin = async (provider) => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: `${window.location.origin}/onboarding`,
            },
        });
        if (error) {
            alert('Error logging in with ' + provider + ': ' + error.message);
            setLoading(false);
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                // Check if there is a referral in query params
                const params = new URLSearchParams(window.location.search);
                const referralCode = params.get('ref');

                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            referral_code: referralCode // Pass to metadata for trigger
                        }
                    }
                });
                if (error) throw error;
                alert('Check your email for the login link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                // Check if onboarding is completed
                const { data: { user } } = await supabase.auth.getUser();
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('onboarding_completed')
                    .eq('id', user.id)
                    .single();

                if (profile?.onboarding_completed) {
                    navigate('/dashboard');
                } else {
                    navigate('/onboarding');
                }
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
            <div className="max-w-xs w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        {isSignUp ? 'Create your account' : 'Sign in to your account'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            {isSignUp ? 'switch to sign in' : 'create an account'}
                        </button>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleAuth}>
                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute top-3 left-3 text-gray-400 h-5 w-5" />
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none block w-full px-10 py-3 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm shadow-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute top-3 left-3 text-gray-400 h-5 w-5" />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none block w-full px-10 py-3 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm shadow-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader className="animate-spin h-5 w-5 text-white" />
                            ) : (
                                isSignUp ? 'Sign Up' : 'Sign In'
                            )}
                        </button>
                    </div>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-3 gap-3">
                            {/* Google */}
                            <button
                                type="button"
                                onClick={() => handleSocialLogin('google')}
                                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                <span className="sr-only">Sign in with Google</span>
                                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            </button>

                            {/* Facebook */}
                            <button
                                type="button"
                                onClick={() => handleSocialLogin('facebook')}
                                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                <span className="sr-only">Sign in with Facebook</span>
                                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                                    <path
                                        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h2.975V9.498c0-2.94 1.742-4.607 4.47-4.607 1.306 0 2.673.233 2.673.233v2.937H15.69c-1.464 0-1.92.908-1.92 1.84v2.227h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                                        fill="#1877F2"
                                    />
                                </svg>
                            </button>

                            {/* LinkedIn */}
                            <button
                                type="button"
                                onClick={() => handleSocialLogin('linkedin')}
                                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                <span className="sr-only">Sign in with LinkedIn</span>
                                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                                    <path
                                        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                                        fill="#0A66C2"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
