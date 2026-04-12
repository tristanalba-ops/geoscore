import { MetadataRoute } from "next";

// Static pages sitemap
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://app.intentanalytics.fr";
  const now = new Date().toISOString();

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/projet`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/donnees`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/methodologie`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/explorations`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/estimation`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/renovation-energetique`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/documentation`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/a-propos`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/legal/mentions-legales`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/cgu`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/politique-confidentialite`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
