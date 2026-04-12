import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const revalidate = 86400; // regenerate every 24h

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response("<urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'></urlset>", {
      headers: { "Content-Type": "application/xml" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Get all distinct communes from seo_page_data
  const { data, error } = await supabase.rpc("get_sitemap_communes");

  if (error || !data) {
    console.error("[sitemap-communes] Error:", error?.message);
    return new Response("<urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'></urlset>", {
      headers: { "Content-Type": "application/xml" },
    });
  }

  const base = "https://app.intentanalytics.fr";
  const now = new Date().toISOString().split("T")[0];

  const urls = (data as any[]).map((row: any) => {
    const cp = row.code_postal;
    const ville = slugify(row.nom_commune);
    return `  <url>
    <loc>${base}/${cp}/${ville}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
