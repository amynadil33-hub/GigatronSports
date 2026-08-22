import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bnvqvbkazdkbjrrtwahu.databasepad.com';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjA4NjRkYjRjLTI1NjEtNDBjMi05NzRhLWYwYzdlNTNlZjU0NSJ9.eyJwcm9qZWN0SWQiOiJibnZxdmJrYXpka2JqcnJ0d2FodSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg2MjExNjM1LCJleHAiOjIxMDE1NzE2MzUsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.5Mv--pYLpsBcki_KIQDXI-jnVllYb8aJa-CYuj0XINU';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };
