
import { createClient } from '@supabase/supabase-js';

const url = 'https://qrwdtnvlodmhtckaufyk.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyd2R0bnZsb2RtaHRja2F1ZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzk0NTQsImV4cCI6MjA4NTc1NTQ1NH0.--Ogzz_WT3mTzFtlTM1b0HrX45SeOYJ8xf5ZcdMjDUo';

const supabase = createClient(url, key);

async function run() {
    console.log('--- Verifying Storage ---');

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('Error listing buckets:', error);
    } else {
        console.log('Buckets found:', buckets.map(b => b.name));
        const avatarsBucket = buckets.find(b => b.name === 'avatars');
        if (avatarsBucket) {
            console.log('✅ "avatars" bucket exists.');
        } else {
            console.error('❌ "avatars" bucket NOT found.');
        }
    }
}

run();
