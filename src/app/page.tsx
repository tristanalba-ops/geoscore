export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-center">
      <h1 className="text-4xl font-bold mb-4">
        L'intelligence territoriale
        <br />
        <span className="text-geo-accent">à l'adresse près</span>
      </h1>
      <p className="text-geo-text2 text-lg mb-10 max-w-2xl mx-auto">
        Estimation, DPE, risques naturels, équipements, démographie — croisez 13
        sources de données publiques sur n'importe quelle adresse en France.
      </p>

      {/* Barre de recherche — MVP */}
      <form
        action="/recherche"
        method="GET"
        className="max-w-xl mx-auto flex gap-3"
      >
        <input
          type="text"
          name="q"
          placeholder="Entrez une adresse... ex: 15 rue du Colonel Rozanoff 33520 Bruges"
          className="flex-1 bg-geo-surface border border-geo-border rounded-xl px-5 py-3.5 text-geo-text placeholder:text-geo-text2 focus:outline-none focus:ring-2 focus:ring-geo-accent/40 transition"
        />
        <button
          type="submit"
          className="bg-geo-accent hover:bg-geo-accent/80 text-white font-semibold px-6 py-3.5 rounded-xl transition"
        >
          Analyser
        </button>
      </form>

      {/* Exemples */}
      <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
        <a
          href="/33520/bruges/rue-du-colonel-rozanoff/15"
          className="bg-geo-surface border border-geo-border rounded-full px-4 py-2 text-geo-text2 hover:text-geo-accent hover:border-geo-accent/40 transition"
        >
          15 Rue Colonel Rozanoff, Bruges
        </a>
        <a
          href="/33700/merignac/avenue-de-foncastel/14"
          className="bg-geo-surface border border-geo-border rounded-full px-4 py-2 text-geo-text2 hover:text-geo-accent hover:border-geo-accent/40 transition"
        >
          14 Avenue de Foncastel, Mérignac
        </a>
      </div>

      {/* Stats */}
      <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {[
          { value: "24M", label: "Adresses" },
          { value: "13", label: "Sources croisées" },
          { value: "35K", label: "Communes" },
          { value: "12M", label: "Transactions DVF" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-geo-surface border border-geo-border rounded-2xl p-6"
          >
            <div className="text-2xl font-bold text-geo-accent">
              {stat.value}
            </div>
            <div className="text-sm text-geo-text2 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
