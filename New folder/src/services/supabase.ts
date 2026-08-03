import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (url?: string, key?: string): SupabaseClient | null => {
  if (supabaseClient) return supabaseClient;
  
  const envUrl = url || (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = key || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    try {
      supabaseClient = createClient(envUrl, envKey);
      return supabaseClient;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return null;
};

export const initSupabaseConnection = (url: string, key: string): { success: boolean; client?: SupabaseClient; error?: string } => {
  try {
    const client = createClient(url, key);
    supabaseClient = client;
    return { success: true, client };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Invalid Supabase Configuration' };
  }
};
