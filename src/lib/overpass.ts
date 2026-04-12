// ─── Overpass API — POI proches ───────────────────────────────────
// Fetches nearby amenities from OpenStreetMap via Overpass API
// Called server-side at render time, cached via ISR (revalidate 86400)

export interface POI {
  name: string;
  type: string;       // amenity or shop category
  category: string;   // human-readable category in French
  lat: number;
  lng: number;
  distance: number;   // meters from the address
}

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Map OSM tags to French categories
const CATEGORY_MAP: Record<string, string> = {
  // Santé
  pharmacy: "Pharmacie",
  doctors: "Médecin",
  dentist: "Dentiste",
  hospital: "Hôpital",
  clinic: "Clinique",
  veterinary: "Vétérinaire",
  // Éducation
  school: "École",
  kindergarten: "Maternelle",
  college: "Collège/Lycée",
  university: "Université",
  library: "Bibliothèque",
  // Commerces
  supermarket: "Supermarché",
  bakery: "Boulangerie",
  butcher: "Boucherie",
  convenience: "Épicerie",
  greengrocer: "Primeur",
  hairdresser: "Coiffeur",
  bank: "Banque",
  post_office: "Bureau de poste",
  fuel: "Station-service",
  // Transport
  bus_station: "Gare routière",
  train_station: "Gare SNCF",
  // Loisirs
  restaurant: "Restaurant",
  cafe: "Café",
  bar: "Bar",
  cinema: "Cinéma",
  theatre: "Théâtre",
  swimming_pool: "Piscine",
  sports_centre: "Complexe sportif",
  park: "Parc",
  // Shops
  clothes: "Vêtements",
  electronics: "Électronique",
  furniture: "Mobilier",
  hardware: "Bricolage",
  optician: "Opticien",
};

function getCategory(tags: Record<string, string>): { type: string; category: string } | null {
  const amenity = tags.amenity;
  const shop = tags.shop;
  const railway = tags.railway;
  const highway = tags.highway;

  if (railway === "station" || railway === "halt") {
    return { type: "train_station", category: "Gare SNCF" };
  }
  if (highway === "bus_stop") {
    return { type: "bus_stop", category: "Arrêt de bus" };
  }
  if (amenity && CATEGORY_MAP[amenity]) {
    return { type: amenity, category: CATEGORY_MAP[amenity] };
  }
  if (shop && CATEGORY_MAP[shop]) {
    return { type: shop, category: CATEGORY_MAP[shop] };
  }
  if (amenity === "parking" || amenity === "toilets" || amenity === "bench") {
    return null; // skip uninteresting amenities
  }
  if (shop) {
    return { type: shop, category: `Commerce (${shop})` };
  }
  if (amenity) {
    return { type: amenity, category: amenity };
  }
  return null;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function fetchNearbyPOIs(
  lat: number,
  lng: number,
  radiusMeters = 1000,
  maxResults = 30
): Promise<POI[]> {
  const query = `
[out:json][timeout:10];
(
  node["amenity"~"pharmacy|doctors|dentist|hospital|clinic|school|kindergarten|college|university|library|supermarket|bakery|butcher|post_office|bank|fuel|restaurant|cafe|cinema|theatre|swimming_pool|sports_centre"](around:${radiusMeters},${lat},${lng});
  node["shop"~"supermarket|bakery|butcher|convenience|greengrocer|hairdresser|clothes|electronics|optician|hardware"](around:${radiusMeters},${lat},${lng});
  node["railway"~"station|halt"](around:${radiusMeters},${lat},${lng});
  node["highway"="bus_stop"](around:${radiusMeters},${lat},${lng});
);
out body ${maxResults * 2};
`;

  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      console.error("[Overpass] HTTP error:", res.status);
      return [];
    }

    const json = await res.json();
    const elements: any[] = json.elements || [];

    const pois: POI[] = [];
    for (const el of elements) {
      if (!el.tags || !el.lat || !el.lon) continue;
      const cat = getCategory(el.tags);
      if (!cat) continue;

      const name = el.tags.name || el.tags["name:fr"] || cat.category;
      const distance = Math.round(haversineMeters(lat, lng, el.lat, el.lon));

      pois.push({
        name,
        type: cat.type,
        category: cat.category,
        lat: el.lat,
        lng: el.lon,
        distance,
      });
    }

    // Sort by distance and deduplicate by name+type
    const seen = new Set<string>();
    return pois
      .sort((a, b) => a.distance - b.distance)
      .filter((p) => {
        const key = `${p.name}-${p.type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, maxResults);
  } catch (err) {
    console.error("[Overpass] Fetch error:", err);
    return [];
  }
}

// Group POIs by category for display
export function groupPOIsByCategory(pois: POI[]): Record<string, POI[]> {
  const groups: Record<string, POI[]> = {
    "Santé": [],
    "Éducation": [],
    "Commerces": [],
    "Transports": [],
    "Restauration": [],
    "Loisirs": [],
  };

  const categoryToGroup: Record<string, string> = {
    pharmacy: "Santé", doctors: "Santé", dentist: "Santé",
    hospital: "Santé", clinic: "Santé", veterinary: "Santé",
    school: "Éducation", kindergarten: "Éducation", college: "Éducation",
    university: "Éducation", library: "Éducation",
    supermarket: "Commerces", bakery: "Commerces", butcher: "Commerces",
    convenience: "Commerces", greengrocer: "Commerces", hairdresser: "Commerces",
    bank: "Commerces", post_office: "Commerces", fuel: "Commerces",
    clothes: "Commerces", electronics: "Commerces", optician: "Commerces",
    hardware: "Commerces",
    bus_stop: "Transports", train_station: "Transports", bus_station: "Transports",
    restaurant: "Restauration", cafe: "Restauration", bar: "Restauration",
    cinema: "Loisirs", theatre: "Loisirs", swimming_pool: "Loisirs",
    sports_centre: "Loisirs", park: "Loisirs",
  };

  for (const poi of pois) {
    const group = categoryToGroup[poi.type] || "Commerces";
    if (groups[group]) groups[group].push(poi);
  }

  return groups;
}
