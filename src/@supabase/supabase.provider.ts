// src/supabase/supabase.provider.ts
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

export const SupabaseProvider = {
  provide: SUPABASE_CLIENT,
  useFactory: () => {
    return createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        realtime: {
          transport: WebSocket as any,
        },
      },
    );
  },
};