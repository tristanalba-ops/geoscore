import { Metadata } from "next";
import { getAddressBySeo } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { DPE_COLORS, type DpeClasse } from "@/types/database";
import { ScoreBar } from "@/components/ScoreBar";
import { RiskBadge } from "@/components/RiskBadge";
import { MapEmbed } from "@/components/MapEmbed";

interface Props {
  params: { cp: string; ville: string; voie: string; numero: string };
}

export const revalidate = 86400; // ISR 24h

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const addr = await getAddressBySeo(
    params.cp,
    params.ville,
    params.voie,
    params.numero
  );

  if (!addr) {
    return { title: "Adresse non trouvée" };
  }

  const title =
    addr.meta_title ||
    `${addr.numero} ${addr.nom_voie}, ${addr.code_postal} ${addr.nom_commune}`;
  const description =
    addr.meta_description ||
    `Analyse complète : estimation, DPE, risques, quartier.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/${params.cp}/${params.ville}/${params.voie}/${params.numero}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fr_FR",
      url: `https://geoscore.fr/${params.cp}/${params.ville}/${params.voie}/${params.numero}`,
    },
  };
}

export default async function AddressPage({ params }: Props) {
  const addr = await getAddressBySeo(
    params.cp,
    params.ville,
    params.voie,
    params.numero
  );

  if (!addr) return notFound();

  const villeName = params.ville
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const voieName = params.voie
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const fullAddress = `${addr.numero} ${addr.nom_voie}, ${addr.code_postal} ${addr.nom_commune}`;

  const prixM2 = addr.dvf_prix_m2_median_iris
    ? Number(addr.dvf_prix_m2_median_iris)
    : null;
  const dpeClasse = addr.dpe_classe_energie as DpeClasse | null;

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
        <a
          href={`/${params.cp}/${params.ville}/${params.voie}`}
          className="hover:text-geo-accent"
        >
          {voieName}
        </a>
        <span className="mx-2">›</span>
        <span className="text-geo-text">N°{params.numero}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">{fullAddress}</h1>
        <p className="text-geo-text2">
          {addr.dvf_dernier_type && `${addr.dvf_dernier_type} · `}
          {addr.dvf_derniere_surface && `${addr.dvf_derniere_surface} m² · `}
          {addr.dvf_dernier_nb_pieces &&
            `${addr.dvf_dernier_nb_pieces} pièces · `}
          IRIS {addr.code_iris ?? "—"}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <KpiCard
          label="Prix/m² médian"
          value={prixM2 ? `${prixM2.toLocaleString("fr-FR")} €` : "—"}
          sub="IRIS"
        />
        <KpiCard
          label="DPE"
          value={dpeClasse ?? "N/A"}
          sub={addr.dpe_conso_m2 ? `${addr.dpe_conso_m2} kWh/m²/an` : ""}
          color={dpeClasse ? DPE_COLORS[dpeClasse] : undefined}
        />
        <KpiCard
          label="Estimation"
          value={
            addr.estimation_prix
              ? `${Number(addr.estimation_prix).toLocaleString("fr-FR")} €`
              : "—"
          }
          sub={addr.estimation_methode ?? ""}
        />
        <KpiCard
          label="Population"
          value={
            addr.commune_population
              ? addr.commune_population.toLocaleString("fr-FR")
              : "—"
          }
          sub={addr.nom_commune}
        />
      </div>

      {/* Map placeholder */}
      <div className="mb-10">
        <MapEmbed lat={addr.latitude} lng={addr.longitude} label={fullAddress} />
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Marché immobilier */}
        <Section title="Marché immobilier">
          <DataRow
            label="Dernière vente"
            value={
              addr.dvf_dernier_prix
                ? `${Number(addr.dvf_dernier_prix).toLocaleString("fr-FR")} € (${addr.dvf_derniere_date ?? ""})`
                : "—"
            }
          />
          <DataRow
            label="Prix/m² (vente)"
            value={
              addr.dvf_prix_m2
                ? `${Number(addr.dvf_prix_m2).toLocaleString("fr-FR")} €/m²`
                : "—"
            }
          />
          <DataRow
            label="Prix/m² médian IRIS"
            value={prixM2 ? `${prixM2.toLocaleString("fr-FR")} €/m²` : "—"}
          />
          <DataRow
            label="Transactions IRIS"
            value={addr.dvf_nb_transactions_iris?.toString() ?? "—"}
          />
          <DataRow
            label="Score tension"
            value={
              addr.score_tension_prix
                ? `${addr.score_tension_prix}/10`
                : "—"
            }
          />
          <DataRow
            label="Score liquidité"
            value={
              addr.score_liquidite_marche
                ? `${addr.score_liquidite_marche}/10`
                : "—"
            }
          />
        </Section>

        {/* DPE / Énergie */}
        <Section title="Performance énergétique">
          <DataRow label="Classe énergie" value={dpeClasse ?? "Non disponible"} />
          <DataRow label="Classe GES" value={addr.dpe_classe_ges ?? "—"} />
          <DataRow
            label="Consommation"
            value={addr.dpe_conso_m2 ? `${addr.dpe_conso_m2} kWh/m²/an` : "—"}
          />
          <DataRow
            label="Surface DPE"
            value={addr.dpe_surface ? `${addr.dpe_surface} m²` : "—"}
          />
          <DataRow
            label="Score potentiel réno"
            value={
              addr.score_potentiel_dpe
                ? `${addr.score_potentiel_dpe}/10`
                : "—"
            }
          />
          {addr.dpe_pct_ab_iris && (
            <DataRow label="% DPE A-B (IRIS)" value={`${addr.dpe_pct_ab_iris}%`} />
          )}
        </Section>

        {/* Équipements */}
        <Section title="Équipements & services">
          <ScoreBar label="Global" value={Number(addr.bpe_score_global) || 0} />
          <ScoreBar label="Santé" value={Number(addr.bpe_score_sante) || 0} />
          <ScoreBar
            label="Éducation"
            value={Number(addr.bpe_score_education) || 0}
          />
          <ScoreBar
            label="Commerce"
            value={Number(addr.bpe_score_commerce) || 0}
          />
          <ScoreBar
            label="Transport"
            value={Number(addr.bpe_score_transport) || 0}
          />
          <DataRow
            label="Nb équipements"
            value={addr.bpe_nb_equipements?.toString() ?? "—"}
          />
        </Section>

        {/* Risques */}
        <Section title="Risques naturels">
          <RiskBadge
            label="Inondation"
            active={addr.commune_risque_inondation === true}
          />
          <RiskBadge
            label="Retrait-gonflement argile"
            active={addr.commune_risque_argile === true}
          />
          <DataRow
            label="Zone sismique"
            value={addr.commune_risque_seisme?.toString() ?? "—"}
          />
          <DataRow
            label="Arrêtés CatNat"
            value={addr.commune_nb_catnat?.toString() ?? "—"}
          />
          <DataRow label="Climat" value={addr.commune_zone_climatique ?? "—"} />
        </Section>

        {/* Socio-démo */}
        <Section title="Profil du quartier" className="md:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MiniStat
              label="Revenu médian"
              value={
                addr.iris_revenu_median
                  ? `${Number(addr.iris_revenu_median).toLocaleString("fr-FR")} €`
                  : "—"
              }
            />
            <MiniStat
              label="Taux pauvreté"
              value={
                addr.iris_taux_pauvrete
                  ? `${addr.iris_taux_pauvrete}%`
                  : "—"
              }
            />
            <MiniStat
              label="Taux chômage"
              value={
                addr.iris_taux_chomage ? `${addr.iris_taux_chomage}%` : "—"
              }
            />
            <MiniStat
              label="Part 60+"
              value={
                addr.iris_part_60_plus ? `${addr.iris_part_60_plus}%` : "—"
              }
            />
          </div>
        </Section>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Place",
              name: fullAddress,
              geo: {
                "@type": "GeoCoordinates",
                latitude: addr.latitude,
                longitude: addr.longitude,
              },
              address: {
                "@type": "PostalAddress",
                streetAddress: `${addr.numero} ${addr.nom_voie}`,
                postalCode: addr.code_postal,
                addressLocality: addr.nom_commune,
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
                  item: "https://geoscore.fr",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: villeName,
                  item: `https://geoscore.fr/${params.cp}/${params.ville}`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: voieName,
                  item: `https://geoscore.fr/${params.cp}/${params.ville}/${params.voie}`,
                },
                {
                  "@type": "ListItem",
                  position: 4,
                  name: `N°${params.numero}`,
                  item: `https://geoscore.fr/${params.cp}/${params.ville}/${params.voie}/${params.numero}`,
                },
              ],
            },
          ]),
        }}
      />
    </div>
  );
}

// Sub-components
function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-geo-surface border border-geo-border rounded-xl p-5">
      <div className="text-xs text-geo-text2 mb-1">{label}</div>
      <div
        className="text-xl font-bold"
        style={color ? { color } : { color: "#6c63ff" }}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-geo-text2 mt-1">{sub}</div>}
    </div>
  );
}

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-geo-surface border border-geo-border rounded-xl p-6 ${className}`}
    >
      <h2 className="text-lg font-semibold mb-4 pb-3 border-b border-geo-border">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-geo-text2">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-geo-accent">{value}</div>
      <div className="text-xs text-geo-text2">{label}</div>
    </div>
  );
}
