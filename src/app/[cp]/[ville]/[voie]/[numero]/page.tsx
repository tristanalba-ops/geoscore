import { Metadata } from "next";
import { getAddressBySeo } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { DPE_COLORS, type DpeClasse } from "@/types/database";
import { MapEmbed } from "@/components/MapEmbed";

interface Props {
  params: { cp: string; ville: string; voie: string; numero: string };
}

export const revalidate = 86400;

function formatNum(n: number | null | undefined): string {
  if (!n) return "—";
  return Number(n).toLocaleString("fr-FR");
}

function pct(val: number | null | undefined): string {
  if (!val) return "—";
  return `${val}%`;
}

const DPE_THRESHOLDS: Record<string, string> = {
  A: "≤ 70 kWh/m²/an",
  B: "71 – 110",
  C: "111 – 180",
  D: "181 – 250",
  E: "251 – 330",
  F: "331 – 420",
  G: "> 420",
};

const DPE_WIDTHS: Record<string, string> = {
  A: "25%", B: "35%", C: "45%", D: "55%", E: "65%", F: "75%", G: "85%",
};

const DPE_BG: Record<string, string> = {
  A: "#009c5b", B: "#52b153", C: "#9fc836", D: "#f0e50a", E: "#f0b200", F: "#ef8023", G: "#d7221f",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const addr = await getAddressBySeo(params.cp, params.ville, params.voie, params.numero);
  if (!addr) return { title: "Adresse non trouvée" };

  const fullAddr = `${addr.numero} ${addr.nom_voie}, ${addr.code_postal} ${addr.nom_commune}`;
  const parts: string[] = [];
  if (addr.dvf_dernier_type) parts.push(addr.dvf_dernier_type);
  if (addr.dvf_derniere_surface) parts.push(`${addr.dvf_derniere_surface} m²`);
  if (addr.dpe_classe_energie) parts.push(`DPE ${addr.dpe_classe_energie}`);
  if (addr.estimation_prix) parts.push(`Estimation ${formatNum(addr.estimation_prix)} €`);

  const title = addr.meta_title || `${fullAddr} — ${parts.join(" · ")} | Intent Analytics`;
  const description = addr.meta_description || `Analyse immobilière complète du ${fullAddr} : marché, énergie, quartier, risques, transports. ${parts.join(". ")}.`;

  return {
    title,
    description,
    alternates: { canonical: `/${params.cp}/${params.ville}/${params.voie}/${params.numero}` },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fr_FR",
      url: `https://app.intentanalytics.fr/${params.cp}/${params.ville}/${params.voie}/${params.numero}`,
    },
    other: {
      "geo.region": `FR-${addr.code_departement}`,
      "geo.placename": `${addr.nom_commune}, ${addr.code_departement}`,
      ...(addr.latitude && addr.longitude ? {
        "geo.position": `${addr.latitude};${addr.longitude}`,
        "ICBM": `${addr.latitude}, ${addr.longitude}`,
      } : {}),
    },
  };
}

