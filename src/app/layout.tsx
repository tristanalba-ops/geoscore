import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Intent Analytics",
    default: "Intent Analytics — Intelligence territoriale immobilière",
  },
  description:
    "Analysez n'importe quelle adresse en France : estimation, DPE, risques, quartier, équipements. Données DVF, ADEME, INSEE croisées.",
  metadataBase: new URL("https://app.intentanalytics.fr"),
  verification: {
    google: "XLr6Pui_Qs67HT_B59vdORsRRFPJgBglr0nPm1RLJMk",
  },
  openGraph: {
    siteName: "Intent Analytics",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-geo-bg text-geo-text font-sans antialiased">
        <nav className="border-b border-geo-border px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-geo-accent">
              Intent Analytics
            </a>
            <div className="flex gap-6 text-sm text-geo-text2">
              <a href="/" className="hover:text-geo-text transition">
                Accueil
              </a>
              <a href="/recherche" className="hover:text-geo-text transition">
                Recherche
              </a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="border-t border-geo-border px-6 py-8 mt-16 text-center text-geo-text2 text-sm">
          <p>
            Intent Analytics by{" "}
            <a
              href="https://intentanalytics.fr"
              className="text-geo-accent hover:underline"
            >
              Intent Analytics
            </a>{" "}
            — Sources : DVF, ADEME, INSEE, Géorisques, BAN
          </p>
        </footer>
      </body>
    </html>
  );
}
