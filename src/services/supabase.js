import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Initializing Supabase with:', {
    url: supabaseUrl ? supabaseUrl.substring(0, 10) + '...' : 'undefined',
    keyPresent: !!supabaseAnonKey
});

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase Environment Variables. Check .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const checkSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase.from('resumes').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log('Supabase connection successful');
        return true;
    } catch (err) {
        console.error('Supabase connection failed:', err);
        return false;
    }
};
