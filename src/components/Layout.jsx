import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    const navigate = useNavigate();

    // Routes where Sidebar and Navbar should be hidden
    const hideNavRoutes = ['/', '/login', '/onboarding', '/auth'];
    const shouldHideNav = hideNavRoutes.includes(location.pathname);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('onboarding_completed')
                    .eq('id', currentUser.id)
                    .single();

                // If profile loaded and onboarding NOT completed, and not currently ON onboarding page
                if (profile && !profile.onboarding_completed && location.pathname !== '/onboarding') {
                    navigate('/onboarding');
                }
                // If profile loaded and onboarding IS completed, and CURRENTLY on onboarding page
                else if (profile && profile.onboarding_completed && location.pathname === '/onboarding') {
                    navigate('/dashboard');
                }
            }
            setLoading(false);
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // We could re-run checkUser here, or just basic session set. 
            // Ideally we want to re-verify profile on specific events but for now just basic auth state is okay.
            // But if they just signed in, we need the profile check.
            if (_event === 'SIGNED_IN') {
                checkUser();
            } else if (_event === 'SIGNED_OUT') {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [location.pathname]); // Re-run on route change to protect routes? Or just once + auth change?
    // If we add location.pathname, it runs on every nav. That's good for protection.
    // But ensure no infinite loop. The conditions above prevent it.

    if (loading) return null; // Or a spinner

    // If on a hidden route (like login/onboarding), render simplified layout
    if (shouldHideNav) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <main className="flex-1">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {user && <Sidebar />}

            {/* If user is logged in, push content to right on desktop */}
            <div className={`flex flex-col min-h-screen transition-all duration-300 ${user ? 'md:pl-64' : ''}`}>
                <Navbar />
                <main className="flex-1 p-4 lg:p-8 flex flex-col">
                    <div className="flex-1">
                        {children}
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
}
