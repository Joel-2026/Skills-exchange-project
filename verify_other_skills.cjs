
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
    console.log('Checking for skills with category "Other" or "Others"...');

    // Check 'Other'
    const { data: otherSkills, error: e1 } = await supabase
        .from('skills')
        .select('id, title, provider_id, profiles(full_name)')
        .eq('category', 'Other');

    // Check 'Others' (in case of legacy data)
    const { data: othersSkills, error: e2 } = await supabase
        .from('skills')
        .select('id, title, provider_id, profiles(full_name)')
        .eq('category', 'Others');

    console.log(`Found ${otherSkills?.length || 0} skills with category 'Other':`);
    if (otherSkills) otherSkills.forEach(s => console.log(`- "${s.title}" by ${s.profiles?.full_name} (ID: ${s.provider_id})`));

    console.log(`Found ${othersSkills?.length || 0} skills with category 'Others':`);
    if (othersSkills) othersSkills.forEach(s => console.log(`- "${s.title}" by ${s.profiles?.full_name}`));

}

check();
