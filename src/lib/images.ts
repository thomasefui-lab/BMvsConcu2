import type { SiteId } from "./types";

/** Heuristiques d'URL image — à enrichir quand les scrapers exposeront image_url */
export function guessProductImageUrl(site: SiteId, productUrl: string): string | null {
  try {
    const url = new URL(productUrl);
    if (site === "habitat" && url.pathname.startsWith("/p/")) {
      const slug = url.pathname.replace("/p/", "");
      return `https://www.habitat.fr/dw/image/v2/AAUH_PRD/on/demandware.static/-/Sites-habitat-master-catalog/default/dw00000000/images/large/${slug}.jpg`;
    }
    if (site === "baita") {
      const idMatch = productUrl.match(/(\d{10,})/);
      if (idMatch) {
        return `https://www.baita-home.com/${idMatch[1]}-home_default/product.jpg`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function productPlaceholderColor(site: SiteId): string {
  const colors: Record<SiteId, string> = {
    bestmobilier: "#1a3a6b",
    bobochic: "#2d2d2d",
    sweeek: "#e85d04",
    baita: "#006633",
    habitat: "#c41230",
  };
  return colors[site];
}
