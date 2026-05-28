// ============================================
// KONFIGURASI SUPABASE - Ganti dengan milik Anda
// ============================================
const SUPABASE_URL = 'https://supabase.com/dashboard/project/ojsalzgxjoqrbkpusnby';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qc2Fsemd4am9xcmJrcHVzbmJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTIzNTksImV4cCI6MjA5NTUyODM1OX0.IfB4y4SK6uZCihl_KmZyF8fUcHu1RfbvxRPLD5um_RQ';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
