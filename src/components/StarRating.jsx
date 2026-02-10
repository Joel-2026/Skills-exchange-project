import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, setRating, readOnly = false, size = 20 }) {
    const [hover, setHover] = useState(0);

    return (
        <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <button
                        key={index}
                        type="button"
                        className={readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}
                        onClick={() => !readOnly && setRating(starValue)}
                        onMouseEnter={() => !readOnly && setHover(starValue)}
                        onMouseLeave={() => !readOnly && setHover(0)}
                        disabled={readOnly}
                    >
                        <Star
                            size={size}
                            className={`${starValue <= (hover || rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                                } transition-colors`}
                        />
                    </button>
                );
            })}
        </div>
    );
}
