
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read .env file
const envPath = path.resolve(__dirname, '.env');
const envConfig = {};
try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envConfig[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.warn('Could not read .env file', e);
}

const url = envConfig.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = envConfig.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function cleanup() {
    console.log('Finding "dance" skill by "akshay"...');

    // 1. Find profile id for "akshay"
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('full_name', '%akshay%');

    if (profileError) {
        console.error('Error finding profile:', profileError);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.log('No profile found for "akshay".');
        return;
    }

    const akshayIds = profiles.map(p => p.id);
    console.log('Found profile IDs for akshay:', akshayIds);

    // 2. Find and delete the skill
    const { data: skills, error: skillError } = await supabase
        .from('skills')
        .select('id, title, provider_id')
        .ilike('title', 'dance')
        .in('provider_id', akshayIds);

    if (skillError) {
        console.error('Error finding skill:', skillError);
        return;
    }

    if (!skills || skills.length === 0) {
        console.log('No "dance" skill found for "akshay".');
        return;
    }

    console.log('Found skills to delete:', skills);

    for (const skill of skills) {
        // Authenticated delete might fail if we are not the user (RLS).
        // BUT, since we are using anon key, we are subject to RLS.
        // We might need to login as that user OR rely on our global delete policy (if we had one for skills).
        // Let's try to delete. If it fails, I might need the user to run SQL.

        const { error: deleteError } = await supabase
            .from('skills')
            .delete()
            .eq('id', skill.id);

        if (deleteError) {
            console.error(`Failed to delete skill ${skill.id}:`, deleteError.message);
            console.log('Attempting to use SQL file approach if this fails...');
        } else {
            console.log(`Successfully deleted skill ${skill.id}`);
        }
    }
}

cleanup();
