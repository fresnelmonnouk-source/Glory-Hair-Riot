'use client';

/* GA4 + Meta Pixel — absents jusqu'ici (audit commercial 2026-09-13, "zéro
   tracking installé nulle part"). Identifiants saisis par l'admin depuis
   /admin/reglages (settings.ga4_measurement_id / meta_pixel_id), pas des
   secrets codés en dur — rien ne se charge tant que les deux sont vides.
   PageView explicite à chaque changement de route (App Router ne déclenche
   pas de vraie navigation complète, gtag/fbq ne le voient pas tout seuls). */

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function AnalyticsScripts() {
  const pathname = usePathname();
  const { data } = trpc.siteSettings.getPublic.useQuery(undefined, { staleTime: 300_000 });
  const ga4Id = data?.analytics.ga4MeasurementId;
  const pixelId = data?.analytics.metaPixelId;

  useEffect(() => {
    if (ga4Id && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', { page_path: pathname });
    }
    if (pixelId && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
    // Volontairement déclenché uniquement au changement de route (pas au
    // premier montage en plus de l'init ci-dessous) : le script d'init
    // envoie déjà son propre PageView initial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!ga4Id && !pixelId) return null;

  return (
    <>
      {ga4Id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${ga4Id}');`}
          </Script>
        </>
      )}
      {pixelId && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');`}
        </Script>
      )}
    </>
  );
}
