// supabase-client.js - Supabase 클라이언트 초기화

import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config.js';

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

window.supabase = supabase;
