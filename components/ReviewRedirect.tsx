"use client";

import { useEffect, useState } from "react";

/** Instagram and Facebook open links in their own browser, which has no Google
 *  session — so Google asks a customer to sign in again before they can review. */
const IN_APP = /Instagram|FBAN|FBAV|FB_IAB/i;

/** An Android intent that opens `url` in Chrome, where the customer is usually
 *  already signed in. Without Chrome it falls back to opening it right here. */
function chromeIntent(url: string) {
  const { host, pathname, search } = new URL(url);
  return `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;
}

/**
 * Sends the visitor on to the Google review form. A normal browser goes straight
 * there. Inside Instagram/Facebook on Android it hands off to Chrome; on iPhone,
 * where an app can't be left automatically, it shows a button and a hint.
 */
export function ReviewRedirect({ url }: { url: string }) {
  const [inApp, setInApp] = useState<"android" | "ios" | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (!IN_APP.test(ua)) {
      window.location.replace(url);
      return;
    }
    if (/Android/i.test(ua)) {
      setInApp("android");
      window.location.href = chromeIntent(url);
    } else {
      setInApp("ios");
    }
  }, [url]);

  if (!inApp) return null;

  return (
    <div className="review-inapp">
      {inApp === "android" ? (
        <>
          <a className="btn btn-primary" href={chromeIntent(url)}>
            Open in Chrome
          </a>
          <p className="note">
            Instagram&rsquo;s browser asks you to sign in to Google again. If Chrome didn&rsquo;t
            open, tap <b>&#8942;</b> at the top right, then <b>Open in Chrome</b>.
          </p>
        </>
      ) : (
        <>
          <a className="btn btn-primary" href={`x-safari-${url}`}>
            Open in Safari
          </a>
          <p className="note">
            Instagram&rsquo;s browser asks you to sign in to Google again. If Safari didn&rsquo;t
            open, tap <b>&middot;&middot;&middot;</b> at the top right, then{" "}
            <b>Open in external browser</b>.
          </p>
        </>
      )}
      <a className="nav-back" href={url}>
        Or continue here &rarr;
      </a>
    </div>
  );
}
