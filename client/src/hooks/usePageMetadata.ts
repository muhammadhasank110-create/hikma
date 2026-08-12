import { useEffect } from "react";

const SITE_URL = "https://hikmalearn-ainbnehq.manus.space";

export function usePageMetadata({ title, description, path }: { title: string; description: string; path: string }) {
  useEffect(() => {
    document.title = title;
    const setMeta = (selector: string, attr: "name" | "property", key: string, value: string) => {
      let node = document.head.querySelector<HTMLMetaElement>(selector);
      if (!node) { node = document.createElement("meta"); node.setAttribute(attr, key); document.head.appendChild(node); }
      node.content = value;
    };
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = `${SITE_URL}${path}`;
  }, [description, path, title]);
}
