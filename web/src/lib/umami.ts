export function initUmami(): void {
  const src = import.meta.env.VITE_UMAMI_SRC as string | undefined;
  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;
  if (!src || !websiteId) return;

  if (document.querySelector('script[data-umami]')) return;
  const script = document.createElement('script');
  script.defer = true;
  script.src = src;
  script.setAttribute('data-website-id', websiteId);
  script.setAttribute('data-umami', 'true');
  document.head.appendChild(script);
}
