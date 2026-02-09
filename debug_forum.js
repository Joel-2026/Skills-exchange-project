
import { createClient } from '@supabase/supabase-js';

const url = 'https://qrwdtnvlodmhtckaufyk.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyd2R0bnZsb2RtaHRja2F1ZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzk0NTQsImV4cCI6MjA4NTc1NTQ1NH0.--Ogzz_WT3mTzFtlTM1b0HrX45SeOYJ8xf5ZcdMjDUo';

const supabase = createClient(url, key);

async function run() {
    console.log('--- Debugging Forum ---');

    // 1. Fetch Profiles
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) console.error('Error fetching profiles:', pError);
    else console.log(`Found ${profiles.length} profiles.`);

    // 2. Fetch Posts
    const { data: posts, error: fError } = await supabase.from('posts').select('*');
    if (fError) {
        console.error('Error fetching posts:', fError);
    } else {
        console.log(`Found ${posts.length} posts.`);
        if (posts.length > 0) {
            console.table(posts.map(p => ({
                id: p.id,
                title: p.title,
                body: p.body ? p.body.substring(0, 50) + '...' : 'NULL',
                user_id: p.user_id
            })));
        }
    }
}

run();
