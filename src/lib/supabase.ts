import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Guard: during build-time page collection, env vars may be empty
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : (null as unknown as ReturnType<typeof createClient<Database>>);

// ─── Build-time guard ────────────────────────────────────────────
function isReady() { return !!supabaseUrl && !!supabaseAnonKey && !!supabase; }

// ─── Adresse (page détail) ────────────────────────────────────────
export async function getAddressBySeo(
  cp: string,
  commune: string,
  voie: string,
  numero: string
) {
  if (!isReady()) return null;
  const voieDecoded = voie.replace(/-/g, " ");
  const communeDecoded = commune.replace(/-/g, " ");

  const { data, error } = await supabase.rpc("get_address_by_seo", {
    p_cp: cp,
    p_commune: communeDecoded,
    p_voie: voieDecoded,
    p_numero: numero,
  });

  if (error || !data || data.length === 0) return null;
  return data[0];
}

// ─── Helper: parse scalar jsonb RPC result ───────────────────────
function parseJsonbResult(data: any): any {
  if (!data) return null;
  if (typeof data === "string") {
    try { return JSON.parse(data); } catch { return null; }
  }
  return data;
}

// ─── Commune (page ville) ─────────────────────────────────────────
export async function getCommuneStats(cp: string, commune: string) {
  if (!isReady()) return null;
  const communeDecoded = commune.replace(/-/g, " ");
  const { data, error } = await supabase.rpc("get_commune_stats", {
    p_cp: cp,
    p_commune: communeDecoded,
  });
  if (error) { console.error("[getCommuneStats] RPC error:", error.message); return null; }
  return parseJsonbResult(data);
}

export async function getCommuneVoies(cp: string, commune: string, limit = 50) {
  if (!isReady()) return [];
  const communeDecoded = commune.replace(/-/g, " ");
  const { data, error } = await supabase.rpc("get_commune_voies", {
    p_cp: cp,
    p_commune: communeDecoded,
    p_limit: limit,
  });
  if (error || !data) return [];
  return data as any[];
}

export async function getCommunesMemeDepartement(
  codeDepartement: string,
  excludeCommune: string,
  limit = 12
) {
  if (!isReady()) return [];
  const { data, error } = await supabase.rpc("get_communes_meme_departement", {
    p_code_departement: codeDepartement,
    p_exclude_commune: excludeCommune,
    p_limit: limit,
  });
  if (error || !data) return [];
  return data as any[];
}

// ─── Voie (page rue) ──────────────────────────────────────────────
export async function getVoieStats(cp: string, commune: string, voie: string) {
  if (!isReady()) return null;
  const communeDecoded = commune.replace(/-/g, " ");
  const voieDecoded = voie.replace(/-/g, " ");
  const { data, error } = await supabase.rpc("get_voie_stats", {
    p_cp: cp,
    p_commune: communeDecoded,
    p_voie: voieDecoded,
  });
  if (error) { console.error("[getVoieStats] RPC error:", error.message); return null; }
  return parseJsonbResult(data);
}

export async function getVoieAdresses(cp: string, commune: string, voie: string) {
  if (!isReady()) return [];
  const communeDecoded = commune.replace(/-/g, " ");
  const voieDecoded = voie.replace(/-/g, " ");
  const { data, error } = await supabase.rpc("get_voie_adresses", {
    p_cp: cp,
    p_commune: communeDecoded,
    p_voie: voieDecoded,
  });
  if (error || !data) return [];
  return data as any[];
}
// force redeploy - GRANT fix applied 1776014718
