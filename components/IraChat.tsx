"use client";

import { useEffect, useRef, useState } from "react";
import { WhatsAppIcon } from "./icons";
import { ENQUIRY_SENT_EVENT, faceSrc, type Face, type Lang } from "@/lib/ira";
import { PRIVACY_VERSION } from "@/lib/legal";

/* ── Content ─────────────────────────────────────────────────────────────
   Every answer here restates something already on the site. Anything Ira
   can't answer from that goes to the team on WhatsApp, so she never makes
   up prices, payment terms or promises. */

const FUNCTIONS = ["wedding", "reception", "engagement", "haldi", "baby_shower", "birthday", "other"];
const BIG_DAY = ["wedding", "reception", "engagement"];
const NEEDS = ["decor", "catering", "dj_lighting", "full"];
const GUESTS = ["g1", "g2", "g3", "g4", "g5"];
const TOWNS = ["Kolar", "Bengaluru", "Bangarpet"];
const FAQ = ["areas", "price", "catering", "functions", "years", "team", "ready", "other"];

const T: Record<Lang, Record<string, string>> = {
  en: {
    title: "Ira",
    subtitle: "SSF Events guide",
    hello: "Namaskara! I'm Ira from SSF Events. How can I help you today?",
    plan: "Plan my function",
    faq: "Ask a question",
    tour: "Show me around",
    wa: "Chat on WhatsApp",
    askType: "Lovely! What are you planning?",
    askDateBig: "Congratulations! When is the big day?",
    askDate: "When is the function?",
    notFixed: "Date not fixed yet",
    askPlace: "Where will it be? Type the hall name or town.",
    placePh: "Hall name or town",
    askGuests: "About how many guests?",
    askNeeds: "What would you like from us? Pick all that apply.",
    next: "Next",
    skip: "Skip",
    askName: "Almost done! What's your name?",
    namePh: "Your name",
    askPhone: "And your mobile number? The team will call you with the quote.",
    phonePh: "10-digit mobile number",
    badName: "Please type your name.",
    badPhone: "That doesn't look like a mobile number. Please check it.",
    summaryIntro: "Here's what I've noted:",
    consent: "I've read the privacy note and I'm okay with SSF Events contacting me about this enquiry.",
    privacy: "Privacy note",
    needConsent: "Please tick the box so the team is allowed to contact you.",
    send: "Send to SSF",
    sending: "Sending…",
    sentOk: "Done! The SSF team has your details and will call you soon. Want to send photos or chat now? Continue on WhatsApp.",
    sentFail: "I couldn't reach our server, but don't worry: send it on WhatsApp and the team will reply.",
    openWa: "Open WhatsApp",
    restart: "Start over",
    faqIntro: "Sure! What would you like to know?",
    faqMore: "Anything else?",
    another: "Another question",
    tourIntro: "Where shall we go?",
    waIntro: "Tap below to chat with the SSF team on WhatsApp.",
    hide: "Hide Ira",
    close: "Close chat",
    typing: "Ira is typing",
    "row-type": "Function",
    "row-date": "Date",
    "row-place": "Place",
    "row-guests": "Guests",
    "row-needs": "Needs",
    "row-name": "Name",
    "row-phone": "Phone",
    "fn-wedding": "Wedding",
    "fn-reception": "Reception",
    "fn-engagement": "Engagement",
    "fn-haldi": "Haldi",
    "fn-baby_shower": "Baby shower / naming",
    "fn-birthday": "Birthday",
    "fn-other": "Other",
    "need-decor": "Decor & staging",
    "need-catering": "Catering & dining",
    "need-dj_lighting": "DJ & lighting",
    "need-full": "Everything, full function",
    g1: "Under 100",
    g2: "100–300",
    g3: "300–700",
    g4: "700+",
    g5: "Not sure yet",
    "nav-work": "See our work",
    "nav-services": "What we do",
    "nav-reviews": "Reviews",
    "nav-about": "About SSF",
    "nav-enquire": "Enquiry form",
    "q-areas": "Which areas do you cover?",
    "a-areas":
      "We're based in Kolar and take functions across Kolar district, Bengaluru, Bangarpet, Avani, Tumkur and the rest of Karnataka.",
    "q-price": "How much does it cost?",
    "a-price":
      "There's no fixed price list: every quote is built for your date, your hall and what you need. Tell me a few details and the team will send you an exact quote.",
    "q-catering": "Do you do catering?",
    "a-catering":
      "Yes. Pure veg and non-veg menus, live counters and evening snacks, with serving staff, arranged and managed by us through caterers we work with regularly.",
    "q-functions": "Which functions do you decorate?",
    "a-functions":
      "Weddings, receptions, engagements, haldi, baby showers, naming ceremonies, birthdays and theme parties: stage, mandap, entrance, flowers, lighting, DJ and sound.",
    "q-years": "How long have you been doing this?",
    "a-years": "Since 1999: more than 5,000 weddings, from small house functions to full hall decor.",
    "q-team": "Who sets up on the day?",
    "a-team":
      "Our own team. The people who design your stage build it that morning and take it down that night, and flowers, lighting and sound all come from one point of contact.",
    "q-ready": "What should I keep ready?",
    "a-ready": "Your date, venue, guest count and a couple of reference photos you like. That's enough for a first quote.",
    "q-other": "Something else",
    "a-other": "For anything else, the team can answer you directly on WhatsApp.",
  },
  kn: {
    title: "ಇರಾ",
    subtitle: "SSF Events ಗೈಡ್",
    hello: "ನಮಸ್ಕಾರ! ನಾನು SSF Events ನ ಇರಾ. ಇವತ್ತು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
    plan: "ನನ್ನ ಸಮಾರಂಭ ಪ್ಲಾನ್ ಮಾಡಿ",
    faq: "ಪ್ರಶ್ನೆ ಕೇಳಿ",
    tour: "ವೆಬ್‌ಸೈಟ್ ತೋರಿಸಿ",
    wa: "WhatsApp ನಲ್ಲಿ ಮಾತಾಡಿ",
    askType: "ಖುಷಿ! ಯಾವ ಸಮಾರಂಭ ಪ್ಲಾನ್ ಮಾಡುತ್ತಿದ್ದೀರಿ?",
    askDateBig: "ಅಭಿನಂದನೆಗಳು! ಶುಭ ದಿನ ಯಾವಾಗ?",
    askDate: "ಸಮಾರಂಭ ಯಾವಾಗ?",
    notFixed: "ದಿನಾಂಕ ಇನ್ನೂ ನಿಗದಿಯಾಗಿಲ್ಲ",
    askPlace: "ಎಲ್ಲಿ ನಡೆಯುತ್ತದೆ? ಹಾಲ್ ಹೆಸರು ಅಥವಾ ಊರು ಬರೆಯಿರಿ.",
    placePh: "ಹಾಲ್ ಹೆಸರು ಅಥವಾ ಊರು",
    askGuests: "ಸುಮಾರು ಎಷ್ಟು ಅತಿಥಿಗಳು?",
    askNeeds: "ನಮ್ಮಿಂದ ಏನೇನು ಬೇಕು? ಬೇಕಾದಷ್ಟು ಆಯ್ಕೆ ಮಾಡಿ.",
    next: "ಮುಂದೆ",
    skip: "ಬಿಟ್ಟುಬಿಡಿ",
    askName: "ಇನ್ನೇನು ಮುಗಿಯಿತು! ನಿಮ್ಮ ಹೆಸರು?",
    namePh: "ನಿಮ್ಮ ಹೆಸರು",
    askPhone: "ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ? ನಮ್ಮ ತಂಡ ಕೊಟೇಶನ್ ಜೊತೆ ಕರೆ ಮಾಡುತ್ತದೆ.",
    phonePh: "10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    badName: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರು ಬರೆಯಿರಿ.",
    badPhone: "ಇದು ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಲ್ಲ ಅನ್ನಿಸುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ.",
    summaryIntro: "ನಾನು ಬರೆದುಕೊಂಡಿದ್ದು:",
    consent: "ನಾನು ಗೌಪ್ಯತಾ ಸೂಚನೆ ಓದಿದ್ದೇನೆ. ಈ ವಿಚಾರಣೆಯ ಬಗ್ಗೆ SSF Events ನನ್ನನ್ನು ಸಂಪರ್ಕಿಸಲು ನನ್ನ ಒಪ್ಪಿಗೆ ಇದೆ.",
    privacy: "ಗೌಪ್ಯತಾ ಸೂಚನೆ",
    needConsent: "ತಂಡ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಲು ದಯವಿಟ್ಟು ಬಾಕ್ಸ್ ಟಿಕ್ ಮಾಡಿ.",
    send: "SSF ಗೆ ಕಳುಹಿಸಿ",
    sending: "ಕಳುಹಿಸುತ್ತಿದ್ದೇನೆ…",
    sentOk: "ಆಯ್ತು! ನಿಮ್ಮ ವಿವರಗಳು SSF ತಂಡಕ್ಕೆ ತಲುಪಿವೆ, ಶೀಘ್ರದಲ್ಲೇ ಕರೆ ಮಾಡುತ್ತಾರೆ. ಫೋಟೋ ಕಳುಹಿಸಲು ಅಥವಾ ಈಗಲೇ ಮಾತಾಡಲು WhatsApp ನಲ್ಲಿ ಮುಂದುವರಿಸಿ.",
    sentFail: "ಸರ್ವರ್ ತಲುಪಲು ಆಗಲಿಲ್ಲ, ಚಿಂತೆ ಬೇಡ: WhatsApp ನಲ್ಲಿ ಕಳುಹಿಸಿ, ತಂಡ ಉತ್ತರಿಸುತ್ತದೆ.",
    openWa: "WhatsApp ತೆರೆಯಿರಿ",
    restart: "ಮೊದಲಿನಿಂದ",
    faqIntro: "ಖಂಡಿತ! ಏನು ತಿಳಿಯಬೇಕು?",
    faqMore: "ಇನ್ನೇನಾದರೂ?",
    another: "ಇನ್ನೊಂದು ಪ್ರಶ್ನೆ",
    tourIntro: "ಎಲ್ಲಿಗೆ ಹೋಗೋಣ?",
    waIntro: "SSF ತಂಡದ ಜೊತೆ WhatsApp ನಲ್ಲಿ ಮಾತಾಡಲು ಕೆಳಗೆ ಟ್ಯಾಪ್ ಮಾಡಿ.",
    hide: "ಇರಾಳನ್ನು ಮರೆಮಾಡಿ",
    close: "ಚಾಟ್ ಮುಚ್ಚಿ",
    typing: "ಇರಾ ಬರೆಯುತ್ತಿದ್ದಾಳೆ",
    "row-type": "ಸಮಾರಂಭ",
    "row-date": "ದಿನಾಂಕ",
    "row-place": "ಸ್ಥಳ",
    "row-guests": "ಅತಿಥಿಗಳು",
    "row-needs": "ಬೇಕಾದದ್ದು",
    "row-name": "ಹೆಸರು",
    "row-phone": "ಫೋನ್",
    "fn-wedding": "ಮದುವೆ",
    "fn-reception": "ರಿಸೆಪ್ಷನ್",
    "fn-engagement": "ನಿಶ್ಚಿತಾರ್ಥ",
    "fn-haldi": "ಹಲ್ದಿ",
    "fn-baby_shower": "ಸೀಮಂತ / ನಾಮಕರಣ",
    "fn-birthday": "ಹುಟ್ಟುಹಬ್ಬ",
    "fn-other": "ಬೇರೆ",
    "need-decor": "ಅಲಂಕಾರ ಮತ್ತು ಸ್ಟೇಜ್",
    "need-catering": "ಕ್ಯಾಟರಿಂಗ್ ಮತ್ತು ಊಟ",
    "need-dj_lighting": "ಡಿಜೆ ಮತ್ತು ಲೈಟಿಂಗ್",
    "need-full": "ಎಲ್ಲವೂ, ಪೂರ್ತಿ ಸಮಾರಂಭ",
    g1: "100 ಕ್ಕಿಂತ ಕಡಿಮೆ",
    g2: "100–300",
    g3: "300–700",
    g4: "700+",
    g5: "ಇನ್ನೂ ಗೊತ್ತಿಲ್ಲ",
    "nav-work": "ನಮ್ಮ ಕೆಲಸ ನೋಡಿ",
    "nav-services": "ನಾವು ಏನು ಮಾಡುತ್ತೇವೆ",
    "nav-reviews": "ರಿವ್ಯೂಗಳು",
    "nav-about": "SSF ಬಗ್ಗೆ",
    "nav-enquire": "ವಿಚಾರಣೆ ಫಾರ್ಮ್",
    "q-areas": "ಯಾವ ಊರುಗಳಿಗೆ ಬರುತ್ತೀರಿ?",
    "a-areas":
      "ನಾವು ಕೋಲಾರದಲ್ಲಿದ್ದೇವೆ. ಕೋಲಾರ ಜಿಲ್ಲೆ, ಬೆಂಗಳೂರು, ಬಂಗಾರಪೇಟೆ, ಆವನಿ, ತುಮಕೂರು ಹಾಗೂ ಕರ್ನಾಟಕದಾದ್ಯಂತ ಸಮಾರಂಭಗಳನ್ನು ಮಾಡುತ್ತೇವೆ.",
    "q-price": "ಎಷ್ಟು ಖರ್ಚಾಗುತ್ತದೆ?",
    "a-price":
      "ನಮ್ಮಲ್ಲಿ ನಿಗದಿತ ದರಪಟ್ಟಿ ಇಲ್ಲ. ನಿಮ್ಮ ದಿನಾಂಕ, ಹಾಲ್ ಮತ್ತು ಬೇಕಾದ ಸೇವೆಗಳಿಗೆ ತಕ್ಕಂತೆ ಕೊಟೇಶನ್ ಕೊಡುತ್ತೇವೆ. ಕೆಲವು ವಿವರ ತಿಳಿಸಿ, ತಂಡ ಸರಿಯಾದ ಕೊಟೇಶನ್ ಕಳುಹಿಸುತ್ತದೆ.",
    "q-catering": "ಕ್ಯಾಟರಿಂಗ್ ಮಾಡುತ್ತೀರಾ?",
    "a-catering":
      "ಹೌದು. ಶುದ್ಧ ಸಸ್ಯಾಹಾರಿ ಮತ್ತು ಮಾಂಸಾಹಾರಿ ಮೆನು, ಲೈವ್ ಕೌಂಟರ್‌ಗಳು, ಸಂಜೆ ತಿಂಡಿ ಮತ್ತು ಬಡಿಸುವ ಸಿಬ್ಬಂದಿ. ನಾವು ನಿಯಮಿತವಾಗಿ ಕೆಲಸ ಮಾಡುವ ಕ್ಯಾಟರರ್‌ಗಳ ಮೂಲಕ ನಾವೇ ವ್ಯವಸ್ಥೆ ಮಾಡುತ್ತೇವೆ.",
    "q-functions": "ಯಾವ ಸಮಾರಂಭಗಳಿಗೆ ಅಲಂಕಾರ ಮಾಡುತ್ತೀರಿ?",
    "a-functions":
      "ಮದುವೆ, ರಿಸೆಪ್ಷನ್, ನಿಶ್ಚಿತಾರ್ಥ, ಹಲ್ದಿ, ಸೀಮಂತ, ನಾಮಕರಣ, ಹುಟ್ಟುಹಬ್ಬ ಮತ್ತು ಥೀಮ್ ಪಾರ್ಟಿಗಳು: ಸ್ಟೇಜ್, ಮಂಟಪ, ಪ್ರವೇಶ ದ್ವಾರ, ಹೂವು, ಲೈಟಿಂಗ್, ಡಿಜೆ ಮತ್ತು ಸೌಂಡ್.",
    "q-years": "ಎಷ್ಟು ವರ್ಷಗಳಿಂದ ಈ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೀರಿ?",
    "a-years": "1999 ರಿಂದ: ಮನೆಯ ಸಣ್ಣ ಸಮಾರಂಭಗಳಿಂದ ಹಿಡಿದು ಪೂರ್ತಿ ಹಾಲ್ ಅಲಂಕಾರದವರೆಗೆ 5,000ಕ್ಕೂ ಹೆಚ್ಚು ಮದುವೆಗಳು.",
    "q-team": "ಸಮಾರಂಭದ ದಿನ ಯಾರು ಸೆಟಪ್ ಮಾಡುತ್ತಾರೆ?",
    "a-team":
      "ನಮ್ಮದೇ ತಂಡ. ನಿಮ್ಮ ಸ್ಟೇಜ್ ವಿನ್ಯಾಸ ಮಾಡಿದವರೇ ಅದೇ ಬೆಳಿಗ್ಗೆ ಕಟ್ಟುತ್ತಾರೆ, ಅದೇ ರಾತ್ರಿ ತೆಗೆಯುತ್ತಾರೆ. ಹೂವು, ಲೈಟಿಂಗ್, ಸೌಂಡ್ ಎಲ್ಲಕ್ಕೂ ಒಬ್ಬರೇ ಸಂಪರ್ಕ.",
    "q-ready": "ಏನೇನು ತಯಾರಿ ಇಟ್ಟುಕೊಳ್ಳಬೇಕು?",
    "a-ready": "ದಿನಾಂಕ, ಸ್ಥಳ, ಅತಿಥಿಗಳ ಸಂಖ್ಯೆ ಮತ್ತು ನಿಮಗೆ ಇಷ್ಟವಾದ ಒಂದೆರಡು ಫೋಟೋಗಳು. ಮೊದಲ ಕೊಟೇಶನ್‌ಗೆ ಇಷ್ಟು ಸಾಕು.",
    "q-other": "ಬೇರೆ ಏನಾದರೂ",
    "a-other": "ಬೇರೆ ಯಾವುದೇ ಪ್ರಶ್ನೆಗೆ ನಮ್ಮ ತಂಡ WhatsApp ನಲ್ಲಿ ನೇರವಾಗಿ ಉತ್ತರಿಸುತ್ತದೆ.",
  },
};

