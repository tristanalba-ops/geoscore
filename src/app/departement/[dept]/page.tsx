import { Metadata } from "next";
import {
  getDepartementStats,
  getDepartementCommunes,
} from "@/lib/supabase";
import { notFound } from "next/navigation";

interface Props {
  params: { dept: string };
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
  const stats = await getDepartementStats(params.dept);
  if (!stats) return { title: "Département non trouvé" };

  const title = `Département ${params.dept} — Analyse immobilière | Intent Analytics`;
  const description = `Découvrez l'analyse du département ${params.dept} : ${formatNum(stats.nb_communes)} communes, ${formatNum(stats.nb_adresses)} adresses analysées, prix/m² médian ${formatNum(stats.prix_m2_median)} €, population ${formatNum(stats.population_totale)}. Données publiques croisées.`;

  return {
    title,
    description,
    alternates: { canonical: `/departement/${params.dept}` },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fr_FR",
      url: `https://app.intentanalytics.fr/departement/${params.dept}`,
    },
  };
}

export default async function DepartementPage({ params }: Props) {
  const [stats, communes] = await Promise.all([
    getDepartementStats(params.dept),
    getDepartementCommunes(params.dept, 100),
  ]);

  if (!stats) return notFound();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-geo-text2 mb-8">
        <a href="/" className="hover:text-geo-accent">
          Accueil
        </a>
        <span className="mx-2">›</span>
        <span className="text-geo-text">Département {params.dept}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold">
          Département {params.dept} — <span className="text-geo-accent">Analyse immobilière</span>
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <KpiCard
          label="Communes"
          value={formatNum(stats.nb_communes)}
        />
        <KpiCard
          label="Adresses analysées"
          value={formatNum(stats.nb_adresses)}
        />
        <KpiCard
          label="Prix/m² médian"
          value={stats.prix_m2_median ? `${formatNum(stats.prix_m2_median)} €` : "—"}
          sub={stats.prix_m2_p25 && stats.prix_m2_p75 && stats.prix_m2_p25 !== stats.prix_m2_p75 ? `${formatNum(stats.prix_m2_p25)} — ${formatNum(stats.prix_m2_p75)} €` : undefined}
        />
        <KpiCard
          label="Population"
          value={formatNum(stats.population_totale)}
        />
        <KpiCard
          label="DPE dominant"
          value={stats.dpe_dominant ?? "N/A"}
        />
        <KpiCard
          label="Score équipements"
          value={stats.score_equipements_moyen ? `${stats.score_equipements_moyen}/100` : "—"}
          sub="BPE moyen"
        />
        <KpiCard
          label="Revenu médian"
          value={stats.revenu_median_moyen ? `${formatNum(stats.revenu_median_moyen)} €` : "—"}
          sub="par IRIS"
        />
        <KpiCard
          label="Densité"
          value={stats.densite ? `${formatNum(Math.round(stats.densite))} hab/km²` : "—"}
        />
      </div>

      {/* Communes du département */}
      {communes.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6">
            Communes du département {params.dept}
          </h2>
          <div className="bg-geo-surface border border-geo-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-geo-border bg-geo-bg">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-geo-text">Commune</th>
                    <th className="text-left px-4 py-3 font-semibold text-geo-text">Code postal</th>
                    <th className="text-right px-4 py-3 font-semibold text-geo-text">Adresses</th>
                    <th className="text-right px-4 py-3 font-semibold text-geo-text">Prix/m²</th>
                    <th className="text-right px-4 py-3 font-semibold text-geo-text">Population</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-geo-border">
                  {communes.map((c: any) => (
                    <tr key={`${c.code_postal}-${c.nom_commune}`} className="hover:bg-geo-accent/5 transition">
                      <td className="px-4 py-3">
                        <a
                          href={`/${c.code_postal}/${slugify(c.nom_commune)}`}
                          className="text-geo-accent hover:underline font-medium"
                        >
                          {c.nom_commune}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-geo-text2">{c.code_postal}</td>
                      <td className="px-4 py-3 text-right text-geo-text">{formatNum(c.nb_adresses)}</td>
                      <td className="px-4 py-3 text-right text-geo-text">
                        {c.prix_m2_median ? `${formatNum(c.prix_m2_median)} €` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-geo-text">{formatNum(c.population)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Place",
              name: `Département ${params.dept}`,
              description: `Analyse territoriale du département ${params.dept}`,
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
                  name: `Département ${params.dept}`,
                  item: `https://app.intentanalytics.fr/departement/${params.dept}`,
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
