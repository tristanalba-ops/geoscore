// ─── Google News RSS — Actualités locales ─────────────────────────
// Fetches local news from Google News RSS feed
// Called server-side at render time, cached via ISR

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;       // ISO date string
  relativeDate: string;  // "il y a 2 jours"
}

function parseRelativeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays === 1) return "hier";
    if (diffDays < 7) return `il y a ${diffDays} jours`;
    if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} sem.`;
    return `il y a ${Math.floor(diffDays / 30)} mois`;
  } catch {
    return dateStr;
  }
}

// Simple XML tag parser (no dependency needed for RSS)
function extractTag(xml: string, tag: string): string {
  const openTag = `<${tag}>`;
  const closeTag = `</${tag}>`;
  // Also handle CDATA
  const cdataOpen = `<${tag}><![CDATA[`;
  const cdataClose = `]]></${tag}>`;

  let start = xml.indexOf(cdataOpen);
  if (start !== -1) {
    start += cdataOpen.length;
    const end = xml.indexOf(cdataClose, start);
    return end !== -1 ? xml.substring(start, end).trim() : "";
  }

  start = xml.indexOf(openTag);
  if (start === -1) return "";
  start += openTag.length;
  const end = xml.indexOf(closeTag, start);
  return end !== -1 ? xml.substring(start, end).trim() : "";
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/<[^>]*>/g, ""); // strip any remaining HTML tags
}

export async function fetchLocalNews(
  communeName: string,
  departement?: string,
  maxResults = 8
): Promise<NewsItem[]> {
  // Build search query
  const query = departement
    ? `${communeName} ${departement}`
    : communeName;

  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=fr&gl=FR&ceid=FR:fr`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "IntentAnalytics/1.0 (news aggregation)",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error("[News] HTTP error:", res.status);
      return [];
    }

    const xml = await res.text();

    // Parse RSS items
    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < maxResults) {
      const itemXml = match[1];
      const title = decodeHtmlEntities(extractTag(itemXml, "title"));
      const link = extractTag(itemXml, "link");
      const pubDate = extractTag(itemXml, "pubDate");
      const source = decodeHtmlEntities(extractTag(itemXml, "source"));

      if (title && link) {
        items.push({
          title,
          link,
          source: source || "Google News",
          pubDate,
          relativeDate: parseRelativeDate(pubDate),
        });
      }
    }

    return items;
  } catch (err) {
    console.error("[News] Fetch error:", err);
    return [];
  }
}
