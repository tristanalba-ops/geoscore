import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Variables d'environnement — à configurer dans .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client côté serveur (SSR / ISR)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helpers pour les requêtes courantes
export async function getAddressBySeo(
  cp: string,
  commune: string,
  voie: string,
  numero: string
) {
  // Reconstruit le slug à partir des segments URL
  // URL: /33520/bruges/rue-du-colonel-rozanoff/15
  // On cherche par cp + commune + numero + voie (ILIKE)
  const voieDecoded = voie.replace(/-/g, " ");

  const { data, error } = await supabase
    .from("seo_page_data")
    .select("*")
    .eq("code_postal", cp)
    .ilike("nom_commune", commune.replace(/-/g, " "))
    .eq("numero", numero)
    .ilike("nom_voie", `%${voieDecoded}%`)
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

export async function getVillePage(cp: string, commune: string) {
  const communeDecoded = commune.replace(/-/g, " ");

  // Commune context
  const { data: communeData } = await supabase
    .from("commune_seo_context")
    .select("*")
    .eq("code_commune", cp.substring(0, 2) + "%") // Approximation — on match par nom
    .ilike("nom", communeDecoded)
    .limit(1)
    .single();

  // Stats agrégées pour la commune
  const { data: addresses, count } = await supabase
    .from("seo_page_data")
    .select("*", { count: "exact", head: false })
    .eq("code_postal", cp)
    .ilike("nom_commune", communeDecoded)
    .order("dvf_prix_m2_median_iris", { ascending: false, nullsFirst: false })
    .limit(20);

  return { commune: communeData, addresses, totalAddresses: count };
}

export async function getVoiePage(cp: string, commune: string, voie: string) {
  const voieDecoded = voie.replace(/-/g, " ");
  const communeDecoded = commune.replace(/-/g, " ");

  const { data, count } = await supabase
    .from("seo_page_data")
    .select("*", { count: "exact" })
    .eq("code_postal", cp)
    .ilike("nom_commune", communeDecoded)
    .ilike("nom_voie", `%${voieDecoded}%`)
    .order("numero", { ascending: true })
    .limit(100);

  return { addresses: data, totalAddresses: count };
}
