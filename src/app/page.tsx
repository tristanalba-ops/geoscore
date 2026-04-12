import { supabase } from "@/lib/supabase";

export const revalidate = 3600; // ISR 1h

interface HomepageStats {
  total_adresses: number;
  nb_communes: number;
  nb_departements: number;
  avec_dpe: number;
  geolocalisees: number;
  prix_m2_moyen: number;
}

interface CityRow {
  code_postal: string;
  nom_commune: string;
  nb_adresses: number;
  population: number;
}

async function getStats(): Promise<HomepageStats | null> {
  const { data, error } = await supabase.rpc("get_homepage_stats");
  if (error || !data) return null;
  return data as HomepageStats;
}

async function getLatestCities(): Promise<CityRow[]> {
  const { data, error } = await supabase.rpc("get_latest_cities", {
    p_limit: 12,
  });
  if (error || !data) return [];
  return data as CityRow[];
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".0", "")}k`;
  return n.toLocaleString("fr-FR");
}

export default async function HomePage() {
  const [stats, cities] = await Promise.all([getStats(), getLatestCities()]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          L&apos;intelligence territoriale
          <br />
          <span className="text-geo-accent">à l&apos;adresse près</span>
        </h1>
        <p className="text-geo-text2 text-lg mb-10 max-w-2xl mx-auto">
          Estimation, DPE, risques naturels, équipements, démographie — croisez
          13 sources de données publiques sur n&apos;importe quelle adresse en
          France.
        </p>

        {/* Barre de recherche */}
        <form
          action="/recherche"
          method="GET"
          className="max-w-xl mx-auto flex gap-3"
        >
          <input
            type="text"
            name="q"
            placeholder="Entrez une adresse... ex: 46 rue de Franche-Comté 01000 Bourg-en-Bresse"
            className="flex-1 bg-geo-surface border border-geo-border rounded-xl px-5 py-3.5 text-geo-text placeholder:text-geo-text2 focus:outline-none focus:ring-2 focus:ring-geo-accent/40 transition"
          />
          <button
            type="submit"
            className="bg-geo-accent hover:bg-geo-accent/80 text-white font-semibold px-6 py-3.5 rounded-xl transition"
          >
            Analyser
          </button>
        </form>
      </div>

      {/* Compteurs live */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <CounterCard
            value={formatNumber(stats.total_adresses)}
            label="Adresses analysées"
            icon="📍"
          />
          <CounterCard
            value={stats.nb_communes.toLocaleString("fr-FR")}
            label="Communes couvertes"
            icon="🏘️"
          />
          <CounterCard
            value={stats.nb_departements.toString()}
            label="Départements"
            icon="🗺️"
          />
          <CounterCard
            value="13"
            label="Sources croisées"
            icon="🔗"
          />
          <CounterCard
            value={formatNumber(stats.avec_dpe)}
            label="Diagnostics DPE"
            icon="⚡"
          />
          <CounterCard
            value={formatNumber(stats.geolocalisees)}
            label="Adresses géolocalisées"
            icon="🛰️"
          />
          <CounterCard
            value={`${stats.prix_m2_moyen?.toLocaleString("fr-FR") ?? "—"} €`}
            label="Prix/m² moyen (IRIS)"
            icon="💰"
          />
          <CounterCard
            value="24/7"
            label="Mise à jour continue"
            icon="🔄"
            sub="pg_cron actif"
          />
        </div>
      )}

      {/* Dernières villes disponibles */}
      {cities.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2">
            Dernières villes disponibles
          </h2>
          <p className="text-geo-text2 mb-6">
            Nouvellement indexées — cliquez pour explorer les adresses
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cities.map((city) => (
              <a
                key={`${city.code_postal}-${city.nom_commune}`}
                href={`/${city.code_postal}/${slugify(city.nom_commune)}`}
                className="bg-geo-surface border border-geo-border rounded-xl p-5 hover:border-geo-accent/60 hover:bg-geo-accent/5 transition group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold text-geo-text group-hover:text-geo-accent transition">
                      {city.nom_commune}
                    </span>
                    <span className="text-geo-text2 text-sm ml-2">
                      {city.code_postal}
                    </span>
                  </div>
                  <span className="text-xs text-geo-text2 bg-geo-bg px-2 py-1 rounded-full">
                    {city.nb_adresses} adresses
                  </span>
                </div>
                {city.population && (
                  <div className="text-xs text-geo-text2">
                    {city.population.toLocaleString("fr-FR")} habitants
                  </div>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* FAQ / PAA SEO */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Questions fréquentes</h2>
        <div className="space-y-4">
          <FaqItem
            question="Comment est calculée l'estimation d'un bien ?"
            answer="Notre estimation croise les données DVF (Demandes de Valeurs Foncières) à l'échelle de l'IRIS avec le DPE, la surface, le type de bien et les caractéristiques du quartier. Le prix/m² médian IRIS est pondéré par les dernières transactions réelles enregistrées."
          />
          <FaqItem
            question="Qu'est-ce que le score d'équipements BPE ?"
            answer="Le score BPE (Base Permanente des Équipements) évalue la densité de services à proximité : santé (médecins, pharmacies), éducation (écoles, collèges), commerces (supermarchés, boulangeries) et transports. Un score de 8/10 signifie que l'adresse est très bien desservie."
          />
          <FaqItem
            question="D'où viennent les données sur les risques naturels ?"
            answer="Les données proviennent de Géorisques (BRGM) et incluent les risques d'inondation, le retrait-gonflement des argiles, la zone sismique et l'historique des arrêtés CatNat de la commune. Ces informations sont obligatoires dans le cadre d'une vente immobilière (IAL)."
          />
          <FaqItem
            question="Quelle est la fréquence de mise à jour ?"
            answer="Les données sont enrichies en continu par un processus automatisé (pg_cron). Les sources publiques (DVF, DPE, INSEE, BPE, Géorisques) sont intégrées au fur et à mesure de leur publication par les administrations. L'objectif est de couvrir les 24 millions d'adresses françaises."
          />
          <FaqItem
            question="Les données sont-elles fiables ?"
            answer="Toutes les données proviennent de sources officielles et publiques : data.gouv.fr, INSEE, ADEME (DPE), DVF (Direction Générale des Finances Publiques), Géorisques (BRGM) et la Base Permanente des Équipements. Aucune donnée n'est estimée sans source."
          />
          <FaqItem
            question="Combien d'adresses sont couvertes ?"
            answer={`Actuellement ${stats?.total_adresses.toLocaleString("fr-FR") ?? "—"} adresses sont analysées sur ${stats?.nb_communes ?? "—"} communes dans ${stats?.nb_departements ?? "—"} départements. Le processus d'indexation est en cours et couvre progressivement l'ensemble du territoire français.`}
          />
        </div>
      </section>

      {/* JSON-LD pour SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Intent Analytics",
            url: "https://app.intentanalytics.fr",
            description:
              "Intelligence territoriale : estimation, DPE, risques, équipements et démographie pour chaque adresse en France.",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate:
                  "https://app.intentanalytics.fr/recherche?q={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Comment est calculée l'estimation d'un bien ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Notre estimation croise les données DVF à l'échelle de l'IRIS avec le DPE, la surface, le type de bien et les caractéristiques du quartier.",
                },
              },
              {
                "@type": "Question",
                name: "D'où viennent les données sur les risques naturels ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Les données proviennent de Géorisques (BRGM) et incluent les risques d'inondation, le retrait-gonflement des argiles, la zone sismique et l'historique des arrêtés CatNat.",
                },
              },
              {
                "@type": "Question",
                name: "Les données sont-elles fiables ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Toutes les données proviennent de sources officielles : data.gouv.fr, INSEE, ADEME, DVF, Géorisques et la Base Permanente des Équipements.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}

function CounterCard({
  value,
  label,
  icon,
  sub,
}: {
  value: string;
  label: string;
  icon: string;
  sub?: string;
}) {
  return (
    <div className="bg-geo-surface border border-geo-border rounded-xl p-5 text-center">
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-xl font-bold text-geo-accent">{value}</div>
      <div className="text-xs text-geo-text2 mt-1">{label}</div>
      {sub && (
        <div className="text-[10px] text-geo-text2 mt-0.5 opacity-60">
          {sub}
        </div>
      )}
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="bg-geo-surface border border-geo-border rounded-xl group">
      <summary className="px-6 py-4 cursor-pointer font-medium text-geo-text hover:text-geo-accent transition list-none flex justify-between items-center">
        <span>{question}</span>
        <span className="text-geo-text2 group-open:rotate-180 transition-transform ml-4">
          ▾
        </span>
      </summary>
      <div className="px-6 pb-4 text-sm text-geo-text2 leading-relaxed">
        {answer}
      </div>
    </details>
  );
}
