import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env', 'utf-8');
const envStr = envFile.split('\n');
let supabaseUrl, supabaseAnonKey;
envStr.forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, verification_video_url, created_at')
        .eq('verification_status', 'pending');
        
    console.log("Error:", error);
    
    // Also let's check what columns ACTUALLY exist by fetching a row
    const { data: cols, error: err2 } = await supabase.from('profiles').select('*').limit(1);
    console.log("Profile columns:", cols && cols.length > 0 ? Object.keys(cols[0]) : "None");
}
testQuery();
