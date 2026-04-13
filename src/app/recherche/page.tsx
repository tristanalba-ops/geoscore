"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface BanResult {
  properties: {
    label: string;
    housenumber?: string;
    street?: string;
    name: string;
    postcode: string;
    city: string;
    type: string;
    score: number;
  };
  geometry: {
    coordinates: [number, number];
  };
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildUrl(r: BanResult): string {
  const { properties: p } = r;
  const cp = p.postcode;
  const ville = slugify(p.city);

  if (p.type === "housenumber" && p.street) {
    const voie = slugify(p.street);
    const numero = p.housenumber || "0";
    return `/${cp}/${ville}/${voie}/${numero}`;
  }
  if (p.type === "street" && p.name) {
    return `/${cp}/${ville}/${slugify(p.name)}`;
  }
  // locality / municipality
  return `/${cp}/${ville}`;
}

export default function RecherchePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<BanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=8`
      );
      const data = await res.json();
      setResults(data.features || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  // Auto-search on initial query from URL
  useEffect(() => {
    if (initialQuery.length >= 3) {
      search(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    setSelected(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 250);
  };

  const handleSelect = (r: BanResult) => {
    router.push(buildUrl(r));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && selected >= 0 && results[selected]) {
      e.preventDefault();
      handleSelect(results[selected]);
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "housenumber": return "Adresse";
      case "street": return "Rue";
      case "locality": return "Lieu-dit";
      case "municipality": return "Commune";
      default: return type;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Rechercher une adresse</h1>
      <p className="text-geo-text2 mb-8">
        Tapez une adresse, une rue ou une commune pour accéder à son analyse immobilière.
      </p>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex : 15 rue du Colonel Rozanoff 33520 Bruges"
          autoFocus
          className="w-full bg-geo-surface border border-geo-border rounded-xl px-5 py-4 text-lg text-geo-text placeholder:text-geo-text2 focus:outline-none focus:ring-2 focus:ring-geo-accent/40 transition"
        />

        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-geo-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Results dropdown */}
        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-geo-surface border border-geo-border rounded-xl shadow-lg overflow-hidden z-50">
            {results.map((r, i) => (
              <button
                key={`${r.properties.label}-${i}`}
                onClick={() => handleSelect(r)}
                onMouseEnter={() => setSelected(i)}
                className={`w-full text-left px-5 py-3 flex items-center justify-between transition ${
                  i === selected
                    ? "bg-geo-accent/10 text-geo-accent"
                    : "text-geo-text hover:bg-geo-accent/5"
                }`}
              >
                <div>
                  <div className="font-medium">{r.properties.label}</div>
                  <div className="text-xs text-geo-text2 mt-0.5">
                    {r.properties.postcode} · Score : {(r.properties.score * 100).toFixed(0)}%
                  </div>
                </div>
                <span className="text-xs bg-geo-bg border border-geo-border rounded-full px-2 py-1 ml-3 shrink-0">
                  {typeLabel(r.properties.type)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {query.length >= 3 && !loading && results.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-geo-surface border border-geo-border rounded-xl px-5 py-4 text-geo-text2">
            Aucun résultat trouvé pour &quot;{query}&quot;
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="mt-12 text-sm text-geo-text2 space-y-3">
        <p className="font-medium text-geo-text">Exemples de recherche :</p>
        <div className="flex flex-wrap gap-2">
          {[
            "46 rue de Franche-Comté 01000 Bourg-en-Bresse",
            "15 rue du Colonel Rozanoff 33520 Bruges",
            "Rue de la Paix Paris",
            "33000 Bordeaux",
          ].map((ex) => (
            <button
              key={ex}
              onClick={() => handleInput(ex)}
              className="text-xs bg-geo-surface border border-geo-border rounded-full px-3 py-1.5 hover:border-geo-accent transition cursor-pointer"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Back link */}
      <div className="mt-12 pt-6 border-t border-geo-border">
        <a href="/" className="text-geo-accent hover:underline text-sm">
          ← Retour à l&apos;accueil
        </a>
      </div>
    </div>
  );
}
