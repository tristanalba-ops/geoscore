import { Metadata } from "next";
import {
  getCommuneStats,
  getCommuneVoies,
  getCommunesMemeDepartement,
} from "@/lib/supabase";
import { notFound } from "next/navigation";
import { MapEmbed } from "@/components/MapEmbed";
import { fetchLocalNews } from "@/lib/news";

interface Props {
  params: { cp: string; ville: string };
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
  const stats = await getCommuneStats(params.cp, params.ville);
  if (!stats) return { title: "Commune non trouvée" };

  const villeName = stats.nom_commune;
  const title = `${villeName} (${params.cp}) — Analyse immobilière, DPE, risques | Intent Analytics`;
  const description = `Découvrez l'analyse complète de ${villeName} : ${formatNum(stats.nb_adresses)} adresses, prix/m² médian ${formatNum(stats.prix_m2_median)} €, DPE dominant ${stats.dpe_dominant ?? "N/A"}, risques naturels, équipements. Données publiques croisées.`;

  return {
    title,
    description,
    alternates: { canonical: `/${params.cp}/${params.ville}` },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fr_FR",
      url: `https://app.intentanalytics.fr/${params.cp}/${params.ville}`,
    },
  };
}

export default async function CommunePage({ params }: Props) {
  const [stats, voies] = await Promise.all([
    getCommuneStats(params.cp, params.ville),
    getCommuneVoies(params.cp, params.ville, 50),
  ]);

  if (!stats || !stats.nb_adresses) return notFound();

  const villeName = stats.nom_commune;
  const codeDept = stats.code_departement;

  const [autresCommunes, newsItems] = await Promise.all([
    codeDept ? getCommunesMemeDepartement(codeDept, villeName, 12) : Promise.resolve([]),
    fetchLocalNews(villeName, codeDept, 6),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-geo-text2 mb-8">
        <a href="/" className="hover:text-geo-accent">
          Accueil
        </a>
        <span className="mx-2">›</span>
        {codeDept && (
          <>
            <a href={`/departement/${codeDept}`} className="hover:text-geo-accent">
              Département {codeDept}
            </a>
            <span className="mx-2">›</span>
          </>
        )}
        <span className="text-geo-text">{villeName} ({params.cp})</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          {villeName}{" "}
          <span className="text-geo-accent">({params.cp})</span>
        </h1>
        {stats.wiki_summary && (
          <p className="text-geo-text2 leading-relaxed max-w-3xl">
            {stats.wiki_summary}
            {stats.wiki_url && (
              <>
                {" "}
                <a
                  href={stats.wiki_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-geo-accent hover:underline"
                >
                  Wikipedia →
                </a>
              </>
            )}
          </p>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <KpiCard
          label="Population"
          value={formatNum(stats.population)}
          sub={stats.evolution_pop ? `${stats.evolution_pop > 0 ? "+" : ""}${stats.evolution_pop}%` : undefined}
        />
        <KpiCard
          label="Adresses analysées"
          value={formatNum(stats.nb_adresses)}
        />
        <KpiCard
          label="Prix/m² médian"
          value={stats.prix_m2_median ? `${formatNum(stats.prix_m2_median)} €` : "—"}
          sub={stats.prix_m2_min && stats.prix_m2_max && stats.prix_m2_min !== stats.prix_m2_max ? `${formatNum(stats.prix_m2_min)} — ${formatNum(stats.prix_m2_max)} €` : undefined}
        />
        <KpiCard
          label="DPE dominant"
          value={stats.dpe_dominant ?? "N/A"}
          sub={`${formatNum(stats.nb_avec_dpe)} diagnostics`}
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
          label="Entreprises"
          value={formatNum(stats.nb_entreprises)}
          sub="immatriculées"
        />
        <KpiCard
          label="Densité"
          value={stats.densite ? `${formatNum(Math.round(stats.densite))} hab/km²` : "—"}
        />
      </div>

      {/* Carte */}
      <div className="mb-10">
        <MapEmbed
          lat={stats.latitude_centre}
          lng={stats.longitude_centre}
          label={`${villeName} (${params.cp})`}
          address={`${villeName} ${params.cp}`}
          zoom={13}
          height="300px"
        />
      </div>

      {/* Risques naturels */}
      <section className="bg-geo-surface border border-geo-border rounded-xl p-6 mb-10">
        <h2 className="text-lg font-semibold mb-4 pb-3 border-b border-geo-border">
          Risques naturels — {villeName}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <RiskItem label="Inondation" active={stats.risque_inondation === true} />
          <RiskItem label="Retrait-gonflement argile" active={stats.risque_argile === true} />
          <RiskItem label="Zone sismique" value={stats.risque_seisme?.toString()} />
          <RiskItem label="Arrêtés CatNat" value={stats.nb_catnat?.toString()} />
        </div>
      </section>

      {/* Principales voies */}
      {voies.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2">
            Rues et voies de {villeName}
          </h2>
          <p className="text-geo-text2 mb-6">
            {voies.length} voies indexées — cliquez pour voir les adresses
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {voies.map((v: any) => (
              <a
                key={v.nom_voie}
                href={`/${params.cp}/${params.ville}/${slugify(v.nom_voie)}`}
                className="bg-geo-surface border border-geo-border rounded-xl p-4 hover:border-geo-accent/60 hover:bg-geo-accent/5 transition group"
              >
                <div className="font-semibold text-sm text-geo-text group-hover:text-geo-accent transition mb-1 truncate">
                  {v.nom_voie}
                </div>
                <div className="flex items-center gap-3 text-xs text-geo-text2">
                  <span>{v.nb_adresses} adresses</span>
                  {v.prix_m2_median && (
                    <span>{formatNum(Number(v.prix_m2_median))} €/m²</span>
                  )}
                  {v.dpe_dominant && (
                    <span className="bg-geo-bg px-1.5 py-0.5 rounded">
                      DPE {v.dpe_dominant}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Orientation conseil B2B / B2C */}
      <section className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-geo-accent/10 to-geo-surface border border-geo-accent/30 rounded-xl p-6">
          <div className="text-xs text-geo-accent font-semibold uppercase tracking-wider mb-2">
            Particuliers
          </div>
          <h3 className="text-lg font-bold mb-3">
            Vous achetez ou vendez à {villeName} ?
          </h3>
          <ul className="space-y-2 text-sm text-geo-text2">
            <li className="flex items-start gap-2">
              <span className="text-geo-accent mt-0.5">●</span>
              Estimez votre bien grâce aux données DVF et DPE croisées
            </li>
            <li className="flex items-start gap-2">
              <span className="text-geo-accent mt-0.5">●</span>
              Vérifiez les risques naturels (inondation, argile, séisme)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-geo-accent mt-0.5">●</span>
              Comparez les quartiers par revenu, équipements et DPE
            </li>
            <li className="flex items-start gap-2">
              <span className="text-geo-accent mt-0.5">●</span>
              Identifiez le potentiel de rénovation énergétique
            </li>
          </ul>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-geo-surface border border-blue-500/30 rounded-xl p-6">
          <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-2">
            Professionnels
          </div>
          <h3 className="text-lg font-bold mb-3">
            Analyse territoriale B2B — {villeName}
          </h3>
          <ul className="space-y-2 text-sm text-geo-text2">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">●</span>
              Scoring immobilier multi-critères pour vos études de marché
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">●</span>
              Ciblage géographique : {formatNum(stats.nb_adresses)} adresses scorées
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">●</span>
              Données DVF, DPE, INSEE, BPE, Géorisques consolidées
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">●</span>
              Export API pour intégration CRM / BI / prospection
            </li>
          </ul>
        </div>
      </section>

      {/* Actualités */}
      {newsItems.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Actualités — {villeName}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {newsItems.map((item: any, i: number) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="bg-geo-surface border border-geo-border rounded-xl p-4 hover:border-geo-accent/60 hover:bg-geo-accent/5 transition group"
              >
                <div className="text-sm text-geo-text group-hover:text-geo-accent transition line-clamp-2 leading-snug font-medium">
                  {item.title}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-geo-text2">{item.source}</span>
                  <span className="text-[10px] text-geo-text2">{item.relativeDate}</span>
                </div>
              </a>
            ))}
          </div>
          <p className="text-[10px] text-geo-text2 mt-2">Source : Google News RSS — actualités mentionnant {villeName}</p>
        </section>
      )}

      {/* Communes du même département */}
      {autresCommunes.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2">
            Autres communes en {codeDept}
          </h2>
          <p className="text-geo-text2 mb-6">
            Explorez les communes voisines analysées
            {codeDept && (
              <>
                {" "}
                <a href={'/departement/' + codeDept} className="text-geo-accent hover:underline text-sm">
                  Voir toutes les communes du département →
                </a>
              </>
            )}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {autresCommunes.map((c: any) => (
              <a
                key={`${c.code_postal}-${c.nom_commune}`}
                href={`/${c.code_postal}/${slugify(c.nom_commune)}`}
                className="bg-geo-surface border border-geo-border rounded-xl p-4 hover:border-geo-accent/60 hover:bg-geo-accent/5 transition group text-center"
              >
                <div className="font-semibold text-sm text-geo-text group-hover:text-geo-accent transition">
                  {c.nom_commune}
                </div>
                <div className="text-xs text-geo-text2 mt-1">
                  {c.code_postal} · {formatNum(c.nb_adresses)} adr.
                </div>
                {c.population && (
                  <div className="text-xs text-geo-text2">
                    {formatNum(c.population)} hab.
                  </div>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── Maillage interne ── */}
      <section className="mt-12 pt-8 border-t border-geo-border">
        <h2 className="text-lg font-semibold mb-4">Explorer aussi</h2>
        <div className="flex flex-wrap gap-3">
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
          <a href="/explorations" className="text-sm bg-geo-surface border border-geo-border rounded-full px-4 py-2 hover:border-geo-accent transition">
            Explorations
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
              name: `${villeName} (${params.cp})`,
              description: stats.wiki_summary || `Analyse territoriale de ${villeName}`,
              geo: {
                "@type": "GeoCoordinates",
                latitude: stats.latitude_centre,
                longitude: stats.longitude_centre,
              },
              address: {
                "@type": "PostalAddress",
                postalCode: params.cp,
                addressLocality: villeName,
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

function RiskItem({ label, active, value }: { label: string; active?: boolean; value?: string }) {
  return (
    <div className="text-center">
      {active !== undefined ? (
        <div className={`text-lg font-bold ${active ? "text-red-400" : "text-green-400"}`}>
          {active ? "Oui" : "Non"}
        </div>
      ) : (
        <div className="text-lg font-bold text-geo-accent">{value ?? "—"}</div>
      )}
      <div className="text-xs text-geo-text2">{label}</div>
    </div>
  );
}
