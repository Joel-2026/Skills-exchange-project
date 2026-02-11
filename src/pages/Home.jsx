
import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 transition-colors">
            {/* Background Image with Opacity */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
                    alt="Background"
                    className="w-full h-full object-cover opacity-40 dark:opacity-20"
                />
            </div>

            {/* Content Content - z-10 to stay on top */}
            <div className="relative z-10 max-w-4xl mx-auto text-center">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                    <span className="block">Share your time,</span>{' '}
                    <span className="block text-gradient-primary">exchange your skills.</span>
                </h1>
                <p className="mt-4 max-w-xl mx-auto text-base text-gray-500 dark:text-gray-300 sm:text-lg md:text-xl">
                    Join a community where 1 hour of teaching equals 1 credit to learn. No money, just pure knowledge exchange.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <div className="rounded-md shadow">
                        <Link
                            to="/login"
                            className="w-full flex items-center justify-center px-10 py-3 border border-transparent text-base font-medium rounded-md text-white btn-primary md:py-4 md:text-lg md:px-12 min-w-[200px]"
                        >
                            Get Started
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}
