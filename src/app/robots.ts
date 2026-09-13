import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://rhdempire.com').replace(/\/+$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /admin déjà exclu de l'indexation via robots:false (metadata),
        // mais on le bloque aussi ici pour ne jamais le faire crawler.
        disallow: ['/admin', '/compte', '/checkout', '/api'],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
