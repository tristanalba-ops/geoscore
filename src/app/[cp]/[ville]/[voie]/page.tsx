import { Metadata } from "next";
import { getVoieStats, getVoieAdresses } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { MapEmbed } from "@/components/MapEmbed";
import { DPE_COLORS, type DpeClasse } from "@/types/database";

interface Props {
  params: { cp: string; ville: string; voie: string };
}

export const revalidate = 86400;

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatNum(n: number | null | undefined): string {
  if (!n) return "—";
  return n.toLocaleString("fr-FR");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stats = await getVoieStats(params.cp, params.ville, params.voie);
  if (!stats) return { title: "Voie non trouvée" };

  const voieName = stats.nom_voie;
  const communeName = stats.nom_commune;
  const title = `${voieName}, ${params.cp} ${communeName} — Adresses, prix, DPE | Intent Analytics`;
  const description = `${stats.nb_adresses} adresses analysées sur ${voieName} à ${communeName} (${params.cp}). Prix/m², DPE, estimation, risques et équipements pour chaque numéro.`;

  return {
    title,
    description,
    alternates: { canonical: `/${params.cp}/${params.ville}/${params.voie}` },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fr_FR",
      url: `https://app.intentanalytics.fr/${params.cp}/${params.ville}/${params.voie}`,
    },
  };
}

