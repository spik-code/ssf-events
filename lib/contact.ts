import { SITE } from "./site";

export interface Contact {
  /** Display form, e.g. "+91 93535 68207". */
  phone: string;
  /** Digits with country code, for wa.me, e.g. "919353568207". */
  whatsapp: string;
  email: string;
  instagram: string;
  telHref: string;
  mailHref: string;
}

/** Digits only, and prepend 91 for a bare 10-digit Indian mobile. */
function waDigits(value: string): string {
  const digits = value.replace(/[^\d]/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

/**
 * The contact details the public site should show.
 *
 * `site_settings` wins when it has a non-empty value, so editing Content in the
 * admin actually changes the site. The env-backed SITE constants are the
 * fallback, which keeps the page rendering if Supabase is unreachable.
 *
 * Without this the admin's phone / WhatsApp / email / Instagram fields would
 * write to the database and change nothing on the page.
 */
export function resolveContact(settings: Record<string, unknown>): Contact {
  const pick = (key: string, fallback: string) => {
    const v = settings[key];
    return typeof v === "string" && v.trim() ? v.trim() : fallback;
  };

  const phone = pick("contact_phone", SITE.phone);
  const email = pick("contact_email", SITE.email);

  return {
    phone,
    // A saved WhatsApp number missing its country code would silently break the
    // wa.me link, so normalise rather than trust the stored string.
    whatsapp: waDigits(pick("whatsapp_number", SITE.whatsapp)),
    email,
    instagram: pick("instagram_url", SITE.instagram),
    telHref: `tel:${phone.replace(/[^\d+]/g, "")}`,
    mailHref: `mailto:${email}`,
  };
}
