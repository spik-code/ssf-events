/** Business contact details, read from env so they are editable without a code change. */
export const SITE = {
  name: "SSF Events",
  legalName: "Sri Sai Flora Enterprises",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+91 93535 68207",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919353568207",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "srisaifloraevent@gmail.com",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/ssf_events/",
  base: "Kolar, Karnataka",
  serving: "Bengaluru, Bangarpet, Avani & Tumkur",
} as const;

/** tel: href — strip everything but digits and a leading +. */
export const telHref = `tel:${SITE.phone.replace(/[^\d+]/g, "")}`;
export const mailHref = `mailto:${SITE.email}`;
