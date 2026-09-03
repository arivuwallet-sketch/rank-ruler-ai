export type Section = {
  id: string;
  title: string;
  accent: "mint" | "violet";
  items: string[];
  tools: string[];
};

export const SECTIONS: Section[] = [
  {
    id: "basics",
    title: "Basic SEO practices",
    accent: "mint",
    items: [
      "Set up GSC & Bing",
      "Set up GA4",
      "Install an SEO plugin",
      "Create a sitemap",
      "Create a robots.txt file",
      "Check manual actions",
      "Ensure indexability",
    ],
    tools: ["Google Search Console", "Google Analytics", "Bing Webmaster Tools", "Site Audit"],
  },
  {
    id: "keywords",
    title: "Keyword research",
    accent: "violet",
    items: [
      "Identify competitor keywords",
      "Find topics with Keyword Magic Tool",
      "Identify AI prompts",
      "Create a keyword map",
      "Analyze search intent",
      "Find questions (PAA, Reddit)",
    ],
    tools: [
      "Keyword Magic Tool",
      "Keyword Strategy Builder",
      "AI Visibility Toolkit",
      "Google Search",
      "Keyword Gap",
    ],
  },
  {
    id: "technical",
    title: "Technical SEO",
    accent: "mint",
    items: [
      "Use HTTPS",
      "Fix duplicate site versions",
      "Fix crawl errors",
      "Improve site speed",
      "Fix broken links",
      "Fix HTTP links",
      "Prioritize mobile usability",
      "Use a clean URL structure",
      "Add structured data",
      "Optimize crawl depth",
      "Check temporary (302) redirects",
      "Fix redirects",
    ],
    tools: ["Site Audit", "PageSpeed Insights", "Chrome Dev Tools"],
  },
  {
    id: "content",
    title: "Content & on-page SEO",
    accent: "violet",
    items: [
      "Fix title tags",
      "Fix meta descriptions",
      "Fix H1 issues",
      "Optimize content",
      "Audit your content",
      "Add alt text",
      "Improve internal linking",
      "Fix cannibalization",
      "Fix orphan pages",
      "Update content regularly",
    ],
    tools: [
      "Google Analytics",
      "Site Audit",
      "Google Search Console",
      "Position Tracking",
      "On Page SEO Checker",
    ],
  },
  {
    id: "links",
    title: "Link building & off-page SEO",
    accent: "mint",
    items: [
      "Analyze backlinks",
      "Do a backlink gap analysis",
      "Turn mentions into backlinks",
      "Find new link opportunities",
      "Optimize Google Business Profile",
    ],
    tools: [
      "Backlink Analytics",
      "Backlink Gap",
      "Link Building Tool",
      "Google Business Profile",
      "Brand Monitoring",
    ],
  },
  {
    id: "agentic",
    title: "Agentic search best practices",
    accent: "violet",
    items: ["Audit AI visibility", "Structure content for AI", "Consider LLMs.txt"],
    tools: ["AI Visibility Toolkit", "LLMs (like ChatGPT / Gemini)"],
  },
];

export const TOTAL_ITEMS = SECTIONS.reduce((n, s) => n + s.items.length, 0);
