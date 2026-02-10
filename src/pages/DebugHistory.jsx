
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function DebugHistory() {
    const [logs, setLogs] = useState([]);
    const [user, setUser] = useState(null);

    function addLog(msg, data = null) {
        setLogs(prev => [...prev, { msg, data }]);
        console.log(msg, data);
    }

    useEffect(() => {
        runDebug();
    }, []);

    async function runDebug() {
        addLog("Starting Debug...");
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            addLog("Auth Error or No User", authError);
            return;
        }
        setUser(user);
        addLog("User Found", user.id);

        // 1. Check Requests Table count
        const { count, error: countError } = await supabase
            .from('requests')
            .select('*', { count: 'exact', head: true });

        addLog("Total Requests in DB (visible to user)", count);
        if (countError) addLog("Count Error", countError);

        // 2. Check Completed Requests for User
        const { data: completed, error: compError } = await supabase
            .from('requests')
            .select('*')
            .eq('status', 'completed')
            .or(`provider_id.eq.${user.id},learner_id.eq.${user.id}`);

        addLog("Completed Requests for User", completed);
        if (compError) addLog("Completed Fetch Error", compError);

        // 3. Check All Requests for User
        const { data: allRequests, error: allError } = await supabase
            .from('requests')
            .select('*')
            .or(`provider_id.eq.${user.id},learner_id.eq.${user.id}`);

        addLog("All Requests for User", allRequests);
        if (allError) addLog("All Fetch Error", allError);

        // 4. Check Group Sessions
        const { data: groups, error: groupError } = await supabase
            .from('group_sessions')
            .select('*')
            .eq('provider_id', user.id)
            .eq('status', 'completed');

        addLog("Completed Group Sessions hosted by User", groups);
    }

    return (
        <div className="p-10">
            <h1 className="text-2xl font-bold mb-4">Debug History</h1>
            <button onClick={runDebug} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">Run Again</button>
            <div className="bg-gray-100 p-4 rounded overflow-auto h-96 font-mono text-sm">
                {logs.map((log, i) => (
                    <div key={i} className="mb-2">
                        <div className="font-bold text-blue-600">{log.msg}</div>
                        {log.data && <pre>{JSON.stringify(log.data, null, 2)}</pre>}
                    </div>
                ))}
            </div>
        </div>
    );
}
