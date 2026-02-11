
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qrwdtnvlodmhtckaufyk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyd2R0bnZsb2RtaHRja2F1ZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzk0NTQsImV4cCI6MjA4NTc1NTQ1NH0.--Ogzz_WT3mTzFtlTM1b0HrX45SeOYJ8xf5ZcdMjDUo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkForum() {
    console.log('Checking posts table...');

    // Try to select from posts
    const { data, error } = await supabase.from('posts').select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Error selecting from posts:', error);
        if (error.code === '42P01') { // undefined_table
            console.error('Table "posts" does not exist!');
        }
    } else {
        console.log('Posts table exists.');
    }

    // Try to insert a dummy post with random UUID
    const { error: insertError } = await supabase.from('posts').insert([{
        title: 'Test',
        body: 'Test',
        user_id: '00000000-0000-0000-0000-000000000000'
    }]);

    if (insertError) {
        console.log('Insert attempt result:', insertError.message);
    }
}

checkForum();
