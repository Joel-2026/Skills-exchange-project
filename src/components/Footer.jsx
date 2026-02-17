import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto py-6 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Skillify</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">© 2026 Skillify. All rights reserved.</p>
                </div>
                <div className="flex space-x-6 text-sm text-gray-500 dark:text-gray-400">
                    <Link to="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About</Link>
                    <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy</a>
                    <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms</a>
                    <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Contact</a>
                </div>
            </div>
            <div className="mt-4 text-center text-xs text-gray-400 flex justify-center items-center">
                Made with <Heart className="w-3 h-3 mx-1 text-red-500 fill-red-500" /> by Joel
            </div>
        </footer>
    );
}
