import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string;
}

/**
 * Dynamic SEO head component that updates document title and meta tags
 * for each page to improve search engine visibility.
 */
export const SEOHead = ({ title, description, canonical, keywords }: SEOHeadProps) => {
  useEffect(() => {
    // Update title
    document.title = title;

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);

    // Update OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", description);

    // Update Twitter tags
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute("content", title);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute("content", description);

    // Update canonical
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (link) {
        link.href = canonical;
      }
    }

    // Update keywords
    if (keywords) {
      let meta = document.querySelector('meta[name="keywords"]');
      if (meta) meta.setAttribute("content", keywords);
    }
  }, [title, description, canonical, keywords]);

  return null;
};
