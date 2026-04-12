// Types Supabase générés — correspondance directe avec les tables
export interface Database {
  public: {
    Tables: {
      seo_page_data: {
        Row: SeoPageData;
        Insert: Partial<SeoPageData>;
        Update: Partial<SeoPageData>;
      };
      commune_seo_context: {
        Row: CommuneSeoContext;
        Insert: Partial<CommuneSeoContext>;
        Update: Partial<CommuneSeoContext>;
      };
      address_profile: {
        Row: AddressProfile;
        Insert: Partial<AddressProfile>;
        Update: Partial<AddressProfile>;
      };
    };
  };
}

export interface SeoPageData {
  id: number;
  ban_id: string;
  numero: string;
  nom_voie: string;
  code_postal: string;
  nom_commune: string;
  code_commune: string;
  code_departement: string;
  latitude: number;
  longitude: number;
  code_iris: string | null;
  nom_iris: string | null;

  // IRIS socio-démo
  iris_population: number | null;
  iris_revenu_median: number | null;
  iris_taux_pauvrete: number | null;
  iris_taux_chomage: number | null;
  iris_part_0_14: number | null;
  iris_part_15_29: number | null;
  iris_part_30_44: number | null;
  iris_part_60_plus: number | null;
  iris_nb_residences_principales: number | null;

  // DVF
  dvf_dernier_prix: number | null;
  dvf_derniere_date: string | null;
  dvf_dernier_type: string | null;
  dvf_derniere_surface: string | null;
  dvf_dernier_nb_pieces: number | null;
  dvf_dernier_terrain: string | null;
  dvf_prix_m2: string | null;
  dvf_nb_transactions_iris: number | null;
  dvf_prix_m2_median_iris: string | null;
  dvf_prix_m2_p25_iris: string | null;
  dvf_prix_m2_p75_iris: string | null;

  // DPE
  dpe_classe_energie: string | null;
  dpe_classe_ges: string | null;
  dpe_conso_m2: number | null;
  dpe_surface: number | null;
  dpe_date: string | null;
  dpe_type_batiment: string | null;
  dpe_pct_ab_iris: string | null;
  dpe_pct_cd_iris: string | null;
  dpe_pct_efg_iris: string | null;

  // BPE
  bpe_score_global: string | null;
  bpe_score_sante: string | null;
  bpe_score_education: string | null;
  bpe_score_commerce: string | null;
  bpe_score_transport: string | null;
  bpe_score_loisirs: string | null;
  bpe_nb_equipements: number | null;

  // Scores
  score_potentiel_dpe: string | null;
  score_liquidite_marche: string | null;
  score_tension_prix: string | null;

  // Commune
  commune_population: number | null;
  commune_evolution_pop: string | null;
  commune_densite: string | null;
  commune_age_moyen: string | null;
  commune_nb_entreprises: number | null;
  commune_risque_inondation: boolean | null;
  commune_risque_argile: boolean | null;
  commune_risque_seisme: number | null;
  commune_nb_catnat: number | null;
  commune_zone_climatique: string | null;
  commune_dju_chauffage: number | null;
  commune_wiki_summary: string | null;
  commune_wiki_url: string | null;

  // Estimation
  estimation_prix: string | null;
  estimation_prix_m2: string | null;
  estimation_prix_bas: string | null;
  estimation_prix_haut: string | null;
  estimation_methode: string | null;

  // Rénovation
  reno_cible_classe: string | null;
  reno_cout_estime: number | null;
  reno_aides_estimees: number | null;
  reno_reste_charge: number | null;
  reno_plus_value_pct: number | null;

  // SEO
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  page_generated_at: string | null;
  data_freshness_at: string | null;
  comparables: any | null;
  poi_proches: any | null;
}

export interface CommuneSeoContext {
  code_commune: string;
  nom: string;
  departement: string;
  region: string;
  latitude: number;
  longitude: number;
  population: number;
  evolution_pop_5ans_pct: number | null;
  densite_hab_km2: number | null;
  age_moyen: number | null;
  revenu_median: number | null;
  taux_pauvrete: number | null;
  nb_entreprises: number | null;
  risque_inondation: string | null;
  risque_argile: string | null;
  risque_seisme: number | null;
  nb_catnat: number | null;
  zone_climatique: string | null;
  temperature_moy_annuelle: number | null;
  ensoleillement_h_an: number | null;
  wiki_summary: string | null;
  wiki_url: string | null;
  wiki_image_url: string | null;
  score_poi_global: number | null;
  nb_equipements_total: number | null;
}

export interface AddressProfile {
  ban_id: string;
  numero: string;
  nom_voie: string;
  code_postal: string;
  nom_commune: string;
  code_commune: string;
  dvf_nb_mutations: number;
  dvf_prix_m2_median: string | null;
  dvf_prix_m2_trend_1y: string | null;
  dpe_nb_bilans: number;
  dpe_etiquette_modale: string | null;
  dpe_cep_median: string | null;
  bpe_score_global: string | null;
  bpe_nb_equipements: number | null;
  score_potentiel_dpe: string | null;
  score_liquidite_marche: string | null;
  score_tension_prix: string | null;
}

// Helpers
export type DpeClasse = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export const DPE_COLORS: Record<DpeClasse, string> = {
  A: "#009c5a",
  B: "#50b432",
  C: "#c8d100",
  D: "#f0e400",
  E: "#f5a623",
  F: "#e8601c",
  G: "#d62728",
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
