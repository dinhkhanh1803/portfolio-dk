export type SeoInput = {
  title: string;
  description: string;
  url: string;
  siteName: string;
  image: string;
  locale: string;
  type: string;
  canonical: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  noArchive: boolean;
  twitterHandle: string;
  keywords: string;
  author: string;
  publishedTime: string;
  modifiedTime: string;
  schemaType: "Organization" | "WebSite" | "Article" | "Product";
  price: string;
  currency: string;
  availability: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  shareText: string;
};

const clean = (value: string) => value.trim();
const escapeHtml = (value: string) =>
  clean(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function normalizeUrl(value: string, fallback = "https://example.com"): string {
  const trimmed = clean(value);
  if (!trimmed) return fallback;
  try {
    return new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`).toString();
  } catch {
    return fallback;
  }
}

export function buildRobotsDirectives(input: Pick<SeoInput, "robotsIndex" | "robotsFollow" | "noArchive">): string {
  return [
    input.robotsIndex ? "index" : "noindex",
    input.robotsFollow ? "follow" : "nofollow",
    input.noArchive ? "noarchive" : "",
  ].filter(Boolean).join(", ");
}

export function buildMetaTags(input: SeoInput): string {
  const canonical = normalizeUrl(input.canonical || input.url);
  const rows = [
    `<title>${escapeHtml(input.title)}</title>`,
    `<meta name="description" content="${escapeHtml(input.description)}" />`,
    input.keywords ? `<meta name="keywords" content="${escapeHtml(input.keywords)}" />` : "",
    input.author ? `<meta name="author" content="${escapeHtml(input.author)}" />` : "",
    `<meta name="robots" content="${buildRobotsDirectives(input)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
  ];
  return rows.filter(Boolean).join("\n");
}

export function buildOpenGraphTags(input: SeoInput): string {
  return [
    `<meta property="og:type" content="${escapeHtml(input.type || "website")}" />`,
    `<meta property="og:title" content="${escapeHtml(input.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(input.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(normalizeUrl(input.url))}" />`,
    `<meta property="og:site_name" content="${escapeHtml(input.siteName)}" />`,
    `<meta property="og:locale" content="${escapeHtml(input.locale || "en_US")}" />`,
    input.image ? `<meta property="og:image" content="${escapeHtml(normalizeUrl(input.image))}" />` : "",
    input.publishedTime ? `<meta property="article:published_time" content="${escapeHtml(input.publishedTime)}" />` : "",
    input.modifiedTime ? `<meta property="article:modified_time" content="${escapeHtml(input.modifiedTime)}" />` : "",
  ].filter(Boolean).join("\n");
}

export function buildTwitterCardTags(input: SeoInput): string {
  return [
    `<meta name="twitter:card" content="${input.image ? "summary_large_image" : "summary"}" />`,
    input.twitterHandle ? `<meta name="twitter:site" content="${escapeHtml(input.twitterHandle.startsWith("@") ? input.twitterHandle : `@${input.twitterHandle}`)}" />` : "",
    `<meta name="twitter:title" content="${escapeHtml(input.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(input.description)}" />`,
    input.image ? `<meta name="twitter:image" content="${escapeHtml(normalizeUrl(input.image))}" />` : "",
  ].filter(Boolean).join("\n");
}

export function buildUtmUrl(baseUrl: string, source: string, medium: string, campaign: string, term = "", content = ""): string {
  const url = new URL(normalizeUrl(baseUrl));
  const params = { utm_source: source, utm_medium: medium, utm_campaign: campaign, utm_term: term, utm_content: content };
  Object.entries(params).forEach(([key, value]) => {
    if (clean(value)) url.searchParams.set(key, clean(value));
  });
  return url.toString();
}

export function buildJsonLd(input: SeoInput): string {
  const url = normalizeUrl(input.url);
  const base = {
    "@context": "https://schema.org",
    "@type": input.schemaType,
    name: input.schemaType === "Article" ? input.title : input.siteName,
    url,
    description: input.description,
  } as Record<string, unknown>;
  if (input.image) base.image = normalizeUrl(input.image);
  if (input.schemaType === "Article") {
    base.headline = input.title;
    base.author = { "@type": "Person", name: input.author || input.siteName };
    if (input.publishedTime) base.datePublished = input.publishedTime;
    if (input.modifiedTime) base.dateModified = input.modifiedTime;
  }
  if (input.schemaType === "Product") {
    base.offers = { "@type": "Offer", price: input.price || "49", priceCurrency: input.currency || "USD", availability: `https://schema.org/${input.availability || "InStock"}` };
  }
  return JSON.stringify(base, null, 2);
}

export function buildShareLinks(input: SeoInput) {
  const url = encodeURIComponent(normalizeUrl(input.url));
  const text = encodeURIComponent(input.shareText || input.title);
  return [
    { label: "X / Twitter", url: `https://twitter.com/intent/tweet?url=${url}&text=${text}` },
    { label: "Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
    { label: "LinkedIn", url: `https://www.linkedin.com/sharing/share-offsite/?url=${url}` },
    { label: "Reddit", url: `https://www.reddit.com/submit?url=${url}&title=${text}` },
    { label: "Email", url: `mailto:?subject=${text}&body=${text}%0A${url}` },
  ];
}

export function scoreSeoContent(input: SeoInput) {
  const checks = [
    { label: "Title 45-60 characters", pass: input.title.length >= 45 && input.title.length <= 60 },
    { label: "Description 120-160 characters", pass: input.description.length >= 120 && input.description.length <= 160 },
    { label: "Canonical URL is valid", pass: normalizeUrl(input.canonical || input.url) !== "https://example.com/" },
    { label: "Open Graph image is present", pass: Boolean(input.image.trim()) },
    { label: "Robots allows indexing", pass: input.robotsIndex && input.robotsFollow },
  ];
  return { score: Math.round((checks.filter((item) => item.pass).length / checks.length) * 100), checks };
}

export function buildFullSeoHead(input: SeoInput): string {
  return [buildMetaTags(input), buildOpenGraphTags(input), buildTwitterCardTags(input)].join("\n\n");
}
