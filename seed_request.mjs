
import { createClient } from '@supabase/supabase-js';

const url = 'https://qrwdtnvlodmhtckaufyk.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyd2R0bnZsb2RtaHRja2F1ZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzk0NTQsImV4cCI6MjA4NTc1NTQ1NH0.--Ogzz_WT3mTzFtlTM1b0HrX45SeOYJ8xf5ZcdMjDUo';

const supabase = createClient(url, key);

async function run() {
    console.log('--- Seeding Data ---');

    // 1. Fetch Users
    const { data: profiles } = await supabase.from('profiles').select('*');
    const akshay = profiles.find(p => p.full_name?.toLowerCase().includes('akshay'));
    const otherUser = profiles.find(p => p.id !== akshay?.id);

    if (!akshay || !otherUser) {
        console.error('Need at least two users (Akshay and one other) to seed a request.');
        return;
    }

    console.log(`Akshay: ${akshay.id}`);
    console.log(`Other: ${otherUser.id}`);

    // 2. Fetch a Skill (Assume otherUser has a skill, or Akshay has one)
    // Let's make Akshay the learner for this test so it shows in "My Bookings" effectively, 
    // but Ongoing shows both.
    const { data: skills } = await supabase.from('skills').select('*').limit(1);

    let skillId;
    if (skills.length > 0) {
        skillId = skills[0].id;
        console.log(`Using existing skill: ${skills[0].title} (${skillId})`);
    } else {
        // Create a dummy skill if none
        console.log('Creating dummy skill...');
        const { data: newSkill, error } = await supabase.from('skills').insert({
            provider_id: otherUser.id,
            title: 'Test Skill (Seeded)',
            category: 'Testing',
            mode: 'online',
            description: 'This is a test skill for debugging.'
        }).select().single();

        if (error) {
            console.error('Error creating skill:', error);
            return;
        }
        skillId = newSkill.id;
    }

    // 3. Create Accepted Request
    console.log('Creating accepted request...');
    const { data: req, error: reqError } = await supabase.from('requests').insert({
        skill_id: skillId,
        provider_id: otherUser.id, // Other is teacher
        learner_id: akshay.id,     // Akshay is learner
        status: 'accepted'
    }).select().single();

    if (reqError) console.error('Error seeding request:', reqError);
    else console.log('SUCCESS! Created request:', req.id);
}

run();
