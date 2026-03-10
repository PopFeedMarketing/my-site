import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ynpbswkcusbualvvgmef.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucGJzd2tjdXNidWFsdnZnbWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzk1NzQsImV4cCI6MjA4ODc1NTU3NH0.0uyocSckPbxd9a2gnzTv1gih9e6YZf6TwFo9FC_d40w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);