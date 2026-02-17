import { useEffect, useState, useRef } from 'react';

export default function CursorTrail() {
    const [trail, setTrail] = useState([]);
    const counterRef = useRef(0);

    useEffect(() => {
        const handleMouseMove = (e) => {
            counterRef.current += 1;
            const newDot = {
                x: e.clientX,
                y: e.clientY,
                id: `${Date.now()}-${counterRef.current}`,
            };

            setTrail((prevTrail) => {
                const updated = [...prevTrail, newDot];
                // Keep only last 5 dots for better performance
                return updated.slice(-5);
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="pointer-events-none fixed inset-0 z-50">
            {trail.map((dot, index) => (
                <div
                    key={dot.id}
                    className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 animate-ping"
                    style={{
                        left: `${dot.x}px`,
                        top: `${dot.y}px`,
                        transform: 'translate(-50%, -50%)',
                        opacity: (index + 1) / trail.length * 0.5,
                        animationDuration: '0.6s',
                    }}
                />
            ))}
        </div>
    );
}
