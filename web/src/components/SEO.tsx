import { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'book';
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const DEFAULT_TITLE = 'Bíblia na Arte — As Sagradas Escrituras Através das Artes';
const DEFAULT_DESCRIPTION =
  'Explore pinturas, obras de arte e expressões visuais inspiradas na Bíblia Sagrada ao longo dos séculos. Mestres clássicos, renascentistas e barrocos.';
const DEFAULT_IMAGE = '/hero-banner.jpg';
const SITE_NAME = 'BiblianaArte.com';

function setMetaTag(nameOrProperty: 'name' | 'property', key: string, content: string) {
  let element = document.querySelector(`meta[${nameOrProperty}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(nameOrProperty, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonicalUrl(url: string) {
  let element = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', url);
}

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  schema,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const absoluteImage =
    image.startsWith('http://') || image.startsWith('https://')
      ? image
      : typeof window !== 'undefined'
        ? `${window.location.origin}${image.startsWith('/') ? '' : '/'}${image}`
        : image;

  useEffect(() => {
    // 1. Update Title
    document.title = fullTitle;

    // 2. Standard Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', 'index, follow');

    // 3. Canonical Link
    if (canonicalUrl) {
      setCanonicalUrl(canonicalUrl);
      setMetaTag('property', 'og:url', canonicalUrl);
    }

    // 4. OpenGraph Tags
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', absoluteImage);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:site_name', SITE_NAME);

    // 5. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', absoluteImage);

    // 6. JSON-LD Structured Data (Schema.org)
    let jsonLdScript = document.querySelector<HTMLScriptElement>('script#schema-jsonld');
    if (schema) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = 'schema-jsonld';
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(schema);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }

    return () => {
      // Cleanup custom JSON-LD when component unmounts
      const scriptToRemove = document.querySelector('script#schema-jsonld');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [fullTitle, description, absoluteImage, canonicalUrl, type, schema]);

  return null;
}
