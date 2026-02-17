
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Users, TrendingUp } from 'lucide-react';

export default function Home() {
    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-orange-950">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-10 dark:opacity-5"></div>
            </div>

            {/* Floating Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-orange-300/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Hero Content */}
            <div className="relative z-10 min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto text-center space-y-10 animate-fade-in">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card animate-slide-up">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Join 1000+ skill sharers worldwide</span>
                    </div>

                    {/* Main Heading */}
                    <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <h1 className="text-5xl tracking-tight font-black text-gray-900 dark:text-white sm:text-6xl md:text-7xl lg:text-8xl">
                            <span className="block text-shadow-lg">Share your time,</span>
                            <span className="block text-gradient-primary text-shadow-lg">exchange your skills.</span>
                        </h1>
                        <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600 dark:text-gray-300 sm:text-xl md:text-2xl leading-relaxed">
                            Join <span className="font-bold text-gradient-primary">Skillify</span> where 1 hour of teaching equals 1 credit to learn.
                            <br className="hidden sm:block" />
                            <span className="font-semibold">No money, just pure knowledge exchange.</span>
                        </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <Link
                            to="/login"
                            className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold rounded-xl shadow-2xl btn-primary transform hover:scale-110 transition-all duration-300"
                        >
                            Get Started
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            to="/search"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold rounded-xl btn-outline-primary"
                        >
                            Explore Skills
                        </Link>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <div className="card-glass rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 mx-auto">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Connect & Learn</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Find experts and enthusiasts to learn from</p>
                        </div>

                        <div className="card-glass rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2" style={{ animationDelay: '0.1s' }}>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4 mx-auto">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Share Skills</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Teach what you know and earn credits</p>
                        </div>

                        <div className="card-glass rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2" style={{ animationDelay: '0.2s' }}>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 mx-auto">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Grow Together</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Build a community of lifelong learners</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
