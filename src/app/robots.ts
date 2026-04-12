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
      "https://intentanalytics.fr/sitemap.xml",
      "https://intentanalytics.fr/sitemap-communes.xml",
    ],
  };
}
