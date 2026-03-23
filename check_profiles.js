import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
    // We can just fetch one profile to see the keys
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    console.log(error || (data && data.length > 0 ? Object.keys(data[0]) : 'No profiles found'));
}
checkSchema();
