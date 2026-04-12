import { Metadata } from "next";
import { getVoiePage } from "@/lib/supabase";

interface Props {
  params: { cp: string; ville: string; voie: string };
}

export const revalidate = 86400;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const voie = params.voie.replace(/-/g, " ");
  const ville = params.ville.replace(/-/g, " ");
  const voieTitle = voie.charAt(0).toUpperCase() + voie.slice(1);
  const villeTitle = ville.charAt(0).toUpperCase() + ville.slice(1);

  return {
    title: `${voieTitle}, ${params.cp} ${villeTitle} — Prix et analyse`,
    description: `Tous les biens analysés sur ${voieTitle} à ${villeTitle} (${params.cp}). Prix, DPE, quartier, risques.`,
    alternates: {
      canonical: `/${params.cp}/${params.ville}/${params.voie}`,
    },
  };
}

export default async function VoiePage({ params }: Props) {
  const { addresses, totalAddresses } = await getVoiePage(
    params.cp,
    params.ville,
    params.voie
  );

  const voieName = params.voie
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const villeName = params.ville
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-geo-text2 mb-8">
        <a href="/" className="hover:text-geo-accent">
          Accueil
        </a>
        <span className="mx-2">›</span>
        <a
          href={`/${params.cp}/${params.ville}`}
          className="hover:text-geo-accent"
        >
          {villeName}
        </a>
        <span className="mx-2">›</span>
        <span className="text-geo-text">{voieName}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">{voieName}</h1>
      <p className="text-geo-text2 mb-8">
        {params.cp} {villeName} — {totalAddresses ?? 0} adresse
        {(totalAddresses ?? 0) > 1 ? "s" : ""} analysée
        {(totalAddresses ?? 0) > 1 ? "s" : ""}
      </p>

      {/* Liste numéros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses?.map((addr) => (
          <a
            key={addr.ban_id}
            href={`/${params.cp}/${params.ville}/${params.voie}/${addr.numero}`}
            className="bg-geo-surface border border-geo-border rounded-xl p-5 hover:border-geo-accent/40 transition group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-lg font-bold group-hover:text-geo-accent transition">
                  N°{addr.numero}
                </span>
                {addr.dvf_dernier_type && (
                  <span className="text-geo-text2 ml-2 text-sm">
                    {addr.dvf_dernier_type}
                    {addr.dvf_derniere_surface
                      ? ` · ${addr.dvf_derniere_surface} m²`
                      : ""}
                  </span>
                )}
              </div>
              <div className="text-right">
                {addr.dvf_prix_m2_median_iris && (
                  <div className="text-geo-accent font-bold">
                    {Number(addr.dvf_prix_m2_median_iris).toLocaleString(
                      "fr-FR"
                    )}{" "}
                    €/m²
                  </div>
                )}
                {addr.dpe_classe_energie && (
                  <div className="text-xs mt-1 bg-geo-surface2 inline-block px-2 py-0.5 rounded">
                    DPE {addr.dpe_classe_energie}
                  </div>
                )}
              </div>
            </div>

            {/* Scores mini */}
            <div className="flex gap-3 mt-3 text-xs text-geo-text2">
              {addr.bpe_score_global && (
                <span>Équipements: {addr.bpe_score_global}/100</span>
              )}
              {addr.score_tension_prix && (
                <span>Tension: {addr.score_tension_prix}/10</span>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
