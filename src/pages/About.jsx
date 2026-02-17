
import React from 'react';
import { Users, Shield, Globe, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
    return (
        <div className="bg-white dark:bg-gray-900">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-indigo-600">
                <div className="absolute inset-0">
                    <img
                        className="h-full w-full object-cover opacity-20"
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                        alt="People working together"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-800 mix-blend-multiply" />
                </div>
                <div className="relative max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                        About Skillify
                    </h1>
                    <p className="mt-6 max-w-2xl mx-auto text-xl text-indigo-100">
                        Connecting learners and teachers worldwide. We believe everyone has something to teach and something to learn.
                    </p>
                </div>
            </div>

            {/* Mission Section */}
            <div className="py-16 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Our Mission</h2>
                        <p className="mt-1 text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight">
                            Democratizing Education
                        </p>
                        <p className="max-w-xl mx-auto mt-5 text-xl text-gray-500 dark:text-gray-400">
                            We're building a platform where knowledge flows freely, irrespective of geography or financial status.
                        </p>
                    </div>

                    <div className="mt-12">
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="pt-6">
                                <div className="flow-root bg-gray-50 dark:bg-gray-800 rounded-lg px-6 pb-8">
                                    <div className="-mt-6">
                                        <div>
                                            <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                                                <Users className="h-6 w-6 text-white" aria-hidden="true" />
                                            </span>
                                        </div>
                                        <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">Community First</h3>
                                        <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                                            A vibrant community of passionate learners and experts sharing their skills.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6">
                                <div className="flow-root bg-gray-50 dark:bg-gray-800 rounded-lg px-6 pb-8">
                                    <div className="-mt-6">
                                        <div>
                                            <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                                                <Shield className="h-6 w-6 text-white" aria-hidden="true" />
                                            </span>
                                        </div>
                                        <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">Trust & Safety</h3>
                                        <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                                            Verified profiles and secure session environments for peace of mind.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <div className="flow-root bg-gray-50 dark:bg-gray-800 rounded-lg px-6 pb-8">
                                    <div className="-mt-6">
                                        <div>
                                            <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                                                <Globe className="h-6 w-6 text-white" aria-hidden="true" />
                                            </span>
                                        </div>
                                        <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">Skill Exchange</h3>
                                        <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                                            Trade skills directly using our credit system. Learn anything, anytime.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <div className="flow-root bg-gray-50 dark:bg-gray-800 rounded-lg px-6 pb-8">
                                    <div className="-mt-6">
                                        <div>
                                            <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                                                <Heart className="h-6 w-6 text-white" aria-hidden="true" />
                                            </span>
                                        </div>
                                        <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">Passion Driven</h3>
                                        <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                                            Fueled by the love of learning and teaching, not just profit.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-indigo-700">
                <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                        <span className="block">Ready to dive in?</span>
                        <span className="block">Start learning today.</span>
                    </h2>
                    <p className="mt-4 text-lg leading-6 text-indigo-200">
                        Join thousands of users exchanging skills and growing together.
                    </p>
                    <Link
                        to="/register"
                        className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 sm:w-auto"
                    >
                        Sign up for free
                    </Link>
                </div>
            </div>

            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
                    <div className="mt-8 md:mt-0 md:order-1">
                        <p className="text-center text-base text-gray-400">
                            &copy; 2026 Skillify. All rights reserved.
                        </p>
                        <p className="text-center text-xs text-gray-300 mt-2">
                            Made with ❤️ by Joel
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
