// Supabase Configuration
// Replace these with your actual Supabase project credentials from https://supabase.com

const FALLBACK_SUPABASE_URL = 'https://example.supabase.co';
const FALLBACK_SUPABASE_KEY = 'YOUR_SUPABASE_KEY';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const SUPABASE_KEY =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    FALLBACK_SUPABASE_KEY;

export const supabaseConfig = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_KEY,
};

const isPlaceholderValue = (value: string) => {
    const normalized = value.trim().toUpperCase();
    return normalized.includes('YOUR_SUPABASE_URL') || normalized.includes('YOUR_SUPABASE_KEY');
};

export const isSupabaseConfigured = () => {
    return Boolean(
        SUPABASE_URL &&
        SUPABASE_KEY &&
        !isPlaceholderValue(SUPABASE_URL) &&
        !isPlaceholderValue(SUPABASE_KEY) &&
        SUPABASE_URL !== FALLBACK_SUPABASE_URL
    );
};

// Instructions to get your credentials:
// 1. Go to https://supabase.com and create a free account
// 2. Create a new project (takes ~2 minutes to set up)
// 3. Go to Project Settings > API
// 4. Copy the "Project URL" and "anon public" key
// 5. Create a .env file in your project root and add:
//    VITE_SUPABASE_URL=your_project_url
//    VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
//    (Optional fallback) VITE_SUPABASE_ANON_KEY=your_anon_legacy_key
