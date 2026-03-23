import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPending() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, verification_video_url, created_at')
        .eq('verification_status', 'pending');

    console.log("Data:", data);
    console.log("Error:", error);
}

checkPending();
