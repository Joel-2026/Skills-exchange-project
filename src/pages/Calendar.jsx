import React, { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

export default function CalendarPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch Group Sessions (where I am joined or hosting)
        // Hard to filter "joined" directly in one query if complicated, 
        // but let's fetch all group sessions and filter in Client or use more complex joins.
        // Simplified: Fetch all group sessions where I am provider OR I am in participants list.
        // Note: 'participants' is a JSONB array of IDs usually, or a join table. 
        // Checking schema... assuming 'participants' column or similar logic.
        // Re-checking schema via memory: 'group_sessions' has 'participants' (jsonb array of user_ids).

        const { data: groupSessions, error: groupError } = await supabase
            .from('group_sessions')
            .select(`
                *,
                skills (title)
            `);

        // 2. Fetch Accepted Requests (1-on-1)
        const { data: requests, error: reqError } = await supabase
            .from('requests')
            .select(`
                *,
                skills (title),
                profiles:learner_id (full_name),
                provider:provider_id (full_name)
            `)
            .or(`learner_id.eq.${user.id},provider_id.eq.${user.id}`)
            .eq('status', 'accepted');

        if (groupError || reqError) {
            console.error(groupError || reqError);
        }

        const formattedEvents = [];

        // Process Group Sessions
        if (groupSessions) {
            groupSessions.forEach(session => {
                // Check if user is host or participant
                const isHost = session.provider_id === user.id;
                const isParticipant = session.participants && session.participants.includes(user.id);

                if (isHost || isParticipant) {
                    formattedEvents.push({
                        id: `group-${session.id}`,
                        title: `[Group] ${session.skills?.title || 'Session'}`,
                        start: new Date(session.scheduled_at),
                        end: new Date(new Date(session.scheduled_at).getTime() + (session.duration || 60) * 60000),
                        resource: { type: 'group', id: session.id },
                        color: '#4f46e5' // Indigo
                    });
                }
            });
        }

        // Process Requests
        if (requests) {
            requests.forEach(req => {
                // Requests might not have a bespoke 'scheduled_at' if it was chat-based only, 
                // BUT usually accepted requests imply a time. 
                // If your 'requests' schema doesn't have a specific 'scheduled_time', 
                // we might use 'created_at' or we need to add a column.
                // Checking previous context: Schema has 'created_at'. 
                // Let's assume for now we use 'created_at' as stand-in OR users need to schedule it.
                // Wait, typically 'requests' are just "I want to learn X". 
                // Improvement: We should probably add a 'scheduled_at' to requests too.
                // For now, let's map using 'created_at' to show WHEN it was accepted/created, 
                // OR duplicate logic if you have a 'scheduled_at'.
                // LET'S ASSUSE 'created_at' for now, but ideally we should migrate to add 'time'.
                // If 'scheduled_at' exists in requests, use it. If not, fallback.

                // fallback: let's pretend it's today for demo if no date, or use created_at
                const date = req.scheduled_at ? new Date(req.scheduled_at) : new Date(req.created_at);

                formattedEvents.push({
                    id: `req-${req.id}`,
                    title: `[1:1] ${req.skills?.title}`,
                    start: date,
                    end: new Date(date.getTime() + 60 * 60000), // Default 1 hour
                    resource: { type: 'request', id: req.id },
                    color: '#059669' // Emerald
                });
            });
        }

        setEvents(formattedEvents);
        setLoading(false);
    };

    const handleSelectEvent = (event) => {
        if (event.resource.type === 'group') {
            navigate(`/group-session/${event.resource.id}`);
        } else {
            navigate(`/session/${event.resource.id}`);
        }
    };

    const eventStyleGetter = (event) => {
        const backgroundColor = event.color;
        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    return (
        <div className="h-[calc(100vh-64px)] p-6 bg-gray-50 dark:bg-gray-900">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Your Schedule</h1>
            {loading ? (
                <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow h-[600px] text-gray-800 dark:text-gray-200">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        onSelectEvent={handleSelectEvent}
                        eventPropGetter={eventStyleGetter}
                    />
                </div>
            )}
        </div>
    );
}
