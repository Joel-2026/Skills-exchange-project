
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

const url = envConfig.VITE_SUPABASE_URL;
const key = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function check() {
    console.log('Checking for "dance" skill by "akshay"...');

    const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .ilike('full_name', '%akshay%');

    if (!profiles || profiles.length === 0) {
        console.log('No profile found for akshay');
        return;
    }

    const akshayIds = profiles.map(p => p.id);

    const { data: skills, error } = await supabase
        .from('skills')
        .select('*')
        .ilike('title', 'dance')
        .in('provider_id', akshayIds);

    if (skills && skills.length > 0) {
        console.log('⚠️ Skill STILL EXISTS:', skills.length, 'record(s) found.');
        skills.forEach(s => console.log(`- ID: ${s.id}, Title: ${s.title}`));
    } else {
        console.log('✅ Skill NOT found (it might be deleted).');
    }
}

check();
