import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Send, Paperclip, Video, PhoneOff, LogOut } from 'lucide-react';
import IssueCertificateModal from '../components/IssueCertificateModal';
import EndSessionModal from '../components/EndSessionModal';

export default function SessionRoom() {
    const { requestId, sessionId } = useParams(); // sessionId is for group sessions
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'video'; // 'video' or 'chat'

    const [session, setSession] = useState(null); // Can be request data OR group session data
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef(null);

    // Modals
    const [showEndSessionModal, setShowEndSessionModal] = useState(false);
    const [showCertificateModal, setShowCertificateModal] = useState(false);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState(null); // { x, y, messageId, isMe }

    const isGroupSession = !!sessionId;
    const currentId = sessionId || requestId;

    // ... (Use existing effects) ...

    // 1. Fetch User & Session Details
    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            let data, error;

            if (isGroupSession) {
                // Fetch Group Session Details
                const { data: groupData, error: groupError } = await supabase
                    .from('group_sessions')
                    .select('*, skills(title, profiles(full_name)), provider:profiles(full_name)')
                    .eq('id', sessionId)
                    .single();
                data = groupData;
                error = groupError;
            } else {
                // Fetch Request Details (One-on-One)
                const { data: reqData, error: reqError } = await supabase
                    .from('requests')
                    .select(`*, skills(*, profiles(full_name)), profiles:learner_id(full_name)`)
                    .eq('id', requestId)
                    .single();
                data = reqData;
                error = reqError;
            }

            if (error || !data) {
                console.error('Session load error:', error);
                alert('Session not found or access denied.');
                navigate('/dashboard');
            } else {
                setSession(data);
            }
            setLoading(false);
        }
        loadData();
    }, [requestId, sessionId, isGroupSession, navigate]);

    // 3. Notify Partner on Join (with debounce check)
    useEffect(() => {
        if (!user || !session) return;

        const notifyPartner = async () => {
            // Determine partner ID
            const partnerId = isGroupSession
                ? session.provider_id
                : (user.id === session.learner_id ? session.skills?.provider_id : session.learner_id);

            // Don't notify yourself
            if (user.id === partnerId) return;

            // Check if we already notified them recently (last 5 mins)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

            const { data: recentNotifs } = await supabase
                .from('notifications')
                .select('id')
                .eq('user_id', partnerId)
                .ilike('message', `%${user.user_metadata?.full_name || 'User'} has started the session%`)
                .gt('created_at', fiveMinutesAgo);

            if (recentNotifs && recentNotifs.length > 0) {
                console.log('Notification already sent recently.');
                return;
            }

            // Send Notification
            // Check if partner is trying to join or just notify them to join
            const message = `${user.user_metadata?.full_name || 'Your partner'} has started the session for ${session.skills?.title || 'Class'}. Join now!`;

            const { error } = await supabase
                .from('notifications')
                .insert([{
                    user_id: partnerId,
                    message: message,
                    link: window.location.pathname + window.location.search,
                    is_read: false
                }]);

            if (error) console.error('Error sending notification:', error);
            else console.log('Partner notified.');
        };

        notifyPartner();
    }, [user, session, isGroupSession]);

    // 2. Fetch Initial Messages & Subscribe to Realtime
    useEffect(() => {
        if (!currentId) return;

        let query = supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true });

        if (isGroupSession) {
            query = query.eq('group_session_id', sessionId);
        } else {
            query = query.eq('request_id', requestId);
        }

        // Fetch history
        query.then(({ data }) => {
            if (data) setMessages(data);
        });

        // Realtime Subscription
        const filter = isGroupSession ? `group_session_id=eq.${sessionId}` : `request_id=eq.${requestId}`;
        const channel = supabase
            .channel(`room-${currentId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages', filter: filter },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setMessages((current) => [...current, payload.new]);
                    } else if (payload.eventType === 'UPDATE') {
                        setMessages((current) => current.map(msg => msg.id === payload.new.id ? payload.new : msg));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [requestId, sessionId, isGroupSession, currentId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Close context menu on click outside
    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msgData = {
            user_id: user.id,
            content: newMessage
        };

        if (isGroupSession) {
            msgData.group_session_id = sessionId;
        } else {
            msgData.request_id = requestId;
        }

        const { error } = await supabase.from('messages').insert(msgData);

        if (error) console.error(error);
        else setNewMessage('');
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const fileName = `${currentId}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
            .from('chat-attachments')
            .upload(fileName, file);

        if (uploadError) {
            alert('Upload failed');
            setUploading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(fileName);

        // Send message with media
        const msgData = {
            user_id: user.id,
            content: 'Shared a file',
            media_url: publicUrl
        };

        if (isGroupSession) {
            msgData.group_session_id = sessionId;
        } else {
            msgData.request_id = requestId;
        }

        await supabase.from('messages').insert(msgData);

        setUploading(false);
    };

    const handleRightClick = (e, message) => {
        const isMe = message.user_id === user?.id;
        if (!isMe && message.deleted_by?.includes(user?.id)) return; // Already deleted

        e.preventDefault();
        setContextMenu({
            x: e.pageX,
            y: e.pageY,
            messageId: message.id,
            isMe
        });
    };

    const deleteMessage = async (type) => {
        if (!contextMenu) return;

        if (type === 'everyone') {
            await supabase
                .from('messages')
                .update({ is_deleted: true })
                .eq('id', contextMenu.messageId);
        } else if (type === 'me') {
            const { data } = await supabase.from('messages').select('deleted_by').eq('id', contextMenu.messageId).single();
            const currentDeletedBy = data?.deleted_by || [];
            if (!currentDeletedBy.includes(user.id)) {
                await supabase
                    .from('messages')
                    .update({ deleted_by: [...currentDeletedBy, user.id] })
                    .eq('id', contextMenu.messageId);
            }
        }
        setContextMenu(null);
    };

    // Modified to show modal first
    const handleEndSessionClick = () => {
        setShowEndSessionModal(true);
    };

    const handleConfirmEndSession = async (shouldIssueCertificate) => {
        setShowEndSessionModal(false);
        if (shouldIssueCertificate) {
            setShowCertificateModal(true);
        } else {
            await completeSession();
        }
    };

    const completeSession = async () => {
        try {
            if (isGroupSession) {
                // Update group session status
                const { error: sessionError } = await supabase
                    .from('group_sessions')
                    .update({ status: 'completed' })
                    .eq('id', sessionId);

                if (sessionError) throw sessionError;

                // Update all requests associated with this session to completed
                const { error: reqError } = await supabase
                    .from('requests')
                    .update({ status: 'completed' })
                    .eq('group_session_id', sessionId);

                if (reqError) throw reqError;

            } else {
                // Update 1-on-1 request status
                const { error } = await supabase
                    .from('requests')
                    .update({ status: 'completed' })
                    .eq('id', requestId);

                if (error) throw error;
            }

            // alert('Session ended successfully.'); // Optional
            navigate(isGroupSession ? '/group-sessions' : '/dashboard');
        } catch (error) {
            console.error('Error ending session:', error);
            alert('Failed to end session');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Connecting to session...</div>;

    // Use Jitsi Meet via iFrame
    const jitsiRoomName = `skill-exchange-${currentId}`;

    // Determine title and subtitle based on session type
    const sessionTitle = session?.skills?.title || 'Session';
    const partnerId = isGroupSession
        ? session?.provider_id
        : (user?.id === session?.learner_id ? session?.skills?.provider_id : session?.learner_id);

    const partnerName = isGroupSession
        ? session?.provider?.full_name
        : (user?.id === session?.learner_id ? session?.skills?.profiles?.full_name : session?.profiles?.full_name);

    const isProvider = user?.id === session?.provider_id;

    // Prepare request object for certificate modal (needs skill info and learner info)
    const certificateRequestData = isGroupSession ? null : {
        ...session,
        // Ensure structure matches what IssueCertificateModal expects
        skills: session?.skills,
        learner_id: session?.learner_id,
        provider_id: session?.provider_id
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100">
            {contextMenu && (
                <div
                    className="absolute bg-white shadow-lg rounded border border-gray-200 py-1 z-50 text-sm"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button
                        onClick={() => deleteMessage('me')}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                    >
                        Delete for me
                    </button>
                    {contextMenu.isMe && (
                        <button
                            onClick={() => deleteMessage('everyone')}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                        >
                            Delete for everyone
                        </button>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">
                        {mode === 'chat' ? 'Chat: ' : 'Class: '}{sessionTitle}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {isGroupSession ? 'Hosted by ' : 'with '}
                        <Link to={`/profile/${partnerId}`} className="hover:underline hover:text-indigo-600">
                            {partnerName}
                        </Link>
                    </p>
                </div>
                <div className="flex space-x-2">
                    {mode === 'chat' && (
                        <button
                            onClick={() => navigate(isGroupSession ? `/group-session/${sessionId}?mode=video` : `/session/${requestId}?mode=video`)}
                            className="flex items-center px-3 py-2 bg-orange-50 text-orange-600 rounded-md hover:bg-orange-100 text-sm font-medium"
                        >
                            <Video className="w-4 h-4 mr-2" />
                            Switch to Video
                        </button>
                    )}
                    {mode === 'video' && (
                        <button
                            onClick={() => navigate(isGroupSession ? `/group-session/${sessionId}?mode=chat` : `/session/${requestId}?mode=chat`)}
                            className="flex items-center px-3 py-2 bg-orange-50 text-orange-600 rounded-md hover:bg-orange-100 text-sm font-medium"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Switch to Chat
                        </button>
                    )}

                    {isProvider ? (
                        <button
                            onClick={handleEndSessionClick}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                        >
                            <PhoneOff className="w-4 h-4 mr-2" />
                            End Session
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate(isGroupSession ? '/group-sessions' : '/dashboard')}
                            className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 text-sm font-medium"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Exit
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left: Video Call Area (Jitsi) - Only show in video mode */}
                {mode === 'video' && (
                    <div className="flex-1 bg-black relative">
                        <iframe
                            src={`https://meet.jit.si/${jitsiRoomName}?config.startWithAudioMuted=true&config.startWithVideoMuted=true`}
                            allow="camera; microphone; fullscreen; display-capture"
                            className="w-full h-full border-0"
                            title="Video Call"
                        ></iframe>
                        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs pointer-events-none">
                            Powered by Jitsi
                        </div>
                    </div>
                )}

                {/* Right: Chat Area */}
                <div className={`${mode === 'chat' ? 'w-full max-w-3xl mx-auto border-x' : 'w-full md:w-96 border-l'} bg-white flex flex-col`}>
                    {/* Message List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.length === 0 && (
                            <p className="text-center text-gray-400 text-sm mt-10">No messages yet. Say hello!</p>
                        )}
                        {messages.map((msg) => {
                            const isMe = msg.user_id === user?.id;
                            const isDeletedForEveryone = msg.is_deleted;
                            const isDeletedForMe = msg.deleted_by?.includes(user?.id);

                            if (isDeletedForMe) return null; // Don't show at all

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    onContextMenu={(e) => handleRightClick(e, msg)}
                                >
                                    <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm shadow-sm ${isMe ? 'btn-primary text-white' : 'bg-white text-gray-800 border'
                                        } relative group cursor-pointer`}>

                                        {isDeletedForEveryone ? (
                                            <p className="italic opacity-50 flex items-center">
                                                <span className="block w-4 h-4 mr-1 border-2 border-current rounded-full rotate-45 border-t-transparent" />
                                                This message was deleted
                                            </p>
                                        ) : (
                                            <>
                                                {msg.media_url ? (
                                                    <div className="mb-1">
                                                        <img src={msg.media_url} alt="Attachment" className="max-h-40 rounded bg-black/10" />
                                                    </div>
                                                ) : null}
                                                <p>{msg.content}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-200">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <label className="cursor-pointer flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                                <Paperclip className="w-5 h-5" />
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept="image/*"
                                    disabled={uploading}
                                />
                            </label>
                            <input
                                type="text"
                                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="btn-primary text-white p-2 rounded-full hover:opacity-90 disabled:opacity-50 transition"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                        {uploading && <p className="text-xs text-center text-gray-500 mt-1">Uploading...</p>}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <EndSessionModal
                isOpen={showEndSessionModal}
                onClose={() => setShowEndSessionModal(false)}
                onConfirm={handleConfirmEndSession}
                learnerName={partnerName}
            />

            {!isGroupSession && (
                <IssueCertificateModal
                    isOpen={showCertificateModal}
                    onClose={() => setShowCertificateModal(false)}
                    request={certificateRequestData}
                    onSuccess={() => {
                        // After certificate, we are done
                        navigate('/dashboard');
                    }}
                />
            )}
        </div>
    );
}
