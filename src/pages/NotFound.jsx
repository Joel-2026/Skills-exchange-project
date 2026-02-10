import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-9xl font-extrabold text-gray-200 dark:text-gray-800">404</h1>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-10">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Page Not Found</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    Sorry, we couldn't find the page you're looking for.
                </p>
                <Link
                    to="/"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white btn-primary hover:opacity-90 transition-opacity"
                >
                    <Home className="w-5 h-5 mr-2" />
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
