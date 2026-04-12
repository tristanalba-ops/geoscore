import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/estimation"],
      },
    ],
    sitemap: [
      "https://app.intentanalytics.fr/sitemap.xml",
      "https://app.intentanalytics.fr/sitemap-communes.xml",
    ],
  };
}
