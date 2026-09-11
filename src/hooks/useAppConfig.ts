import { useEffect, useState } from 'react';
import { supabase, DEFAULT_CONFIG, type AppConfig } from '../lib/supabase';

let cached: AppConfig | null = null;
let inflight: Promise<AppConfig> | null = null;

async function load(): Promise<AppConfig> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    if (!supabase) return DEFAULT_CONFIG;
    const { data, error } = await supabase.from('app_config').select('key, value');
    if (error || !data) return DEFAULT_CONFIG;
    const cfg: AppConfig = { ...DEFAULT_CONFIG };
    for (const row of data as { key: string; value: unknown }[]) {
      if (row.key in cfg) (cfg as unknown as Record<string, unknown>)[row.key] = row.value;
    }
    cached = cfg;
    return cfg;
  })();
  return inflight;
}

/** Invalidate after an admin edit so the console reflects the new values immediately. */
export function invalidateAppConfig() { cached = null; inflight = null; }

/**
 * Remote flags/announcement, plus whether the server values have landed yet.
 *
 * `ready` matters for anything that gates content: acting on the defaults before
 * the real values arrive would flash a wall at a paying visitor, or briefly leak a
 * gated page. Cosmetic consumers can ignore it and use `useAppConfig()`.
 */
export function useAppConfigState(): { cfg: AppConfig; ready: boolean } {
  const [state, setState] = useState<{ cfg: AppConfig; ready: boolean }>(
    // A cache hit is already the server's answer, so treat it as ready.
    () => (cached ? { cfg: cached, ready: true } : { cfg: DEFAULT_CONFIG, ready: false }),
  );
  useEffect(() => {
    let alive = true;
    load().then((c) => { if (alive) setState({ cfg: c, ready: true }); });
    return () => { alive = false; };
  }, []);
  return state;
}

/** Remote flags/announcement. Resolves to defaults instantly, then to server values. */
export function useAppConfig(): AppConfig {
  return useAppConfigState().cfg;
}
