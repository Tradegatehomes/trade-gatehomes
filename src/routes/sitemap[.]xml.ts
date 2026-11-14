import { createFileRoute } from "@tanstack/react-router";
import { pub } from "@/lib/booking-quote.server";

const SITE_URL = "https://www.tradegatehomes.com";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const db = pub() as any;
        const { data: properties, error } = await db
          .from("properties")
          .select("slug,updated_at")
          .eq("status", "active")
          .order("updated_at", { ascending: false });

        if (error) {
          return new Response("Could not generate sitemap", { status: 500 });
        }

        const staticUrls = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/properties", changefreq: "daily", priority: "0.9" },
          { path: "/terms", changefreq: "monthly", priority: "0.3" },
          { path: "/privacy", changefreq: "monthly", priority: "0.3" },
          { path: "/cancellation-refund-policy", changefreq: "monthly", priority: "0.3" },
        ];

        const staticEntries = staticUrls
          .map(
            (item) =>
              `  <url><loc>${SITE_URL}${item.path}</loc><changefreq>${item.changefreq}</changefreq><priority>${item.priority}</priority></url>`,
          )
          .join("\n");

        const propertyEntries = (properties ?? [])
          .map((property: { slug: string; updated_at?: string | null }) => {
            const lastmod = property.updated_at
              ? `<lastmod>${new Date(property.updated_at).toISOString()}</lastmod>`
              : "";
            return `  <url><loc>${SITE_URL}/properties/${escapeXml(property.slug)}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.8</priority></url>`;
          })
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${propertyEntries}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      },
    },
  },
});
