
import React from 'react';
import { Clock, MapPin, Monitor, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SkillCard({ skill, showProvider = true, onBook }) {
    const isOnline = skill.mode === 'online';

    return (

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-all border border-gray-100 dark:border-gray-700">
            <div className="p-5">
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        {skill.category || 'General'}
                    </span>
                    {skill.proficiency && (
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${skill.proficiency === 'Advanced' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                skill.proficiency === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                            {skill.proficiency}
                        </span>
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        {skill.mode === 'online' ? <Monitor className="w-3 h-3 mr-1" /> : <MapPin className="w-3 h-3 mr-1" />}
                        {skill.mode}
                    </span>
                </div>

                <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate" title={skill.title}>
                        {skill.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2" title={skill.description}>
                        {skill.description}
                    </p>
                </div>

                {showProvider && skill.profiles && (
                    <div className="mt-4 flex items-center">
                        <div className="flex-shrink-0">
                            {skill.profiles.avatar_url ? (
                                <img className="h-8 w-8 rounded-full" src={skill.profiles.avatar_url} alt="" />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                </div>
                            )}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{skill.profiles.full_name || 'Anonymous'}</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3">
                {onBook ? (
                    <button
                        onClick={() => onBook(skill)}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                        Request Session (1 Credit)
                    </button>
                ) : (
                    <div className="text-sm text-gray-400 italic text-center">Managed in Profile</div>
                )}
            </div>
        </div>
    );
}

