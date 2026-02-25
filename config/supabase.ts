
// Supabase Configuration
// Replace these with your actual Supabase project credentials from https://supabase.com

const FALLBACK_SUPABASE_URL = 'https://example.supabase.co';
const FALLBACK_SUPABASE_KEY = 'YOUR_SUPABASE_KEY';

// In Vite, variables must be prefixed with VITE_ to be exposed to the client
// We prioritize VITE_SUPABASE_ANON_KEY as it's the standard for Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;

const SUPABASE_KEY =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    FALLBACK_SUPABASE_KEY;

export const supabaseConfig = {
    url: SUPABASE_URL.trim(),
    anonKey: SUPABASE_KEY.trim(),
};

const isPlaceholderValue = (value: string) => {
    const normalized = value.trim().toUpperCase();
    return normalized.includes('YOUR_SUPABASE_URL') ||
        normalized.includes('YOUR_SUPABASE_KEY') ||
        normalized.includes('EXAMPLE.SUPABASE.CO');
};

export const isSupabaseConfigured = () => {
    const hasUrl = Boolean(SUPABASE_URL && !isPlaceholderValue(SUPABASE_URL) && SUPABASE_URL !== FALLBACK_SUPABASE_URL);
    const hasKey = Boolean(SUPABASE_KEY && !isPlaceholderValue(SUPABASE_KEY) && SUPABASE_KEY !== FALLBACK_SUPABASE_KEY);

    if (!hasUrl || !hasKey) {
        console.warn('Supabase configuration is incomplete:', { hasUrl, hasKey });
    }

    return hasUrl && hasKey;
};
