import Script from 'next/script'

interface GoogleAnalyticsProps {
  gaId: string
}

export default function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  const id = gaId.trim()
  if (!id) {
    return null
  }

  return (
    <>
      {/*
        Google Analytics (gtag.js) — SRI NOT applicable.
        The gtag.js script at googletagmanager.com/gtag/js is dynamically generated
        based on the measurement ID and Google's current SDK version. Its content
        hash changes without notice, making SRI hashes unreliable.
      */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'wait_for_update': 500
          });
          gtag('set', 'url_passthrough', true);
          gtag('set', 'ads_data_redaction', true);
          gtag('js', new Date());
          gtag('config', '${id}');
          window.__GA_INITIALIZED = true;
          (function(){
            try {
              var p = localStorage.getItem('cookie_preferences');
              if (p) {
                var prefs = JSON.parse(p);
                if (prefs.analytics) gtag('consent', 'update', { 'analytics_storage': 'granted' });
                if (prefs.marketing) gtag('consent', 'update', { 'ad_storage': 'granted', 'ad_user_data': 'granted', 'ad_personalization': 'granted' });
              }
            } catch(e) {}
          })();
        `}
      </Script>
    </>
  )
}