/** The face Ira pulls when answering each question. */
const FAQ_FACE: Record<string, Face> = {
  areas: "smile",
  price: "think",
  catering: "laugh",
  functions: "cheer",
  years: "wink",
  team: "laugh",
  ready: "think",
  other: "wave",
};

/* ── Types ─────────────────────────────────────────────────────────────── */

type Step =
  | "start" | "type" | "date" | "place" | "guests" | "needs" | "name" | "phone"
  | "confirm" | "sending" | "faq" | "faqAfter" | "tour";

/** Ira's lines are stored as keys so switching language re-renders the whole chat. */
type Msg =
  | { from: "ira"; k: string }
  | { from: "ira"; kind: "summary"; lead: Lead }
  | { from: "ira"; kind: "wa"; href: string }
  | { from: "me"; k?: string; ks?: string[]; raw?: string };

type Lead = {
  type: string;
  date: string;
  place: string;
  guests: string;
  needs: string[];
  name: string;
  phone: string;
};

const EMPTY: Lead = { type: "", date: "", place: "", guests: "", needs: [], name: "", phone: "" };
const LEAD_STEPS: Step[] = ["type", "date", "place", "guests", "needs", "name", "phone", "confirm"];

function validPhone(p: string) {
  const d = p.replace(/\D/g, "");
  return (d.length === 10 && /^[6-9]/.test(d)) || (d.length === 12 && d.startsWith("91"));
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function showDate(v: string, lang: Lang) {
  if (!v) return T[lang].notFixed;
  return new Date(`${v}T00:00`).toLocaleDateString(lang === "kn" ? "kn-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ── Component ─────────────────────────────────────────────────────────── */

/**
 * Ira's guided chat: tap-through flows only, no free-form AI. "Plan my
 * function" collects the same fields as the enquiry form, saves them through
 * /api/enquiry (with the same consent), then hands over to WhatsApp with the
 * details pre-filled. Stays mounted while closed so the conversation survives.
 */
export function IraChat({
  open,
  lang,
  onLang,
  face,
  whatsapp,
  waHref,
  showReviews,
  onMood,
  onNavigate,
  onClose,
  onHide,
}: {
  open: boolean;
  lang: Lang;
  onLang: (l: Lang) => void;
  face: Face;
  whatsapp: string;
  waHref: string;
  showReviews: boolean;
  onMood: (f: Face, ms?: number) => void;
  onNavigate: (id: string) => void;
  onClose: () => void;
  onHide: () => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [step, setStep] = useState<Step>("start");
  const [typing, setTyping] = useState(false);
  const [lead, setLead] = useState<Lead>(EMPTY);
  const [draft, setDraft] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = T[lang];

  /** Ira "types" for a moment, then each line lands in turn. */
  const ira = (lines: (string | Msg)[], next: Step, mood?: Face) => {
    setTyping(true);
    setError(null);
    onMood("think", 700);
    let delay = 0;
    lines.forEach((line, i) => {
      delay += i === 0 ? 550 : 700;
      timers.current.push(
        window.setTimeout(() => {
          setMsgs((m) => [...m, typeof line === "string" ? { from: "ira", k: line } : line]);
          if (i === lines.length - 1) {
            setTyping(false);
            setStep(next);
            if (mood) onMood(mood, 2200);
          }
        }, delay),
      );
    });
  };

  const me = (m: Omit<Extract<Msg, { from: "me" }>, "from">) => setMsgs((list) => [...list, { from: "me", ...m }]);

  // Greet once. Clearing the timer on cleanup keeps a dev double-mount to one hello.
  useEffect(() => {
    ira(["hello"], "start", "wave");
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, typing, step]);

  // Put the cursor in the box whenever Ira asks for typed input.
  useEffect(() => {
    if (open && !typing) inputRef.current?.focus();
  }, [open, typing, step]);

  /* ── Actions ── */

  const startPlan = () => {
    me({ k: "plan" });
    setLead(EMPTY);
    setConsent(false);
    ira(["askType"], "type", "laugh");
  };
  const startFaq = (k = "faq") => {
    me({ k });
    ira(["faqIntro"], "faq", "smile");
  };
  const startTour = () => {
    me({ k: "tour" });
    ira(["tourIntro"], "tour", "wink");
  };
  const startWa = () => {
    me({ k: "wa" });
    ira(["waIntro", { from: "ira", kind: "wa", href: waHref }], "start", "wave");
  };

  const pickType = (v: string) => {
    me({ k: `fn-${v}` });
    setLead((l) => ({ ...l, type: v }));
    const big = BIG_DAY.includes(v);
    ira([big ? "askDateBig" : "askDate"], "date", big ? "cheer" : "laugh");
  };

  const pickDate = (v: string) => {
    me({ raw: showDate(v, lang) });
    setLead((l) => ({ ...l, date: v }));
    setDraft("");
    ira(["askPlace"], "place");
  };

  const pickPlace = (v: string) => {
    const place = v.trim();
    if (!place) return;
    me({ raw: place });
    setLead((l) => ({ ...l, place }));
    setDraft("");
    ira(["askGuests"], "guests");
  };

  const pickGuests = (g: string) => {
    me({ k: g });
    setLead((l) => ({ ...l, guests: g }));
    ira(["askNeeds"], "needs");
  };

  const toggleNeed = (n: string) =>
    setLead((l) => ({ ...l, needs: l.needs.includes(n) ? l.needs.filter((x) => x !== n) : [...l.needs, n] }));

  const doneNeeds = () => {
    if (lead.needs.length) me({ ks: lead.needs.map((n) => `need-${n}`) });
    else me({ k: "skip" });
    ira(["askName"], "name", "wink");
  };

  const pickName = (v: string) => {
    const name = v.trim();
    if (name.length < 2) return setError("badName");
    me({ raw: name });
    setLead((l) => ({ ...l, name }));
    setDraft("");
    ira(["askPhone"], "phone");
  };

  const pickPhone = (v: string) => {
    const phone = v.trim();
    if (!validPhone(phone)) {
      onMood("wow", 1500);
      return setError("badPhone");
    }
    me({ raw: phone });
    setLead((l) => ({ ...l, phone }));
    setDraft("");
    ira(["summaryIntro", { from: "ira", kind: "summary", lead: { ...lead, phone } }], "confirm", "smile");
  };

  const send = async () => {
    if (!consent) return setError("needConsent");
    setStep("sending");
    const params = new URLSearchParams(window.location.search);
    const referral = params.get("utm_source") || (params.get("gclid") ? "google" : null);
    let saved = false;
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          phone: lead.phone,
          event_type: lead.type,
          event_date: lead.date || undefined,
          event_location: lead.place || undefined,
          message: [
            "Sent through Ira, the website chat.",
            lead.guests ? `Guests: ${T.en[lead.guests]}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
          referral_source: referral || undefined,
          services_needed: lead.needs,
          consent: true,
          privacy_version: PRIVACY_VERSION,
        }),
      });
      saved = res.ok;
    } catch {
      saved = false;
    }
    if (saved) window.dispatchEvent(new Event(ENQUIRY_SENT_EVENT));
    ira([saved ? "sentOk" : "sentFail", { from: "ira", kind: "wa", href: leadWaHref() }], "start", saved ? "cheer" : "think");
  };

  const ask = (q: string) => {
    me({ k: `q-${q}` });
    const lines: (string | Msg)[] = [`a-${q}`];
    if (q === "other") lines.push({ from: "ira", kind: "wa", href: waHref });
    else lines.push("faqMore");
    ira(lines, "faqAfter", FAQ_FACE[q]);
  };

  const restart = () => {
    me({ k: "restart" });
    setLead(EMPTY);
    setConsent(false);
    ira(["hello"], "start", "wave");
  };

  /** The details as a WhatsApp message, in English for the team. */
  const leadWaHref = () => {
    const lines = [
      "Hi SSF Events, I'd like a quote for my function.",
      "",
      `Name: ${lead.name}`,
      `Phone: ${lead.phone}`,
      `Function: ${T.en[`fn-${lead.type}`] ?? lead.type}`,
      `Date: ${lead.date ? showDate(lead.date, "en") : "Not fixed yet"}`,
      lead.place ? `Venue/town: ${lead.place}` : "",
      lead.guests ? `Guests: ${T.en[lead.guests]}` : "",
      lead.needs.length ? `Needs: ${lead.needs.map((n) => T.en[`need-${n}`]).join(", ")}` : "",
    ].filter(Boolean);
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
  };

  /* ── Rendering ── */

  const text = (m: Extract<Msg, { from: "me" }>) =>
    m.raw ?? (m.ks ? m.ks.map((k) => t[k]).join(", ") : t[m.k ?? ""]);

  const renderIra = (m: Extract<Msg, { from: "ira" }>, i: number) => {
    if ("k" in m) return <p className="irac-msg" key={i}>{t[m.k]}</p>;
    if (m.kind === "summary") {
      const l = m.lead;
      return (
        <dl className="irac-msg irac-summary" key={i}>
          <dt>{t["row-type"]}</dt>
          <dd>{t[`fn-${l.type}`]}</dd>
          <dt>{t["row-date"]}</dt>
          <dd>{showDate(l.date, lang)}</dd>
          <dt>{t["row-place"]}</dt>
          <dd>{l.place}</dd>
          <dt>{t["row-guests"]}</dt>
          <dd>{t[l.guests]}</dd>
          {l.needs.length > 0 && (
            <>
              <dt>{t["row-needs"]}</dt>
              <dd>{l.needs.map((n) => t[`need-${n}`]).join(", ")}</dd>
            </>
          )}
          <dt>{t["row-name"]}</dt>
          <dd>{l.name}</dd>
          <dt>{t["row-phone"]}</dt>
          <dd>{l.phone}</dd>
        </dl>
      );
    }
    return (
      <a
        className="irac-msg irac-wa"
        key={i}
        href={m.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        <WhatsAppIcon />
        {t.openWa}
      </a>
    );
  };

  const chip = (label: string, onClick: () => void, extra?: string) => (
    <button type="button" className={`irac-chip${extra ? ` ${extra}` : ""}`} onClick={onClick} key={label}>
      {label}
    </button>
  );

  const typedStep = step === "place" || step === "name" || step === "phone";
  const submitTyped = () => {
    if (step === "place") pickPlace(draft);
    else if (step === "name") pickName(draft);
    else if (step === "phone") pickPhone(draft);
  };

  const footer = () => {
    if (typing) return null;
    switch (step) {
      case "start":
        return (
          <div className="irac-chips">
            {chip(t.plan, startPlan, "is-main")}
            {chip(t.faq, () => startFaq())}
            {chip(t.tour, startTour)}
            {chip(t.wa, startWa, "is-wa")}
          </div>
        );
      case "type":
        return <div className="irac-chips">{FUNCTIONS.map((f) => chip(t[`fn-${f}`], () => pickType(f)))}</div>;
      case "date":
        return (
          <form
            className="irac-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft) pickDate(draft);
            }}
          >
            <input
              ref={inputRef}
              type="date"
              min={today()}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label={t.askDate}
            />
            <button type="submit" className="irac-send" disabled={!draft}>
              {t.next}
            </button>
            <div className="irac-chips">{chip(t.notFixed, () => pickDate(""))}</div>
          </form>
        );
      case "guests":
        return <div className="irac-chips">{GUESTS.map((g) => chip(t[g], () => pickGuests(g)))}</div>;
      case "needs":
        return (
          <div className="irac-chips">
            {NEEDS.map((n) => (
              <button
                type="button"
                key={n}
                className="irac-chip"
                aria-pressed={lead.needs.includes(n)}
                onClick={() => toggleNeed(n)}
              >
                {t[`need-${n}`]}
              </button>
            ))}
            {chip(lead.needs.length ? t.next : t.skip, doneNeeds, "is-main")}
          </div>
        );
      case "confirm":
      case "sending":
        return (
          <div className="irac-confirm">
            <label className="irac-consent">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>
                {t.consent}{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer">
                  {t.privacy}
                </a>
              </span>
            </label>
            <button type="button" className="irac-send is-wide" onClick={send} disabled={step === "sending"}>
              {step === "sending" ? t.sending : t.send}
            </button>
          </div>
        );
      case "faq":
        return <div className="irac-chips">{FAQ.map((q) => chip(t[`q-${q}`], () => ask(q)))}</div>;
      case "faqAfter":
        return (
          <div className="irac-chips">
            {chip(t.another, () => startFaq("another"))}
            {chip(t.plan, startPlan, "is-main")}
            {chip(t.wa, startWa, "is-wa")}
          </div>
        );
      case "tour":
        return (
          <div className="irac-chips">
            {["work", "services", "reviews", "about", "enquire"]
              .filter((id) => showReviews || id !== "reviews")
              .map((id) => (
                <a key={id} className="irac-chip" href={`#${id}`} onClick={() => onNavigate(id)}>
                  {t[`nav-${id}`]}
                </a>
              ))}
          </div>
        );
      default:
        return typedStep ? (
          <form
            className="irac-form"
            onSubmit={(e) => {
              e.preventDefault();
              submitTyped();
            }}
          >
            <input
              ref={inputRef}
              type={step === "phone" ? "tel" : "text"}
              inputMode={step === "phone" ? "tel" : "text"}
              autoComplete={step === "phone" ? "tel" : step === "name" ? "name" : "off"}
              maxLength={step === "place" ? 200 : step === "name" ? 120 : 20}
              placeholder={t[step === "place" ? "placePh" : step === "name" ? "namePh" : "phonePh"]}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
              aria-label={t[step === "place" ? "placePh" : step === "name" ? "namePh" : "phonePh"]}
            />
            <button type="submit" className="irac-send" disabled={!draft.trim()}>
              {t.next}
            </button>
            {step === "place" && <div className="irac-chips">{TOWNS.map((town) => chip(town, () => pickPlace(town)))}</div>}
          </form>
        ) : null;
    }
  };

  return (
    <div className="irac" id="ira-chat" role="dialog" aria-label={`${t.title}, ${t.subtitle}`} hidden={!open} lang={lang}>
      <header className="irac-head">
        <img src={faceSrc(face)} alt="" width={40} height={40} />
        <div className="irac-who">
          <p className="irac-name">{t.title}</p>
          <p className="irac-sub">{t.subtitle}</p>
        </div>
        <div className="ira-lang" role="group" aria-label="Language">
          <button type="button" aria-pressed={lang === "en"} onClick={() => onLang("en")} lang="en">
            EN
          </button>
          <button type="button" aria-pressed={lang === "kn"} onClick={() => onLang("kn")} lang="kn">
            ಕನ್ನಡ
          </button>
        </div>
        <a className="irac-icon is-wa" href={waHref} target="_blank" rel="noopener noreferrer" aria-label={t.wa}>
          <WhatsAppIcon />
        </a>
        <button type="button" className="irac-icon" onClick={onClose} aria-label={t.close}>
          <span aria-hidden="true">✕</span>
        </button>
      </header>

      <div className="irac-list" ref={listRef} aria-live="polite">
        {msgs.map((m, i) =>
          m.from === "ira" ? (
            renderIra(m, i)
          ) : (
            <p className="irac-msg is-me" key={i}>
              {text(m)}
            </p>
          ),
        )}
        {typing && (
          <p className="irac-msg irac-typing" aria-label={t.typing}>
            <span />
            <span />
            <span />
          </p>
        )}
      </div>

      <div className="irac-foot">
        {error && (
          <p className="irac-error" role="alert">
            {t[error]}
          </p>
        )}
        {footer()}
        <div className="irac-small">
          {LEAD_STEPS.includes(step) && !typing && (
            <button type="button" onClick={restart}>
              {t.restart}
            </button>
          )}
          <button type="button" onClick={onHide}>
            {t.hide}
          </button>
        </div>
      </div>
    </div>
  );
}
