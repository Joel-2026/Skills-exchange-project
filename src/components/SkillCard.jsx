
import React from 'react';
import { Clock, MapPin, Monitor, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';

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
                        {skill.mode === 'online' ? (
                            <>
                                <Monitor className="w-3 h-3 mr-1" />
                                {skill.mode}
                            </>
                        ) : (
                            <>
                                <MapPin className="w-3 h-3 mr-1" />
                                <span className="truncate max-w-[100px]" title={skill.location || 'In-Person'}>
                                    {skill.location || 'In-Person'}
                                </span>
                            </>
                        )}
                    </span>
                </div>

                <div className="mt-4">
                    <Link to={`/skill/${skill.id}`} className="block group">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={skill.title}>
                            {skill.title}
                        </h3>
                    </Link>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2" title={skill.description}>
                        {skill.description}
                    </p>
                </div>

                {showProvider && skill.profiles && (
                    <div className="mt-4 flex items-center">
                        <div className="flex-shrink-0">
                            <Link to={`/profile/${skill.profiles.id}`}>
                                {skill.profiles.avatar_url ? (
                                    <img className="h-8 w-8 rounded-full" src={skill.profiles.avatar_url} alt="" />
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    </div>
                                )}
                            </Link>
                        </div>
                        <div className="ml-3">
                            <Link to={`/profile/${skill.profiles.id}`} className="hover:underline">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{skill.profiles.full_name || 'Anonymous'}</p>
                            </Link>
                            {skill.averageRating > 0 && (
                                <div className="flex items-center mt-0.5">
                                    <StarRating rating={skill.averageRating} readOnly={true} size={12} />
                                    <span className="ml-1 text-xs text-gray-400">({skill.reviewCount})</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 flex space-x-2">
                <Link
                    to={`/skill/${skill.id}`}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                    View
                </Link>
                {onBook ? (
                    <button
                        onClick={() => onBook(skill)}
                        className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                        Request
                    </button>
                ) : (
                    <div className="flex-1 text-sm text-gray-400 italic text-center flex items-center justify-center">Managed</div>
                )}
            </div>
        </div>
    );
}

