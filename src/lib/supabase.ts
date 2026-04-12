import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// ─── Adresse (page détail) ────────────────────────────────────────
export async function getAddressBySeo(
  cp: string,
  commune: string,
  voie: string,
  numero: string
) {
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

// ─── Commune (page ville) ─────────────────────────────────────────
export async function getCommuneStats(cp: string, commune: string) {
  const communeDecoded = commune.replace(/-/g, " ");
  const { data, error } = await supabase.rpc("get_commune_stats", {
    p_cp: cp,
    p_commune: communeDecoded,
  });
  if (error || !data) return null;
  return data as any;
}

export async function getCommuneVoies(cp: string, commune: string, limit = 50) {
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
  const communeDecoded = commune.replace(/-/g, " ");
  const voieDecoded = voie.replace(/-/g, " ");
  const { data, error } = await supabase.rpc("get_voie_stats", {
    p_cp: cp,
    p_commune: communeDecoded,
    p_voie: voieDecoded,
  });
  if (error || !data) return null;
  return data as any;
}

export async function getVoieAdresses(cp: string, commune: string, voie: string) {
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
