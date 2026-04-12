import { Metadata } from "next";
import { getVillePage } from "@/lib/supabase";
import { notFound } from "next/navigation";

interface Props {
  params: { cp: string; ville: string };
}

// ISR : revalidation toutes les 24h
export const revalidate = 86400;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ville = params.ville.replace(/-/g, " ");
  const villeTitle = ville.charAt(0).toUpperCase() + ville.slice(1);

  return {
    title: `Immobilier ${villeTitle} (${params.cp}) — Prix, DPE, quartiers`,
    description: `Analyse immobilière complète de ${villeTitle} : prix au m², transactions DVF, DPE, risques, équipements. ${params.cp} — GeoScore.`,
    alternates: {
      canonical: `/${params.cp}/${params.ville}`,
    },
  };
}

export default async function VillePage({ params }: Props) {
  const { commune, addresses, totalAddresses } = await getVillePage(
    params.cp,
    params.ville
  );

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
        <span className="text-geo-text">
          {villeName} ({params.cp})
        </span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">
        Immobilier à {villeName}
        <span className="text-geo-text2 font-normal ml-3 text-xl">
          {params.cp}
        </span>
      </h1>

      {/* Stats commune */}
      {commune && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 mb-12">
          {[
            {
              label: "Population",
              value: commune.population?.toLocaleString("fr-FR"),
            },
            {
              label: "Prix m² médian",
              value: "—",
            },
            {
              label: "Entreprises",
              value: commune.nb_entreprises?.toLocaleString("fr-FR"),
            },
            { label: "Équipements", value: commune.nb_equipements_total },
            { label: "Adresses analysées", value: totalAddresses },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-geo-surface border border-geo-border rounded-xl p-4 text-center"
            >
              <div className="text-lg font-bold text-geo-accent">
                {s.value ?? "—"}
              </div>
              <div className="text-xs text-geo-text2 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Description */}
      {commune?.wiki_summary && (
        <p className="text-geo-text2 mb-10 leading-relaxed max-w-3xl">
          {commune.wiki_summary}
        </p>
      )}

      {/* Liste des adresses */}
      <h2 className="text-xl font-semibold mb-4">
        Adresses analysées à {villeName}
      </h2>
      <div className="space-y-3">
        {addresses?.map((addr) => (
          <a
            key={addr.ban_id}
            href={`/${params.cp}/${params.ville}/${
              addr.nom_voie
                ? addr.nom_voie
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "")
                : "voie"
            }/${addr.numero}`}
            className="block bg-geo-surface border border-geo-border rounded-xl p-4 hover:border-geo-accent/40 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">
                  {addr.numero} {addr.nom_voie}
                </span>
                <span className="text-geo-text2 ml-2 text-sm">
                  {addr.code_postal} {addr.nom_commune}
                </span>
              </div>
              <div className="flex gap-4 text-sm">
                {addr.dvf_prix_m2_median_iris && (
                  <span className="text-geo-accent font-semibold">
                    {Number(addr.dvf_prix_m2_median_iris).toLocaleString(
                      "fr-FR"
                    )}{" "}
                    €/m²
                  </span>
                )}
                {addr.dpe_classe_energie && (
                  <span className="bg-geo-surface2 px-2 py-0.5 rounded text-xs font-bold">
                    DPE {addr.dpe_classe_energie}
                  </span>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Place",
            name: `${villeName}, ${params.cp}`,
            description: commune?.wiki_summary,
            geo: commune
              ? {
                  "@type": "GeoCoordinates",
                  latitude: commune.latitude,
                  longitude: commune.longitude,
                }
              : undefined,
            url: `https://geoscore.fr/${params.cp}/${params.ville}`,
          }),
        }}
      />
    </div>
  );
}
