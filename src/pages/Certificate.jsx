import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Award, ShieldCheck, Share2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Certificate() {
    const { id } = useParams();
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchCertificate() {
            setLoading(true);
            const { data, error } = await supabase
                .from('certificates')
                .select(`
                    *,
                    skills (title),
                    learner:learner_id (full_name),
                    provider:provider_id (full_name, avatar_url)
                `)
                .eq('id', id)
                .single();

            if (error) {
                setError('Certificate not found.');
            } else {
                setCertificate(data);
            }
            setLoading(false);
        }

        if (id) fetchCertificate();
    }, [id]);

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    if (error) return <div className="flex justify-center items-center h-screen text-gray-500">{error}</div>;
    if (!certificate) return null;

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'My Skillify Certificate',
                text: `I just earned a certificate for ${certificate.skills.title} on Skillify!`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4 print:p-0 print:bg-white">
            <div className="relative bg-white text-gray-900 w-full max-w-5xl aspect-[1.4] p-2 md:p-8 shadow-2xl overflow-hidden print:shadow-none print:w-full">

                {/* Premium Border - Gold Gradient */}
                <div className="absolute inset-0 border-[16px] border-double border-yellow-600/30 m-4 pointer-events-none z-20"></div>
                <div className="absolute inset-0 border-[2px] border-yellow-700/50 m-7 pointer-events-none z-20"></div>

                {/* Background Pattern */}
                <div className="absolute inset-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>

                {/* Corner Decorations */}
                <div className="absolute top-8 left-8 w-24 h-24 border-t-4 border-l-4 border-yellow-600 z-20"></div>
                <div className="absolute top-8 right-8 w-24 h-24 border-t-4 border-r-4 border-yellow-600 z-20"></div>
                <div className="absolute bottom-8 left-8 w-24 h-24 border-b-4 border-l-4 border-yellow-600 z-20"></div>
                <div className="absolute bottom-8 right-8 w-24 h-24 border-b-4 border-r-4 border-yellow-600 z-20"></div>

                <div className="relative z-10 h-full flex flex-col items-center justify-between py-12 px-8">

                    {/* Header */}
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            {/* Logo / Icon */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-20 rounded-full"></div>
                                <Award className="h-20 w-20 text-yellow-600 relative z-10" />
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-serif font-bold text-gray-900 tracking-wider uppercase mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                            Certificate of Completion
                        </h1>
                        <div className="h-1 w-32 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mt-4"></div>
                        <p className="text-lg md:text-xl text-gray-500 uppercase tracking-[0.2em] mt-4 font-light">This is to certify that</p>
                    </div>

                    {/* Recipient Name */}
                    <div className="text-center my-8 w-full">
                        <h2 className="text-4xl md:text-7xl font-serif text-gray-900 italic font-medium px-4 py-2" style={{ fontFamily: 'Pinyon Script, cursive, serif' }}>
                            {certificate.learner_name || certificate.learner.full_name}
                        </h2>
                        <div className="h-px w-2/3 bg-gray-300 mx-auto mt-2"></div>
                    </div>

                    {/* Body Text */}
                    <div className="text-center max-w-3xl mx-auto">
                        <p className="text-xl md:text-2xl text-gray-600 font-light mb-4">
                            has successfully completed the comprehensive training and practical session for
                        </p>
                        <h3 className="text-3xl md:text-5xl font-serif font-bold text-indigo-900 mb-6 uppercase tracking-wide">
                            {certificate.skills.title}
                        </h3>
                        <p className="text-gray-500 italic">
                            Demonstrating exceptional dedication and proficiency in the subject matter.
                        </p>
                    </div>

                    {/* Footer / Signatures */}
                    <div className="w-full grid grid-cols-3 gap-8 items-end mt-12 px-4 md:px-16">
                        {/* Instructor Signature */}
                        <div className="text-center">
                            <div className="font-handwriting text-2xl text-indigo-800 mb-2 transform -rotate-2">
                                {certificate.provider.full_name}
                            </div>
                            <div className="h-px w-full bg-gray-800 mb-2"></div>
                            <p className="text-sm font-bold uppercase tracking-wider text-gray-600">Instructor</p>
                        </div>

                        {/* Seal */}
                        <div className="flex flex-col items-center justify-center">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                {/* Seal Background */}
                                <div className="absolute inset-0 bg-yellow-500 rounded-full opacity-10"></div>
                                <div className="absolute inset-2 border-2 border-yellow-600 border-dashed rounded-full"></div>
                                <ShieldCheck className="h-16 w-16 text-yellow-700 relative z-10" strokeWidth={1.5} />

                                {/* Curved Text Simulation (Simplified) */}
                                <div className="absolute -bottom-4 text-[10px] font-bold tracking-widest uppercase text-yellow-800 bg-white px-2">
                                    Official Verified
                                </div>
                            </div>
                            <p className="font-bold text-indigo-900 text-lg mt-2 tracking-widest uppercase">Skillify</p>
                        </div>

                        {/* Date */}
                        <div className="text-center">
                            <p className="text-xl font-medium mb-2">{format(new Date(certificate.issued_at), 'MMMM d, yyyy')}</p>
                            <div className="h-px w-full bg-gray-800 mb-2"></div>
                            <p className="text-sm font-bold uppercase tracking-wider text-gray-600">Date Issued</p>
                        </div>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-gray-400 font-mono">
                        Certificate ID: <span className="text-gray-600">{certificate.id}</span> • Verify at {window.location.origin}/certificate/{certificate.id}
                    </div>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Pinyon+Script&display=swap');
                .font-handwriting { font-family: 'Pinyon Script', cursive; }
            `}</style>

            <div className="mt-8 flex space-x-4 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-full shadow hover:bg-indigo-700 transition"
                >
                    Download / Print
                </button>
                <button
                    onClick={handleShare}
                    className="flex items-center px-6 py-3 bg-white text-gray-700 rounded-full shadow hover:bg-gray-50 transition"
                >
                    <Share2 className="h-5 w-5 mr-2" /> Share
                </button>
                <Link
                    to="/dashboard"
                    className="flex items-center px-6 py-3 text-indigo-600 hover:text-indigo-800 transition"
                >
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
