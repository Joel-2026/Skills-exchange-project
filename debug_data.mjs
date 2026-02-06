
import { createClient } from '@supabase/supabase-js';

const url = 'https://qrwdtnvlodmhtckaufyk.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyd2R0bnZsb2RtaHRja2F1ZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzk0NTQsImV4cCI6MjA4NTc1NTQ1NH0.--Ogzz_WT3mTzFtlTM1b0HrX45SeOYJ8xf5ZcdMjDUo';

const supabase = createClient(url, key);

async function run() {
    console.log('--- Debugging Data ---');

    // 1. Fetch Profiles
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) {
        console.error('Error fetching profiles:', pError);
        return;
    }

    console.log(`Found ${profiles.length} profiles.`);
    const akshay = profiles.find(p =>
        (p.full_name && p.full_name.toLowerCase().includes('akshay')) ||
        (p.email && p.email.includes('akshay')) // Note: email might not be in profiles depending on trigger
    );

    if (!akshay) {
        console.log('User "akshay" NOT FOUND in profiles table.');
        console.table(profiles.map(p => ({ id: p.id, name: p.full_name })));
        return;
    }

    console.log('Found Target User:', akshay.full_name, akshay.id);

    // 2. Fetch Requests for this user
    const { data: requests, error: rError } = await supabase
        .from('requests')
        .select('*')
        .or(`provider_id.eq.${akshay.id},learner_id.eq.${akshay.id}`);

    if (rError) {
        console.error('Error fetching requests:', rError);
        return;
    }

    console.log(`Found ${requests.length} requests for this user.`);
    if (requests.length > 0) {
        console.table(requests.map(r => ({
            id: r.id,
            skill: r.skill_id,
            status: r.status,
            provider: r.provider_id === akshay.id ? 'ME' : 'PARTNER',
            learner: r.learner_id === akshay.id ? 'ME' : 'PARTNER'
        })));
    } else {
        console.log('No requests found. This explains why the list is empty.');
    }
}

run();
