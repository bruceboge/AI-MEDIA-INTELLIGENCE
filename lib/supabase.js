/**
 * Supabase Client & Persistence Utility (ES Module)
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase = null;
let isConnected = false;

if (SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('http')) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { autoRefreshToken: true, persistSession: false }
    });
    isConnected = true;
  } catch (err) {
    console.warn('[SUPABASE] Connection warning:', err.message);
  }
}

const localSessions = new Map();

export function getStatus() {
  return {
    configured: Boolean(SUPABASE_URL && SUPABASE_KEY),
    connected: isConnected,
    mode: isConnected ? 'cloud_supabase' : 'local_storage'
  };
}

export async function signUp(email, password, organizationName = '') {
  if (!isConnected) {
    return { success: true, user: { id: 'local_' + Date.now(), email, organizationName } };
  }
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { organization_name: organizationName } }
    });
    if (error) throw error;
    return { success: true, user: data.user, session: data.session };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function signIn(email, password) {
  if (!isConnected) {
    return { success: true, user: { id: 'local_active', email } };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { success: true, user: data.user, session: data.session };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function createSession(userId, queryText, category = 'all') {
  const sessionId = 'sess_' + Date.now();
  const record = { id: sessionId, user_id: userId || 'anon', query_text: queryText, category, created_at: new Date().toISOString() };
  if (!isConnected) {
    localSessions.set(sessionId, record);
    return { success: true, session: record };
  }
  try {
    const { data, error } = await supabase.from('analysis_sessions').insert([record]).select().single();
    if (error) throw error;
    return { success: true, session: data };
  } catch (err) {
    localSessions.set(sessionId, record);
    return { success: true, session: record };
  }
}

export async function clearSession(sessionId) {
  if (!sessionId) {
    localSessions.clear();
    return { success: true };
  }
  localSessions.delete(sessionId);
  if (isConnected) {
    try {
      await supabase.from('analysis_sessions').update({ status: 'archived' }).eq('id', sessionId);
    } catch (e) {}
  }
  return { success: true };
}
