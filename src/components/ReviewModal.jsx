import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import StarRating from './StarRating';

export default function ReviewModal({ isOpen, onClose, reviewerId, targetId, sessionId, targetName, onReviewSubmitted }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        setSubmitting(true);
        const { error } = await supabase.from('reviews').insert({
            reviewer_id: reviewerId,
            target_id: targetId,
            session_id: sessionId,
            rating,
            comment
        });

        setSubmitting(false);

        if (error) {
            console.error('Review error:', error);
            alert('Failed to submit review');
        } else {
            alert('Review submitted!');
            if (onReviewSubmitted) onReviewSubmitted();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    <X size={24} />
                </button>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Review {targetName}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                    How was your experience? Your feedback helps others.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="flex justify-center mb-6">
                        <StarRating rating={rating} setRating={setRating} size={32} />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Comment (Optional)
                        </label>
                        <textarea
                            rows={4}
                            className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            placeholder="Share details about your session..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