export default async function AddressPage({ params }: Props) {
  const addr = await getAddressBySeo(params.cp, params.ville, params.voie, params.numero);
  if (!addr) return notFound();

  const villeName = params.ville.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const voieName = params.voie.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const fullAddress = `${addr.numero} ${addr.nom_voie}, ${addr.code_postal} ${addr.nom_commune}`;

  const prixM2 = addr.dvf_prix_m2 ? Number(addr.dvf_prix_m2) : null;
  const prixM2Median = addr.dvf_prix_m2_median_iris ? Number(addr.dvf_prix_m2_median_iris) : null;
  const prixM2P25 = addr.dvf_prix_m2_p25_iris ? Number(addr.dvf_prix_m2_p25_iris) : null;
  const prixM2P75 = addr.dvf_prix_m2_p75_iris ? Number(addr.dvf_prix_m2_p75_iris) : null;
  const dpeClasse = addr.dpe_classe_energie as DpeClasse | null;
  const estimation = addr.estimation_prix ? Number(addr.estimation_prix) : null;
  const estimBas = addr.estimation_prix_bas ? Number(addr.estimation_prix_bas) : null;
  const estimHaut = addr.estimation_prix_haut ? Number(addr.estimation_prix_haut) : null;

  // Tags
  const tags: { label: string; color: string }[] = [];
  if (dpeClasse) {
    const isGood = ["A", "B"].includes(dpeClasse);
    tags.push({ label: `DPE ${dpeClasse}`, color: isGood ? "green" : ["F", "G"].includes(dpeClasse) ? "red" : "yellow" });
  }
  if (addr.bpe_score_global) {
    tags.push({ label: `Quartier ${addr.bpe_score_global}/100`, color: Number(addr.bpe_score_global) >= 70 ? "blue" : "yellow" });
  }
  if (addr.commune_risque_inondation) {
    tags.push({ label: "Zone inondation", color: "red" });
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-geo-text2 mb-8">
        <a href="/" className="hover:text-geo-accent">Accueil</a>
        <span className="mx-2">›</span>
        <a href={`/${params.cp}/${params.ville}`} className="hover:text-geo-accent">{villeName}</a>
        <span className="mx-2">›</span>
        <a href={`/${params.cp}/${params.ville}/${params.voie}`} className="hover:text-geo-accent">{voieName}</a>
        <span className="mx-2">›</span>
        <span className="text-geo-text">N°{params.numero}</span>
      </nav>

      {/* HERO */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2">{fullAddress}</h1>
          <p className="text-geo-text2 mb-3">
            {addr.dvf_dernier_type && `${addr.dvf_dernier_type} · `}
            {addr.dvf_derniere_surface && `${addr.dvf_derniere_surface} m² · `}
            {addr.dvf_dernier_nb_pieces && `${addr.dvf_dernier_nb_pieces} pièces · `}
            {addr.dvf_dernier_terrain && `Terrain ${addr.dvf_dernier_terrain} m² · `}
            IRIS {addr.code_iris ?? "—"}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {tags.map((t) => (
                <span
                  key={t.label}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    t.color === "green" ? "bg-green-500/15 text-green-400" :
                    t.color === "blue" ? "bg-blue-500/15 text-blue-400" :
                    t.color === "red" ? "bg-red-500/15 text-red-400" :
                    "bg-yellow-500/15 text-yellow-400"
                  }`}
                >
                  {t.label}
                </span>
              ))}
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard
              value={estimation ? `${formatNum(estimation)} €` : "—"}
              label="Estimation"
              detail={estimBas && estimHaut ? `${formatNum(estimBas)} – ${formatNum(estimHaut)} €` : addr.estimation_methode}
            />
            <MetricCard
              value={prixM2 ? `${formatNum(prixM2)} €` : "—"}
              label="Prix / m²"
              detail={prixM2Median ? `Médiane IRIS : ${formatNum(prixM2Median)} €` : undefined}
            />
            <MetricCard
              value={dpeClasse ?? "N/A"}
              label="Classe DPE"
              detail={addr.dpe_conso_m2 ? `${addr.dpe_conso_m2} kWh/m²/an` : undefined}
              valueColor={dpeClasse ? DPE_BG[dpeClasse] : undefined}
            />
            <MetricCard
              value={addr.bpe_score_global?.toString() ?? "—"}
              label="Score quartier"
              detail="Santé, éducation, commerces"
            />
            <MetricCard
              value={addr.dvf_nb_transactions_iris?.toString() ?? "—"}
              label="Transactions IRIS"
              detail={addr.score_tension_prix ? `Tension ${addr.score_tension_prix}/10` : undefined}
            />
          </div>
        </div>

        {/* Map */}
        <div>
          <MapEmbed
            lat={addr.latitude}
            lng={addr.longitude}
            label={fullAddress}
            address={fullAddress}
            height="280px"
          />
        </div>
      </div>

      {/* 1. CONTEXTE ADRESSE */}
      <Section title="Cette adresse en bref" icon="📍">
        <div className="text-sm text-geo-text2 leading-relaxed space-y-3">
          <p>
            Le <strong className="text-geo-text">{addr.numero} {addr.nom_voie}</strong> se situe à{" "}
            <strong className="text-geo-text">{addr.nom_commune}</strong> ({addr.code_postal}),
            {addr.code_departement && ` département ${addr.code_departement}`}.
            {addr.dvf_dernier_type && addr.dvf_derniere_surface && (
              <> Ce{addr.dvf_dernier_type === "Maison" ? "tte maison" : "t appartement"} de{" "}
              <strong className="text-geo-text">{addr.dvf_derniere_surface} m²</strong>
              {addr.dvf_dernier_nb_pieces && <> avec <strong className="text-geo-text">{addr.dvf_dernier_nb_pieces} pièces</strong></>}
              {addr.dvf_dernier_prix && addr.dvf_derniere_date && (
                <> a été vendu{addr.dvf_dernier_type === "Maison" ? "e" : ""}{" "}
                <strong className="text-geo-text">{formatNum(Number(addr.dvf_dernier_prix))} €</strong> le {addr.dvf_derniere_date}
                {prixM2 && <>, soit <strong className="text-geo-text">{formatNum(prixM2)} €/m²</strong></>}
                </>
              )}.</>
            )}
          </p>
          {dpeClasse && addr.dpe_conso_m2 && (
            <p>
              Classé <strong className="text-geo-text">DPE {dpeClasse}</strong> avec{" "}
              <strong className="text-geo-text">{addr.dpe_conso_m2} kWh/m²/an</strong>
              {addr.dpe_pct_ab_iris && (
                <>, ce bien fait partie des <strong className="text-geo-text">{addr.dpe_pct_ab_iris}%</strong> de logements classés A ou B dans l&apos;IRIS</>
              )}.
              {addr.dpe_pct_efg_iris && (
                <> À noter : <strong className="text-geo-text">{addr.dpe_pct_efg_iris}%</strong> des biens du quartier sont encore classés E, F ou G.</>
              )}
            </p>
          )}
          {addr.commune_population && (
            <p>
              {addr.nom_commune} compte <strong className="text-geo-text">{formatNum(addr.commune_population)} habitants</strong>
              {addr.commune_densite && <> et affiche une densité de <strong className="text-geo-text">{formatNum(Math.round(Number(addr.commune_densite)))} hab/km²</strong></>}
              {addr.commune_evolution_pop && (
                <>, avec une évolution démographique de <strong className="text-geo-text">{Number(addr.commune_evolution_pop) > 0 ? "+" : ""}{addr.commune_evolution_pop}%</strong> sur 5 ans</>
              )}.
            </p>
          )}
        </div>
      </Section>

      {/* 2. MARCHÉ IMMOBILIER */}
      <Section title="Marché immobilier local" icon="🏠">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold mb-4 text-geo-text2">Prix dans le quartier (IRIS {addr.code_iris ?? "—"})</h3>
            <div className="grid grid-cols-2 gap-3">
              <DataItem label="Prix médian / m²" value={prixM2Median ? `${formatNum(prixM2Median)} €` : "—"} context={prixM2P25 && prixM2P75 ? `Q1 : ${formatNum(prixM2P25)} € · Q3 : ${formatNum(prixM2P75)} €` : undefined} />
              <DataItem label="Transactions IRIS" value={addr.dvf_nb_transactions_iris?.toString() ?? "—"} context="Source DVF" />
              <DataItem label="Estimation" value={estimation ? `${formatNum(estimation)} €` : "—"} context={estimBas && estimHaut ? `${formatNum(estimBas)} – ${formatNum(estimHaut)} €` : undefined} />
              <DataItem label="Méthode" value={addr.estimation_methode ?? "—"} context="Basée sur les transactions DVF" />
            </div>

            {/* Bar chart positionnement */}
            {prixM2 && prixM2Median && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3 text-geo-text2">Positionnement prix</h3>
                <div className="flex items-end gap-2 h-28">
                  {prixM2P25 && <BarCol value={`${formatNum(prixM2P25)} €`} height={55} label="P25" color="#64748b" />}
                  <BarCol value={`${formatNum(prixM2Median)} €`} height={72} label="Médiane" color="#64748b" />
                  <BarCol value={`${formatNum(prixM2)} €`} height={82} label="Ce bien" color="#6c63ff" accent />
                  {prixM2P75 && <BarCol value={`${formatNum(prixM2P75)} €`} height={88} label="P75" color="#64748b" />}
                </div>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-4 text-geo-text2">Scores marché</h3>
            <div className="grid grid-cols-2 gap-3">
              <DataItem
                label="Tension prix"
                value={addr.score_tension_prix ? `${addr.score_tension_prix} / 10` : "—"}
                context={Number(addr.score_tension_prix) >= 7 ? "Forte demande" : Number(addr.score_tension_prix) >= 4 ? "Demande modérée" : "Faible demande"}
                accent
              />
              <DataItem
                label="Liquidité marché"
                value={addr.score_liquidite_marche ? `${addr.score_liquidite_marche} / 10` : "—"}
                context={Number(addr.score_liquidite_marche) >= 7 ? "Rotation rapide" : "Rotation modérée"}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* 3. PERFORMANCE ÉNERGÉTIQUE */}
      <Section title="Performance énergétique (DPE)" icon="⚡">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold mb-4 text-geo-text2">Diagnostic de ce bien</h3>
            <div className="grid grid-cols-2 gap-3">
              <DataItem label="Classe énergie" value={dpeClasse ?? "N/A"} context={addr.dpe_conso_m2 ? `${addr.dpe_conso_m2} kWh/m²/an` : undefined} valueColor={dpeClasse ? DPE_BG[dpeClasse] : undefined} />
              <DataItem label="Classe GES" value={addr.dpe_classe_ges ?? "—"} />
              <DataItem label="Surface DPE" value={addr.dpe_surface ? `${addr.dpe_surface} m²` : "—"} context={addr.dpe_date ? `Diagnostiqué le ${addr.dpe_date}` : undefined} />
              <DataItem label="Type bâtiment" value={addr.dpe_type_batiment ?? "—"} />
            </div>

            {/* DPE Scale */}
            <h3 className="text-sm font-semibold mt-6 mb-3 text-geo-text2">Échelle DPE</h3>
            <div className="flex flex-col gap-1">
              {["A", "B", "C", "D", "E", "F", "G"].map((cls) => (
                <div key={cls} className="flex items-center gap-2 h-7">
                  <div
                    className={`h-full rounded-r-full flex items-center pl-2.5 text-xs font-bold text-white transition-transform ${cls === dpeClasse ? "ring-2 ring-white/30 scale-y-110 z-10" : ""}`}
                    style={{ width: DPE_WIDTHS[cls], backgroundColor: DPE_BG[cls] }}
                  >
                    {cls}
                  </div>
                  <span className="text-[11px] text-geo-text2 whitespace-nowrap">
                    {DPE_THRESHOLDS[cls]}
                    {cls === dpeClasse && addr.dpe_conso_m2 && (
                      <strong className="text-geo-text ml-1">· Ce bien : {addr.dpe_conso_m2} kWh</strong>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4 text-geo-text2">Répartition DPE dans le quartier</h3>
            {(addr.dpe_pct_ab_iris || addr.dpe_pct_cd_iris || addr.dpe_pct_efg_iris) && (
              <div className="flex items-end gap-3 h-36 mb-4">
                {addr.dpe_pct_ab_iris && (
                  <BarCol
                    value={`${addr.dpe_pct_ab_iris}%`}
                    height={Math.min(Number(addr.dpe_pct_ab_iris) * 1.2, 95)}
                    label="A – B"
                    color="#16a34a"
                  />
                )}
                {addr.dpe_pct_cd_iris && (
                  <BarCol
                    value={`${addr.dpe_pct_cd_iris}%`}
                    height={Math.min(Number(addr.dpe_pct_cd_iris) * 1.2, 95)}
                    label="C – D"
                    color="#d97706"
                  />
                )}
                {addr.dpe_pct_efg_iris && (
                  <BarCol
                    value={`${addr.dpe_pct_efg_iris}%`}
                    height={Math.min(Number(addr.dpe_pct_efg_iris) * 1.2, 95)}
                    label="E – F – G"
                    color="#dc2626"
                  />
                )}
              </div>
            )}

            {/* Potentiel réno */}
            {addr.score_potentiel_dpe && (
              <div className="mt-4">
                <DataItem
                  label="Score potentiel rénovation"
                  value={`${addr.score_potentiel_dpe} / 10`}
                  context={Number(addr.score_potentiel_dpe) >= 7 ? "Fort potentiel de rénovation énergétique" : Number(addr.score_potentiel_dpe) <= 3 ? "Bien déjà performant" : "Potentiel modéré"}
                  accent
                />
              </div>
            )}

            {/* Rénovation */}
            {addr.reno_cible_classe && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <DataItem label="Classe cible réno" value={addr.reno_cible_classe} />
                <DataItem label="Coût estimé" value={addr.reno_cout_estime ? `${formatNum(Number(addr.reno_cout_estime))} €` : "—"} />
                <DataItem label="Aides estimées" value={addr.reno_aides_estimees ? `${formatNum(Number(addr.reno_aides_estimees))} €` : "—"} />
                <DataItem label="Plus-value" value={addr.reno_plus_value_pct ? `+${addr.reno_plus_value_pct}%` : "—"} />
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* 4. SCORES QUARTIER */}
      <Section title="Qualité de vie — Scores du quartier" icon="📊">
        <p className="text-sm text-geo-text2 mb-4">
          Scores calculés à partir de la Base Permanente des Équipements (BPE, INSEE).
          {addr.bpe_nb_equipements && <> Le quartier compte <strong className="text-geo-text">{addr.bpe_nb_equipements} équipements</strong> référencés.</>}
        </p>
        <div className="space-y-2 mb-6">
          <ScoreRow label="Santé" value={Number(addr.bpe_score_sante) || 0} />
          <ScoreRow label="Éducation" value={Number(addr.bpe_score_education) || 0} />
          <ScoreRow label="Commerces" value={Number(addr.bpe_score_commerce) || 0} />
          <ScoreRow label="Transports" value={Number(addr.bpe_score_transport) || 0} />
          <ScoreRow label="Loisirs" value={Number(addr.bpe_score_loisirs) || 0} />
          <ScoreRow label="Global" value={Number(addr.bpe_score_global) || 0} accent />
        </div>
      </Section>

      {/* 5. SOCIO-DEMO */}
      <Section title="Profil sociodémographique" icon="👥">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold mb-4 text-geo-text2">Le quartier (IRIS {addr.code_iris ?? "—"})</h3>
            <div className="grid grid-cols-2 gap-3">
              <DataItem label="Population IRIS" value={addr.iris_population ? `${formatNum(addr.iris_population)} hab.` : "—"} context={addr.iris_nb_residences_principales ? `${formatNum(addr.iris_nb_residences_principales)} résidences principales` : undefined} />
              <DataItem label="Revenu médian" value={addr.iris_revenu_median ? `${formatNum(Number(addr.iris_revenu_median))} €` : "—"} context="Par UC / an — INSEE Filosofi" />
              <DataItem label="Taux de pauvreté" value={pct(addr.iris_taux_pauvrete)} />
              <DataItem label="Taux de chômage" value={pct(addr.iris_taux_chomage)} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-4 text-geo-text2">Pyramide des âges (IRIS)</h3>
            <div className="flex items-end gap-3 h-32 mb-3">
              {addr.iris_part_0_14 && <BarCol value={`${addr.iris_part_0_14}%`} height={Math.min(Number(addr.iris_part_0_14) * 3, 95)} label="0-14" color="#a3e635" />}
              {addr.iris_part_15_29 && <BarCol value={`${addr.iris_part_15_29}%`} height={Math.min(Number(addr.iris_part_15_29) * 3, 95)} label="15-29" color="#22d3ee" />}
              {addr.iris_part_30_44 && <BarCol value={`${addr.iris_part_30_44}%`} height={Math.min(Number(addr.iris_part_30_44) * 3, 95)} label="30-44" color="#818cf8" />}
              {addr.iris_part_60_plus && <BarCol value={`${addr.iris_part_60_plus}%`} height={Math.min(Number(addr.iris_part_60_plus) * 3, 95)} label="60+" color="#f472b6" />}
            </div>
            {addr.commune_age_moyen && (
              <p className="text-xs text-geo-text2">
                Âge moyen de la commune : <strong className="text-geo-text">{addr.commune_age_moyen} ans</strong>
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* 6. RISQUES */}
      <Section title="Risques naturels et environnement" icon="⚠️">
        <div className="flex gap-2 flex-wrap mb-6">
          <RiskPill label="Inondation" active={addr.commune_risque_inondation === true} />
          <RiskPill label="Argile — Retrait-gonflement" active={addr.commune_risque_argile === true} />
          <RiskPill
            label={`Séisme — Zone ${addr.commune_risque_seisme ?? "?"}`}
            level={Number(addr.commune_risque_seisme) >= 3 ? "high" : Number(addr.commune_risque_seisme) >= 2 ? "medium" : "low"}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 gap-3">
            <DataItem label="Arrêtés CatNat" value={addr.commune_nb_catnat?.toString() ?? "—"} context="Catastrophes naturelles reconnues" />
            <DataItem label="Zone climatique" value={addr.commune_zone_climatique ?? "—"} context={addr.commune_dju_chauffage ? `DJU : ${addr.commune_dju_chauffage}` : undefined} />
          </div>
        </div>
      </Section>

      {/* 7. POUR LES FAMILLES */}
      <Section title="S'installer en famille" icon="👨‍👩‍👧‍👦">
        <p className="text-sm text-geo-text2 mb-4">
          Indicateurs clés pour évaluer ce quartier en tant que famille avec enfants.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-semibold mb-3 text-geo-text2">Éducation &amp; enfance</h3>
            <div className="space-y-2">
              <ScoreRow label="Éducation" value={Number(addr.bpe_score_education) || 0} />
              <ScoreRow label="Loisirs" value={Number(addr.bpe_score_loisirs) || 0} />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <DataItem label="Familles (0-14 ans)" value={addr.iris_part_0_14 ? `${addr.iris_part_0_14}%` : "—"} context={Number(addr.iris_part_0_14) > 20 ? "Quartier familial" : Number(addr.iris_part_0_14) > 15 ? "Mixte" : "Peu d'enfants"} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 text-geo-text2">Santé &amp; sécurité</h3>
            <div className="space-y-2">
              <ScoreRow label="Santé" value={Number(addr.bpe_score_sante) || 0} />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <DataItem label="Risque inondation" value={addr.commune_risque_inondation ? "Zone exposée" : "Non concerné"} context={addr.commune_risque_inondation ? "Vérifier le PPRI de la commune" : "Pas de risque identifié"} valueColor={addr.commune_risque_inondation ? "#ef4444" : "#22c55e"} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 text-geo-text2">Cadre de vie</h3>
            <div className="space-y-2">
              <ScoreRow label="Commerces" value={Number(addr.bpe_score_commerce) || 0} />
              <ScoreRow label="Transports" value={Number(addr.bpe_score_transport) || 0} />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <DataItem label="Âge moyen" value={addr.commune_age_moyen ? `${addr.commune_age_moyen} ans` : "—"} context={Number(addr.commune_age_moyen) < 38 ? "Population jeune" : Number(addr.commune_age_moyen) < 42 ? "Population mixte" : "Population vieillissante"} />
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-geo-bg rounded-lg text-sm text-geo-text2">
          <strong className="text-geo-text">Verdict famille :</strong>{" "}
          {(() => {
            const scoreEduc = Number(addr.bpe_score_education) || 0;
            const scoreSante = Number(addr.bpe_score_sante) || 0;
            const scoreTransport = Number(addr.bpe_score_transport) || 0;
            const familyScore = Math.round((scoreEduc + scoreSante + scoreTransport) / 3);
            if (familyScore >= 70) return `Ce quartier est très bien adapté aux familles (score ${familyScore}/100). Bonne couverture en écoles, services de santé et transports.`;
            if (familyScore >= 40) return `Quartier correct pour les familles (score ${familyScore}/100). Quelques services à proximité, mais vérifiez les distances aux établissements scolaires.`;
            return `Quartier peu adapté aux familles (score ${familyScore}/100). Services éducatifs et de santé limités à proximité.`;
          })()}
        </div>
      </Section>

      {/* 8. POUR LES INVESTISSEURS */}
      <Section title="Analyse investisseur" icon="📈">
        <p className="text-sm text-geo-text2 mb-4">
          Indicateurs de rentabilité et de potentiel pour un investissement locatif ou patrimonial.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <DataItem
            label="Estimation bien"
            value={estimation ? `${formatNum(estimation)} €` : "—"}
            context={estimBas && estimHaut ? `${formatNum(estimBas)} – ${formatNum(estimHaut)} €` : undefined}
            accent
          />
          <DataItem
            label="Prix / m²"
            value={prixM2 ? `${formatNum(prixM2)} €` : prixM2Median ? `~${formatNum(prixM2Median)} €` : "—"}
            context="DVF"
          />
          <DataItem
            label="Tension marché"
            value={addr.score_tension_prix ? `${addr.score_tension_prix} / 10` : "—"}
            context={Number(addr.score_tension_prix) >= 7 ? "Marché très tendu" : Number(addr.score_tension_prix) >= 4 ? "Demande modérée" : "Marché détendu"}
          />
          <DataItem
            label="Liquidité"
            value={addr.score_liquidite_marche ? `${addr.score_liquidite_marche} / 10` : "—"}
            context={Number(addr.score_liquidite_marche) >= 7 ? "Revente facile" : Number(addr.score_liquidite_marche) >= 4 ? "Délai moyen" : "Revente longue"}
          />
        </div>
        {/* ROI rénovation */}
        {addr.reno_cible_classe && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-geo-text2">Potentiel rénovation → plus-value</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <DataItem label="DPE actuel" value={dpeClasse ?? "—"} valueColor={dpeClasse ? DPE_BG[dpeClasse] : undefined} />
              <DataItem label="DPE cible" value={addr.reno_cible_classe} valueColor={DPE_BG[addr.reno_cible_classe] || undefined} />
              <DataItem label="Coût travaux" value={addr.reno_cout_estime ? `${formatNum(Number(addr.reno_cout_estime))} €` : "—"} />
              <DataItem label="Aides déductibles" value={addr.reno_aides_estimees ? `${formatNum(Number(addr.reno_aides_estimees))} €` : "—"} context="MaPrimeRénov + CEE" />
              <DataItem label="Plus-value estimée" value={addr.reno_plus_value_pct ? `+${addr.reno_plus_value_pct}%` : "—"} accent />
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-geo-bg rounded-lg">
            <h3 className="text-sm font-semibold mb-2 text-geo-text2">Points forts</h3>
            <ul className="space-y-1 text-sm text-geo-text2">
              {Number(addr.bpe_score_global) >= 70 && <li className="flex gap-2"><span className="text-green-400">+</span> Quartier bien équipé ({addr.bpe_score_global}/100)</li>}
              {Number(addr.score_tension_prix) >= 6 && <li className="flex gap-2"><span className="text-green-400">+</span> Marché tendu — valorisation probable</li>}
              {Number(addr.score_potentiel_dpe) >= 7 && <li className="flex gap-2"><span className="text-green-400">+</span> Fort potentiel rénovation DPE</li>}
              {Number(addr.commune_evolution_pop) > 2 && <li className="flex gap-2"><span className="text-green-400">+</span> Commune en croissance ({addr.commune_evolution_pop}%)</li>}
              {addr.iris_revenu_median && Number(addr.iris_revenu_median) > 22000 && <li className="flex gap-2"><span className="text-green-400">+</span> Revenus médians élevés ({formatNum(Number(addr.iris_revenu_median))} €)</li>}
            </ul>
          </div>
          <div className="p-4 bg-geo-bg rounded-lg">
            <h3 className="text-sm font-semibold mb-2 text-geo-text2">Points de vigilance</h3>
            <ul className="space-y-1 text-sm text-geo-text2">
              {Number(addr.score_liquidite_marche) < 4 && <li className="flex gap-2"><span className="text-red-400">−</span> Liquidité faible — revente lente</li>}
              {addr.commune_risque_inondation && <li className="flex gap-2"><span className="text-red-400">−</span> Zone inondable — surprime assurance</li>}
              {dpeClasse && ["F", "G"].includes(dpeClasse) && <li className="flex gap-2"><span className="text-red-400">−</span> Passoire énergétique — interdiction de location programmée</li>}
              {Number(addr.iris_taux_pauvrete) > 20 && <li className="flex gap-2"><span className="text-red-400">−</span> Taux de pauvreté élevé ({addr.iris_taux_pauvrete}%)</li>}
              {Number(addr.commune_nb_catnat) > 30 && <li className="flex gap-2"><span className="text-red-400">−</span> Historique CatNat important ({addr.commune_nb_catnat} arrêtés)</li>}
            </ul>
          </div>
        </div>
      </Section>

      {/* 9. POUR LES ARTISANS */}
      <Section title="Potentiel travaux & rénovation" icon="🔧">
        <p className="text-sm text-geo-text2 mb-4">
          Données utiles pour les artisans, entreprises du bâtiment et diagnostiqueurs.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold mb-3 text-geo-text2">État énergétique du bien</h3>
            <div className="grid grid-cols-2 gap-3">
              <DataItem label="DPE actuel" value={dpeClasse ?? "Non diagnostiqué"} valueColor={dpeClasse ? DPE_BG[dpeClasse] : undefined} />
              <DataItem label="Consommation" value={addr.dpe_conso_m2 ? `${addr.dpe_conso_m2} kWh/m²/an` : "—"} />
              <DataItem label="Surface" value={addr.dpe_surface ? `${addr.dpe_surface} m²` : addr.dvf_derniere_surface ? `${addr.dvf_derniere_surface} m²` : "—"} />
              <DataItem label="Type" value={addr.dpe_type_batiment ?? addr.dvf_dernier_type ?? "—"} />
            </div>
            {addr.reno_cible_classe && (
              <div className="mt-4 p-3 bg-geo-accent/10 border border-geo-accent/20 rounded-lg">
                <div className="text-xs text-geo-accent font-semibold uppercase tracking-wider mb-1">Scénario rénovation</div>
                <div className="text-sm text-geo-text">
                  Passage de <strong>{dpeClasse}</strong> à <strong>{addr.reno_cible_classe}</strong> —
                  budget estimé <strong>{addr.reno_cout_estime ? `${formatNum(Number(addr.reno_cout_estime))} €` : "N/A"}</strong>
                  {addr.reno_reste_charge && <> (reste à charge : <strong>{formatNum(Number(addr.reno_reste_charge))} €</strong>)</>}
                </div>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 text-geo-text2">Contexte quartier — potentiel marché</h3>
            <div className="grid grid-cols-2 gap-3">
              <DataItem label="% DPE E-F-G quartier" value={addr.dpe_pct_efg_iris ? `${addr.dpe_pct_efg_iris}%` : "—"} context={Number(addr.dpe_pct_efg_iris) > 30 ? "Fort gisement de rénovation" : "Gisement modéré"} />
              <DataItem label="Score réno" value={addr.score_potentiel_dpe ? `${addr.score_potentiel_dpe}/10` : "—"} accent />
              <DataItem label="Zone climatique" value={addr.commune_zone_climatique ?? "—"} context={addr.commune_dju_chauffage ? `${addr.commune_dju_chauffage} DJU` : undefined} />
              <DataItem label="Aides disponibles" value={addr.reno_aides_estimees ? `${formatNum(Number(addr.reno_aides_estimees))} €` : "—"} context="MaPrimeRénov + CEE estimés" />
            </div>
            <div className="mt-4 p-4 bg-geo-bg rounded-lg text-sm text-geo-text2">
              <strong className="text-geo-text">Potentiel artisan :</strong>{" "}
              {Number(addr.dpe_pct_efg_iris) > 30
                ? `Plus de ${addr.dpe_pct_efg_iris}% des logements du quartier sont classés E, F ou G — fort potentiel de prospection pour les travaux d'isolation et de chauffage.`
                : addr.dpe_pct_efg_iris
                  ? `${addr.dpe_pct_efg_iris}% des logements du quartier sont encore mal classés — marché de rénovation accessible.`
                  : "Données DPE quartier non disponibles."}
            </div>
          </div>
        </div>
      </Section>

      {/* 10. POUR LES ASSUREURS */}
      <Section title="Profil de risque — Assurance" icon="🛡️">
        <p className="text-sm text-geo-text2 mb-4">
          Synthèse des risques naturels, climatiques et historiques pour l&apos;évaluation du profil assurable.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <DataItem
            label="Inondation"
            value={addr.commune_risque_inondation ? "Exposé" : "Non exposé"}
            valueColor={addr.commune_risque_inondation ? "#ef4444" : "#22c55e"}
            context={addr.commune_risque_inondation ? "Surprime possible" : "Risque standard"}
          />
          <DataItem
            label="Argile"
            value={addr.commune_risque_argile ? "Exposé" : "Non exposé"}
            valueColor={addr.commune_risque_argile ? "#f59e0b" : "#22c55e"}
            context={addr.commune_risque_argile ? "Risque de fissures" : "Sol stable"}
          />
          <DataItem
            label="Séisme"
            value={`Zone ${addr.commune_risque_seisme ?? "?"}`}
            context={Number(addr.commune_risque_seisme) >= 4 ? "Zone à risque élevé" : Number(addr.commune_risque_seisme) >= 3 ? "Risque modéré" : "Risque faible"}
          />
          <DataItem
            label="Arrêtés CatNat"
            value={addr.commune_nb_catnat?.toString() ?? "—"}
            context={Number(addr.commune_nb_catnat) > 30 ? "Commune très exposée" : Number(addr.commune_nb_catnat) > 10 ? "Historique significatif" : "Peu d'événements"}
            accent
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold mb-3 text-geo-text2">Scoring risque global</h3>
            {(() => {
              let score = 0;
              if (addr.commune_risque_inondation) score += 3;
              if (addr.commune_risque_argile) score += 2;
              if (Number(addr.commune_risque_seisme) >= 3) score += 2;
              if (Number(addr.commune_nb_catnat) > 30) score += 2;
              if (Number(addr.commune_nb_catnat) > 10) score += 1;
              const level = score >= 6 ? "Élevé" : score >= 3 ? "Modéré" : "Faible";
              const color = score >= 6 ? "#ef4444" : score >= 3 ? "#f59e0b" : "#22c55e";
              return (
                <div className="p-4 bg-geo-bg rounded-lg">
                  <div className="text-2xl font-bold mb-1" style={{ color }}>{level}</div>
                  <div className="text-xs text-geo-text2">Score composite : {score}/10</div>
                  <div className="w-full h-3 bg-geo-surface rounded-full mt-2 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${score * 10}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })()}
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 text-geo-text2">Climat &amp; chauffage</h3>
            <div className="grid grid-cols-2 gap-3">
              <DataItem label="Zone climatique" value={addr.commune_zone_climatique ?? "—"} />
              <DataItem label="DJU chauffage" value={addr.commune_dju_chauffage?.toString() ?? "—"} context="Degré-jours unifiés" />
              <DataItem label="DPE" value={dpeClasse ?? "—"} context={addr.dpe_conso_m2 ? `${addr.dpe_conso_m2} kWh/m²/an` : undefined} />
              <DataItem label="Type bâtiment" value={addr.dpe_type_batiment ?? addr.dvf_dernier_type ?? "—"} />
            </div>
          </div>
        </div>
      </Section>

      {/* 11. POUR LES BANQUIERS */}
      <Section title="Analyse bancaire — Financement" icon="🏦">
        <p className="text-sm text-geo-text2 mb-4">
          Éléments d&apos;appréciation pour l&apos;octroi de crédit immobilier et la valorisation patrimoniale.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <DataItem
            label="Valeur estimée"
            value={estimation ? `${formatNum(estimation)} €` : "—"}
            context={estimBas && estimHaut ? `Fourchette : ${formatNum(estimBas)} – ${formatNum(estimHaut)} €` : undefined}
            accent
          />
          <DataItem
            label="Prix / m²"
            value={prixM2 ? `${formatNum(prixM2)} €` : prixM2Median ? `~${formatNum(prixM2Median)} €` : "—"}
            context={prixM2Median ? `Médiane IRIS : ${formatNum(prixM2Median)} €` : undefined}
          />
          <DataItem
            label="Surface"
            value={addr.dvf_derniere_surface ? `${addr.dvf_derniere_surface} m²` : addr.dpe_surface ? `${addr.dpe_surface} m²` : "—"}
          />
          <DataItem
            label="Type de bien"
            value={addr.dvf_dernier_type ?? "—"}
            context={addr.dvf_dernier_nb_pieces ? `${addr.dvf_dernier_nb_pieces} pièces` : undefined}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold mb-3 text-geo-text2">Indicateurs de marché</h3>
            <div className="grid grid-cols-2 gap-3">
              <DataItem label="Tension marché" value={addr.score_tension_prix ? `${addr.score_tension_prix}/10` : "—"} context={Number(addr.score_tension_prix) >= 7 ? "Marché porteur" : "Marché calme"} />
              <DataItem label="Liquidité" value={addr.score_liquidite_marche ? `${addr.score_liquidite_marche}/10` : "—"} context={Number(addr.score_liquidite_marche) >= 7 ? "Garantie solide" : "Risque de revente"} />
              <DataItem label="Transactions IRIS" value={addr.dvf_nb_transactions_iris?.toString() ?? "—"} context="Volume DVF" />
              <DataItem label="Évolution pop." value={addr.commune_evolution_pop ? `${Number(addr.commune_evolution_pop) > 0 ? "+" : ""}${addr.commune_evolution_pop}%` : "—"} context="Dynamisme démographique" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 text-geo-text2">Simulation indicative (taux 3.5%, 20 ans)</h3>
            {(() => {
              const valeur = estimation || (prixM2Median && addr.dvf_derniere_surface ? prixM2Median * Number(addr.dvf_derniere_surface) : null);
              if (!valeur) return <p className="text-sm text-geo-text2">Estimation insuffisante pour simuler.</p>;
              const apport10 = Math.round(valeur * 0.1);
              const emprunt = valeur - apport10;
              const taux = 0.035 / 12;
              const n = 240;
              const mensualite = Math.round(emprunt * (taux * Math.pow(1 + taux, n)) / (Math.pow(1 + taux, n) - 1));
              const coutTotal = mensualite * n;
              return (
                <div className="grid grid-cols-2 gap-3">
                  <DataItem label="Apport 10%" value={`${formatNum(apport10)} €`} />
                  <DataItem label="Emprunt" value={`${formatNum(emprunt)} €`} />
                  <DataItem label="Mensualité" value={`${formatNum(mensualite)} €/mois`} accent />
                  <DataItem label="Coût total crédit" value={`${formatNum(coutTotal)} €`} context={`Dont ${formatNum(coutTotal - emprunt)} € d'intérêts`} />
                </div>
              );
            })()}
          </div>
        </div>
      </Section>

      {/* 12. SÉCURITÉ */}
      <Section title="Sécurité &amp; tranquillité" icon="🔒">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="grid grid-cols-2 gap-3">
              <DataItem
                label="Taux de pauvreté"
                value={addr.iris_taux_pauvrete ? `${addr.iris_taux_pauvrete}%` : "—"}
                context={Number(addr.iris_taux_pauvrete) > 25 ? "Quartier sensible" : Number(addr.iris_taux_pauvrete) > 15 ? "Niveau moyen" : "Quartier aisé"}
              />
              <DataItem
                label="Taux de chômage"
                value={addr.iris_taux_chomage ? `${Number(addr.iris_taux_chomage).toFixed(1)}%` : "—"}
                context={Number(addr.iris_taux_chomage) > 15 ? "Supérieur à la moyenne" : "Dans la moyenne"}
              />
              <DataItem label="Revenu médian" value={addr.iris_revenu_median ? `${formatNum(Number(addr.iris_revenu_median))} €` : "—"} context="Par UC / an" />
              <DataItem label="Population IRIS" value={addr.iris_population ? formatNum(addr.iris_population) : "—"} />
            </div>
          </div>
          <div className="p-4 bg-geo-bg rounded-lg">
            <h3 className="text-sm font-semibold mb-2 text-geo-text2">Indicateurs disponibles</h3>
            <p className="text-sm text-geo-text2 leading-relaxed">
              Les statistiques de délinquance par commune (ministère de l&apos;Intérieur) et les données de la police/gendarmerie ne sont pas encore intégrées.
              Les indicateurs socio-économiques ci-contre (pauvreté, chômage, revenus) sont issus de l&apos;INSEE Filosofi et constituent un proxy utilisé par les professionnels.
            </p>
            <div className="mt-3 text-xs text-geo-accent">Enrichissement prévu : stats ministère Intérieur + proximité commissariat/gendarmerie</div>
          </div>
        </div>
      </Section>

      {/* 13. COMMERCES & POI */}
      <Section title="Commerces &amp; services de proximité" icon="🛒">
        <p className="text-sm text-geo-text2 mb-4">
          Couverture en équipements de proximité — source : Base Permanente des Équipements (INSEE).
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-geo-bg rounded-lg text-center">
            <div className="text-2xl mb-1">🏥</div>
            <ScoreRow label="Santé" value={Number(addr.bpe_score_sante) || 0} />
            <div className="text-xs text-geo-text2 mt-1">Médecins, pharmacies, hôpitaux</div>
          </div>
          <div className="p-3 bg-geo-bg rounded-lg text-center">
            <div className="text-2xl mb-1">🎓</div>
            <ScoreRow label="Éducation" value={Number(addr.bpe_score_education) || 0} />
            <div className="text-xs text-geo-text2 mt-1">Écoles, collèges, lycées</div>
          </div>
          <div className="p-3 bg-geo-bg rounded-lg text-center">
            <div className="text-2xl mb-1">🛍️</div>
            <ScoreRow label="Commerces" value={Number(addr.bpe_score_commerce) || 0} />
            <div className="text-xs text-geo-text2 mt-1">Supermarchés, boulangeries</div>
          </div>
          <div className="p-3 bg-geo-bg rounded-lg text-center">
            <div className="text-2xl mb-1">🚌</div>
            <ScoreRow label="Transports" value={Number(addr.bpe_score_transport) || 0} />
            <div className="text-xs text-geo-text2 mt-1">Bus, tram, gare</div>
          </div>
          <div className="p-3 bg-geo-bg rounded-lg text-center">
            <div className="text-2xl mb-1">🎭</div>
            <ScoreRow label="Loisirs" value={Number(addr.bpe_score_loisirs) || 0} />
            <div className="text-xs text-geo-text2 mt-1">Cinémas, piscines, parcs</div>
          </div>
          <div className="p-3 bg-geo-bg rounded-lg text-center">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-lg font-bold text-geo-accent">{addr.bpe_nb_equipements ?? "—"}</div>
            <div className="text-xs text-geo-text2 mt-1">Équipements totaux</div>
          </div>
        </div>
        <div className="text-xs text-geo-accent">Enrichissement prévu : noms et distances via OpenStreetMap Overpass</div>
      </Section>

      {/* 14. ACTUALITÉS LOCALES */}
      <Section title={`Actualités — ${addr.nom_commune}`} icon="📰">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold mb-3 text-geo-text2">Commune en bref</h3>
            {addr.commune_wiki_summary && (
              <p className="text-sm text-geo-text2 leading-relaxed mb-3">{addr.commune_wiki_summary}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <DataItem label="Population" value={formatNum(addr.commune_population)} context={addr.commune_evolution_pop ? `Évolution : ${Number(addr.commune_evolution_pop) > 0 ? "+" : ""}${addr.commune_evolution_pop}%` : undefined} />
              <DataItem label="Entreprises" value={formatNum(addr.commune_nb_entreprises)} context="SIRENE" />
            </div>
          </div>
          <div className="p-4 bg-geo-bg rounded-lg">
            <h3 className="text-sm font-semibold mb-2 text-geo-text2">Fil d&apos;actualités</h3>
            <p className="text-sm text-geo-text2 leading-relaxed">
              Le module d&apos;actualités locales est en cours de développement. Il agrégera les flux RSS des mairies,
              les publications de la communauté de communes et les articles de presse locale liés à {addr.nom_commune}.
            </p>
            <div className="mt-3 text-xs text-geo-accent">Enrichissement prévu : flux RSS mairie + Google News local</div>
          </div>
        </div>
      </Section>

      {/* 15. COMMUNE */}
      {addr.commune_wiki_summary && (
        <Section title={`À propos de ${addr.nom_commune}`} icon="🏘️">
          <p className="text-sm text-geo-text2 leading-relaxed">
            {addr.commune_wiki_summary}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <DataItem label="Population" value={formatNum(addr.commune_population)} />
            <DataItem label="Densité" value={addr.commune_densite ? `${formatNum(Math.round(Number(addr.commune_densite)))} hab/km²` : "—"} />
            <DataItem label="Entreprises" value={formatNum(addr.commune_nb_entreprises)} />
            <DataItem label="Âge moyen" value={addr.commune_age_moyen ? `${addr.commune_age_moyen} ans` : "—"} />
          </div>
          {addr.commune_wiki_url && (
            <a href={addr.commune_wiki_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 text-sm text-geo-accent hover:underline">
              En savoir plus sur Wikipédia →
            </a>
          )}
        </Section>
      )}

      {/* FOOTER SOURCES */}
      <div className="mt-10 pt-6 border-t border-geo-border text-xs text-geo-text2">
        <strong>Sources :</strong> DVF (data.gouv.fr) · ADEME DPE · INSEE Recensement &amp; Filosofi · BPE (INSEE) · Géorisques (BRGM) · BAN · SIRENE
        {addr.page_generated_at && (
          <span className="ml-2">· Dernière mise à jour : {new Date(addr.page_generated_at).toLocaleDateString("fr-FR")}</span>
        )}
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
              address: {
                "@type": "PostalAddress",
                streetAddress: `${addr.numero} ${addr.nom_voie}`,
                addressLocality: addr.nom_commune,
                postalCode: addr.code_postal,
                addressRegion: "Nouvelle-Aquitaine",
                addressCountry: "FR",
              },
              ...(addr.latitude && addr.longitude ? {
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: addr.latitude,
                  longitude: addr.longitude,
                },
              } : {}),
              additionalProperty: [
                estimation && { "@type": "PropertyValue", name: "Prix estimé", value: `${formatNum(estimation)} €` },
                prixM2 && { "@type": "PropertyValue", name: "Prix au m²", value: `${formatNum(prixM2)} €/m²` },
                dpeClasse && { "@type": "PropertyValue", name: "DPE", value: dpeClasse },
                addr.dvf_derniere_surface && { "@type": "PropertyValue", name: "Surface", value: `${addr.dvf_derniere_surface} m²` },
                addr.bpe_score_global && { "@type": "PropertyValue", name: "Score quartier", value: `${addr.bpe_score_global}/100` },
              ].filter(Boolean),
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Accueil", item: "https://app.intentanalytics.fr" },
                { "@type": "ListItem", position: 2, name: villeName, item: `https://app.intentanalytics.fr/${params.cp}/${params.ville}` },
                { "@type": "ListItem", position: 3, name: voieName, item: `https://app.intentanalytics.fr/${params.cp}/${params.ville}/${params.voie}` },
                { "@type": "ListItem", position: 4, name: `N°${params.numero}`, item: `https://app.intentanalytics.fr/${params.cp}/${params.ville}/${params.voie}/${params.numero}` },
              ],
            },
          ]),
        }}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-geo-surface border border-geo-border rounded-xl p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4 pb-3 border-b border-geo-border flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function MetricCard({ value, label, detail, valueColor }: { value: string; label: string; detail?: string; valueColor?: string }) {
  return (
    <div className="bg-geo-bg border border-geo-border rounded-xl p-4 text-center">
      <div className="text-xl font-bold" style={valueColor ? { color: valueColor } : { color: "#6c63ff" }}>{value}</div>
      <div className="text-[11px] text-geo-text2 uppercase tracking-wider mt-1">{label}</div>
      {detail && <div className="text-xs text-geo-text2 mt-1">{detail}</div>}
    </div>
  );
}

function DataItem({ label, value, context, accent, valueColor }: { label: string; value: string; context?: string; accent?: boolean; valueColor?: string }) {
  return (
    <div className="p-3 bg-geo-bg rounded-lg">
      <div className="text-[11px] text-geo-text2 uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold mt-0.5" style={valueColor ? { color: valueColor } : accent ? { color: "#6c63ff" } : undefined}>{value}</div>
      {context && <div className="text-xs text-geo-text2 mt-0.5">{context}</div>}
    </div>
  );
}

function ScoreRow({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  const color = accent ? "#6c63ff" : value >= 70 ? "#16a34a" : value >= 40 ? "#d97706" : "#dc2626";
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-sm font-medium text-right text-geo-text2">{label}</span>
      <div className="flex-1 h-6 bg-geo-bg rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full flex items-center justify-end pr-2 text-xs font-bold text-white"
          style={{ width: `${value}%`, backgroundColor: color }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function BarCol({ value, height, label, color, accent }: { value: string; height: number; label: string; color: string; accent?: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center h-full justify-end">
      <div className={`text-[11px] font-semibold mb-1 ${accent ? "text-geo-accent" : "text-geo-text2"}`}>{value}</div>
      <div className="w-full max-w-[60px] rounded-t-md" style={{ height: `${height}%`, backgroundColor: color }} />
      <div className="text-[10px] text-geo-text2 mt-1">{label}</div>
    </div>
  );
}

function RiskPill({ label, active, level }: { label: string; active?: boolean; level?: "high" | "medium" | "low" }) {
  const resolved = level ?? (active ? "high" : "low");
  const classes = {
    high: "bg-red-500/15 text-red-400",
    medium: "bg-yellow-500/15 text-yellow-400",
    low: "bg-green-500/15 text-green-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${classes[resolved]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}{active !== undefined && ` — ${active ? "Zone exposée" : "Non concerné"}`}
    </span>
  );
}
