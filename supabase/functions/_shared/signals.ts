// Shared runtime for the Monteiro Fabrics collectors (collect-gsc, collect-shopify, collect-sender).
//
// Each collector is a `step`: it does as much work as fits in its time budget and either finishes or
// returns `next` — the params for a continuation call. `serve` chains those calls (same run row), so a
// 16-month backfill runs to the end from one invocation without hitting the Edge Function wall clock.
//
// Calls are accepted only with the `x-signals-key` header that pg_cron sends (public.signals_invoke).
// Secrets come from Vault through public.signals_get_secret — nothing is read from env but the
// project URL and service-role key Supabase injects.

import { createClient } from 'jsr:@supabase/supabase-js@2';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
export const db = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

// Free plan wall clock is 150 s per invocation; stop taking new work well before it.
const BUDGET_MS = 100_000;

export type Params = Record<string, unknown>;
export type StepResult = { rows: number; details?: Record<string, unknown>; next?: Params };
export type Step = (params: Params, deadline: number) => Promise<StepResult>;

const secrets = new Map<string, string | null>();
export async function optionalSecret(name: string): Promise<string | null> {
  if (!secrets.has(name)) {
    const { data, error } = await db.rpc('signals_get_secret', { secret_name: name });
    if (error) throw new Error(`signals_get_secret(${name}): ${error.message}`);
    secrets.set(name, (data as string | null) || null);
  }
  return secrets.get(name)!;
}
export async function secret(name: string): Promise<string> {
  const v = await optionalSecret(name);
  if (!v) throw new Error(`Vault secret "${name}" is missing`);
  return v;
}

function sameKey(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function upsert(table: string, rows: Record<string, unknown>[], onConflict: string) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from(table).upsert(rows.slice(i, i + 500), { onConflict });
    if (error) throw new Error(`upsert ${table}: ${error.message}`);
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Numbers add up across continuation calls; anything else keeps the latest value.
function mergeDetails(a: Record<string, unknown>, b: Record<string, unknown> = {}) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    out[k] = typeof v === 'number' && typeof out[k] === 'number' ? (out[k] as number) + v : v;
  }
  return out;
}

export function serve(source: 'gsc' | 'shopify' | 'sender', fn: string, step: Step) {
  Deno.serve(async (req) => {
    if (req.method !== 'POST') return new Response('POST only', { status: 405 });
    if (!sameKey(req.headers.get('x-signals-key') ?? '', await secret('signals_cron_key'))) {
      return new Response('forbidden', { status: 401 });
    }
    const body = (await req.json().catch(() => ({}))) as Params;
    const { run_id, ...params } = body;

    let runId = run_id as number | undefined;
    if (!runId) {
      const { data, error } = await db.from('signals_collector_runs')
        .insert({ source, params }).select('id').single();
      if (error) return new Response(error.message, { status: 500 });
      runId = data.id;
    }

    const work = (async () => {
      const finish = async (patch: Record<string, unknown>) => {
        await db.from('signals_collector_runs').update(patch).eq('id', runId);
      };
      try {
        const res = await step(params, Date.now() + BUDGET_MS);
        const { data: prev } = await db.from('signals_collector_runs')
          .select('rows, details').eq('id', runId).single();
        const rows = (prev?.rows ?? 0) + res.rows;
        const details = mergeDetails(prev?.details ?? {}, { ...res.details, calls: 1 });
        if (res.next) {
          await finish({ rows, details });
          const r = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-signals-key': await secret('signals_cron_key') },
            body: JSON.stringify({ ...res.next, run_id: runId }),
          });
          if (r.status !== 202) throw new Error(`continuation call answered ${r.status}: ${await r.text()}`);
        } else {
          await finish({ rows, details, status: 'ok', finished_at: new Date().toISOString() });
        }
      } catch (e) {
        await finish({
          status: 'error',
          error: String((e as Error)?.stack ?? e).slice(0, 4000),
          finished_at: new Date().toISOString(),
        });
      }
    })();
    EdgeRuntime.waitUntil(work);
    return Response.json({ run_id: runId }, { status: 202 });
  });
}

// ── dates ──
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);
export function addDays(day: string, n: number) {
  const d = new Date(day + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return isoDay(d);
}
