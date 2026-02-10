import React from 'react';

export default function Skeleton({ className = '', count = 1, ...props }) {
    return (
        <div className="animate-pulse flex flex-col space-y-2" {...props}>
            {[...Array(count)].map((_, i) => (
                <div
                    key={i}
                    className={`bg-gray-200 dark:bg-gray-700 rounded ${className}`}
                />
            ))}
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8 p-6 flex items-center space-x-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                </div>
                <div className="col-span-2 space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Skeleton className="h-32 w-full mb-8 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Skeleton className="h-40 rounded-lg" />
                <Skeleton className="h-40 rounded-lg" />
                <Skeleton className="h-40 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-1/4 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
            </div>
        </div>
    );
}