export default async function VoiePage({ params }: Props) {
  const [stats, adresses] = await Promise.all([
    getVoieStats(params.cp, params.ville, params.voie),
    getVoieAdresses(params.cp, params.ville, params.voie),
  ]);

  if (!stats || !stats.nb_adresses) return notFound();

  const voieName = stats.nom_voie;
  const communeName = stats.nom_commune;

  const codeDept = stats.code_departement || params.cp.substring(0, 2);
  const villeName = params.ville
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Markers pour la carte
  const markers = adresses
    .filter((a: any) => a.latitude && a.longitude)
    .map((a: any) => ({
      lat: a.latitude,
      lng: a.longitude,
      label: `N°${a.numero} ${voieName}`,
      href: `/${params.cp}/${params.ville}/${params.voie}/${a.numero}`,
    }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-geo-text2 mb-8">
        <a href="/" className="hover:text-geo-accent">Accueil</a>
        <span className="mx-2">›</span>
        <a href={`/departement/${codeDept}`} className="hover:text-geo-accent">Département {codeDept}</a>
        <span className="mx-2">›</span>
        <a href={`/${params.cp}/${params.ville}`} className="hover:text-geo-accent">{villeName}</a>
        <span className="mx-2">›</span>
        <span className="text-geo-text">{voieName}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {voieName}
        </h1>
        <p className="text-geo-text2">
          {params.cp} {communeName} · {stats.nb_adresses} adresses analysées
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <KpiCard
          label="Adresses"
          value={formatNum(stats.nb_adresses)}
        />
        <KpiCard
          label="Prix/m² médian"
          value={stats.prix_m2_iris_median ? `${formatNum(stats.prix_m2_iris_median)} €` : "—"}
          sub="IRIS"
        />
        <KpiCard
          label="DPE dominant"
          value={stats.dpe_dominant ?? "N/A"}
          sub={`${formatNum(stats.nb_avec_dpe)} diagnostics`}
        />
        <KpiCard
          label="Estimation moy."
          value={stats.estimation_moyenne ? `${formatNum(stats.estimation_moyenne)} €` : "—"}
        />
      </div>

      {/* Carte avec tous les markers */}
      <div className="mb-10">
        <MapEmbed
          lat={stats.latitude_centre}
          lng={stats.longitude_centre}
          label={`${voieName}, ${communeName}`}
          address={`${voieName} ${params.cp} ${communeName}`}
          markers={markers}
          zoom={16}
          height="350px"
        />
      </div>

      {/* Liste des adresses */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">
          Toutes les adresses — {voieName}
        </h2>
        <p className="text-geo-text2 mb-6">
          Cliquez sur un numéro pour voir l&apos;analyse complète
        </p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-geo-border text-left text-xs text-geo-text2 uppercase tracking-wider">
                <th className="pb-3 pr-4">N°</th>
                <th className="pb-3 pr-4">DPE</th>
                <th className="pb-3 pr-4">Prix/m²</th>
                <th className="pb-3 pr-4">Dernière vente</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Surface</th>
                <th className="pb-3">Estimation</th>
              </tr>
            </thead>
            <tbody>
              {adresses.map((a: any) => {
                const dpe = a.dpe_classe_energie as DpeClasse | null;
                return (
                  <tr
                    key={a.id}
                    className="border-b border-geo-border/50 hover:bg-geo-accent/5 transition"
                  >
                    <td className="py-3 pr-4">
                      <a
                        href={`/${params.cp}/${params.ville}/${params.voie}/${a.numero}`}
                        className="text-geo-accent font-semibold hover:underline"
                      >
                        {a.numero}
                      </a>
                    </td>
                    <td className="py-3 pr-4">
                      {dpe ? (
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-bold text-white"
                          style={{ backgroundColor: DPE_COLORS[dpe] || "#6b7280" }}
                        >
                          {dpe}
                        </span>
                      ) : (
                        <span className="text-geo-text2 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-sm">
                      {a.dvf_prix_m2
                        ? `${formatNum(Number(a.dvf_prix_m2))} €`
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 text-sm">
                      {a.dvf_dernier_prix
                        ? `${formatNum(Number(a.dvf_dernier_prix))} €`
                        : "—"}
                      {a.dvf_derniere_date && (
                        <span className="text-geo-text2 text-xs ml-1">
                          ({a.dvf_derniere_date})
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-sm text-geo-text2">
                      {a.dvf_dernier_type ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-sm">
                      {a.dvf_derniere_surface
                        ? `${a.dvf_derniere_surface} m²`
                        : "—"}
                    </td>
                    <td className="py-3 text-sm font-semibold">
                      {a.estimation_prix
                        ? `${formatNum(Number(a.estimation_prix))} €`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Navigation maillage interne */}
      <div className="flex flex-wrap gap-4 justify-center mt-8 mb-4">
        <a href={`/${params.cp}/${params.ville}`} className="text-geo-accent hover:underline text-sm">
          ← {villeName} ({params.cp})
        </a>
        {codeDept && (
          <a href={`/departement/${codeDept}`} className="text-geo-accent hover:underline text-sm">
            ← Département {codeDept}
          </a>
        )}
      </div>

      {/* Explorer aussi */}
      <section className="mt-8 pt-8 border-t border-geo-border">
        <h2 className="text-lg font-semibold mb-4">Explorer aussi</h2>
        <div className="flex flex-wrap gap-3">
          <a href={`/${params.cp}/${params.ville}`} className="text-sm bg-geo-surface border border-geo-border rounded-full px-4 py-2 hover:border-geo-accent transition">
            {villeName} ({params.cp})
          </a>
          {codeDept && (
            <a href={`/departement/${codeDept}`} className="text-sm bg-geo-surface border border-geo-border rounded-full px-4 py-2 hover:border-geo-accent transition">
              Département {codeDept}
            </a>
          )}
          <a href="/estimation" className="text-sm bg-geo-surface border border-geo-border rounded-full px-4 py-2 hover:border-geo-accent transition">
            Estimer un bien
          </a>
          <a href="/renovation-energetique" className="text-sm bg-geo-surface border border-geo-border rounded-full px-4 py-2 hover:border-geo-accent transition">
            Rénovation énergétique
          </a>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Place",
              name: `${voieName}, ${params.cp} ${communeName}`,
              geo: stats.latitude_centre
                ? {
                    "@type": "GeoCoordinates",
                    latitude: stats.latitude_centre,
                    longitude: stats.longitude_centre,
                  }
                : undefined,
              address: {
                "@type": "PostalAddress",
                streetAddress: voieName,
                postalCode: params.cp,
                addressLocality: communeName,
                addressCountry: "FR",
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Accueil",
                  item: "https://app.intentanalytics.fr",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: `${villeName} (${params.cp})`,
                  item: `https://app.intentanalytics.fr/${params.cp}/${params.ville}`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: voieName,
                  item: `https://app.intentanalytics.fr/${params.cp}/${params.ville}/${params.voie}`,
                },
              ],
            },
          ]),
        }}
      />
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-geo-surface border border-geo-border rounded-xl p-5">
      <div className="text-xs text-geo-text2 mb-1">{label}</div>
      <div className="text-xl font-bold text-geo-accent">{value}</div>
      {sub && <div className="text-xs text-geo-text2 mt-1">{sub}</div>}
    </div>
  );
}
