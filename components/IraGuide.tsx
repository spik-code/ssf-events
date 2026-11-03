"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { WhatsAppIcon } from "./icons";
import { IraChat } from "./IraChat";
import { ENQUIRY_SENT_EVENT, FACES, faceSrc, type Face, type Lang } from "@/lib/ira";

/** "Hide Ira" lasts for this visit only: she also carries the WhatsApp link,
 *  so hiding her for good would leave no way back to it. */
const HIDE_KEY = "ssf-ira-hidden";
/** Set after the first-ever visit, so the arrival animation plays once. */
const MET_KEY = "ssf-ira-met";
/** Remembers English / Kannada. */
const LANG_KEY = "ssf-ira-lang";
/** Tips already shown this visit, so a reload doesn't repeat them. */
const SEEN_KEY = "ssf-ira-seen";

/** A section counts as "reached" once its top passes this far down the viewport. */
const LINE = 0.45;
const TIP_MS = 6500;
const SLEEP_AFTER_MS = 30000;

type TipKey = "greet" | "greetBack" | "work" | "services" | "reviews" | "about" | "enquire" | "back" | "sent";

/** Section id -> the face Ira pulls when the visitor reaches it. */
const SECTION_FACE: Record<string, Face> = {
  top: "wave",
  work: "wow",
  services: "think",
  reviews: "laugh",
  about: "cheer",
  enquire: "wink",
};

const TEXT: Record<Lang, Record<TipKey, string> & Record<string, string>> = {
  en: {
    greet: "Namaskara! I'm Ira. Tap me to ask a question or plan your function.",
    greetBack: "Welcome back! Tap me if you need anything.",
    work: "Every photo here is a real SSF setup. Use the filters to see just weddings, mandaps or haldi.",
    services: "Stage, flowers, lighting and sound from one team, so nothing falls between vendors.",
    reviews: "These are real Google reviews from families we've decorated for.",
    about: "Since 1999 and 5,000+ weddings. That's a lot of flowers!",
    enquire: "Fill in the form, or tap me and I'll note your details in a minute.",
    back: "Oh, you're back! Shall I take you somewhere?",
    sent: "Thank you! Your enquiry reached us. We'll call you back soon.",
    wa: "Chat on WhatsApp",
    ask: "Chat with Ira, the SSF guide",
    close: "Close chat",
  },
  kn: {
    greet: "ನಮಸ್ಕಾರ! ನಾನು ಇರಾ. ಪ್ರಶ್ನೆ ಕೇಳಲು ಅಥವಾ ಸಮಾರಂಭ ಪ್ಲಾನ್ ಮಾಡಲು ನನ್ನನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿ.",
    greetBack: "ಮತ್ತೆ ಸ್ವಾಗತ! ಏನಾದರೂ ಬೇಕಿದ್ದರೆ ನನ್ನನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿ.",
    work: "ಇಲ್ಲಿರುವ ಪ್ರತಿಯೊಂದು ಫೋಟೋ SSF ನಿಜವಾಗಿ ಮಾಡಿದ ಅಲಂಕಾರ. ಮದುವೆ, ಮಂಟಪ ಅಥವಾ ಹಲ್ದಿ ಫೋಟೋಗಳನ್ನು ಮಾತ್ರ ನೋಡಲು ಫಿಲ್ಟರ್ ಬಳಸಿ.",
    services: "ಸ್ಟೇಜ್, ಹೂವು, ಲೈಟಿಂಗ್, ಸೌಂಡ್ ಎಲ್ಲವೂ ಒಂದೇ ತಂಡದಿಂದ. ಬೇರೆ ಬೇರೆ ವೆಂಡರ್‌ಗಳ ತಲೆನೋವು ಇಲ್ಲ.",
    reviews: "ಇವು ನಾವು ಅಲಂಕಾರ ಮಾಡಿದ ಕುಟುಂಬಗಳು ಬರೆದ ನಿಜವಾದ Google ರಿವ್ಯೂಗಳು.",
    about: "1999 ರಿಂದ 5,000ಕ್ಕೂ ಹೆಚ್ಚು ಮದುವೆಗಳು. ಎಷ್ಟೊಂದು ಹೂವುಗಳು!",
    enquire: "ಫಾರ್ಮ್ ತುಂಬಿ, ಅಥವಾ ನನ್ನನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿ, ಒಂದು ನಿಮಿಷದಲ್ಲಿ ವಿವರ ಬರೆದುಕೊಳ್ಳುತ್ತೇನೆ.",
    back: "ಓಹ್, ಮತ್ತೆ ಬಂದಿರಿ! ಎಲ್ಲಿಗಾದರೂ ಕರೆದುಕೊಂಡು ಹೋಗಲಾ?",
    sent: "ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ವಿಚಾರಣೆ ನಮಗೆ ತಲುಪಿದೆ. ಶೀಘ್ರದಲ್ಲೇ ಕರೆ ಮಾಡುತ್ತೇವೆ.",
    wa: "WhatsApp ನಲ್ಲಿ ಮಾತಾಡಿ",
    ask: "SSF ಗೈಡ್ ಇರಾ ಜೊತೆ ಚಾಟ್ ಮಾಡಿ",
    close: "ಚಾಟ್ ಮುಚ್ಚಿ",
  },
};

/** Fixed petal layout (left %, delay s, duration s, spin deg) for the celebration shower. */
const PETALS = [
  [6, 0, 2.6, 160], [15, 0.4, 3.1, -120], [24, 0.15, 2.8, 200], [33, 0.6, 3.3, -180],
  [42, 0.05, 2.7, 140], [51, 0.5, 3.0, -220], [60, 0.2, 2.9, 180], [69, 0.7, 3.2, -150],
  [78, 0.1, 2.6, 210], [87, 0.45, 3.1, -170], [94, 0.25, 2.8, 130], [47, 0.85, 3.4, -200],
];

function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function store(area: "local" | "session", key: string, value: string) {
  try {
    (area === "local" ? localStorage : sessionStorage).setItem(key, value);
  } catch {
    /* storage blocked: the choice just won't persist */
  }
}

/**
 * Ira, the SSF lotus mascot, as a floating guide. She changes expression per
 * section, blinks, waves on hover, leans and hops while the page scrolls,
 * dozes off when nobody is around, and celebrates a sent enquiry. Tips and
 * the menu come in English or Kannada.
 *
 * Like RevealOnScroll, the current section comes from a position sweep rather
 * than an IntersectionObserver, so a single-frame jump from the nav still
 * lands on the right section. Scroll motion is written to CSS variables on
 * the button directly, so scrolling never re-renders React.
 */
export function IraGuide({
  showReviews,
  whatsapp,
  waHref,
}: {
  showReviews: boolean;
  whatsapp: string;
  waHref: string;
}) {
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [tip, setTip] = useState<TipKey | null>(null);
  const [mood, setMood] = useState<Face>("smile");
  const [blink, setBlink] = useState(false);
  const [hover, setHover] = useState(false);
  const [asleep, setAsleep] = useState(false);
  const [intro, setIntro] = useState(false);
  const [petals, setPetals] = useState(false);

  const seen = useRef<Set<string>>(new Set());
  const returning = useRef(false);
  const reduce = useRef(false);
  const openRef = useRef(false);
  const asleepRef = useRef(false);
  const tipTimer = useRef(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const t = TEXT[lang];

  /** Show a tip with a face, then settle back to a smile. With the menu open, only the face changes. */
  const say = (key: TipKey | null, face: Face, ms = TIP_MS) => {
    window.clearTimeout(tipTimer.current);
    setMood(face);
    setTip(openRef.current ? null : key);
    tipTimer.current = window.setTimeout(() => {
      setTip(null);
      setMood("smile");
    }, ms);
  };

  const celebrate = () => {
    say("sent", "cheer", 8000);
    if (reduce.current) return;
    setPetals(true);
    window.setTimeout(() => setPetals(false), 4200);
  };

  // Restore saved choices.
  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let met = false;
    try {
      if (sessionStorage.getItem(HIDE_KEY) === "1") setHidden(true);
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "kn" || saved === "en") setLang(saved);
      else if (navigator.language.toLowerCase().startsWith("kn")) setLang("kn");
      met = localStorage.getItem(MET_KEY) === "1";
    } catch {
      /* storage blocked: defaults apply */
    }
    returning.current = met;
    // MET_KEY is written when she actually greets (in the section sweep), so a
    // double-run of this effect can't turn a first visit into "welcome back".
    if (!met) {
      if (!reduce.current) {
        // Arrive with closed eyes, like a bud, and open them on landing.
        setIntro(true);
        setMood("blink");
        window.setTimeout(() => setMood("smile"), 1100);
        window.setTimeout(() => setIntro(false), 1600);
      }
    }
    seen.current = readSeen();
    setReady(true);
    FACES.forEach((f) => {
      new Image().src = faceSrc(f);
    });
  }, []);

  useEffect(() => {
    openRef.current = open;
    if (open) {
      setTip(null);
      setChatMounted(true);
    }
  }, [open]);

  useEffect(() => {
    asleepRef.current = asleep;
  }, [asleep]);

  // Section tips.
  useEffect(() => {
    if (!ready || hidden) return;
    const ids = Object.keys(SECTION_FACE).filter((id) => document.getElementById(id));
    let raf = 0;

    const sweep = () => {
      raf = 0;
      const line = window.innerHeight * LINE;
      let current = "top";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      if (seen.current.has(current) || openRef.current || asleepRef.current) return;
      seen.current.add(current);
      store("session", SEEN_KEY, JSON.stringify([...seen.current]));
      const key: TipKey = current === "top" ? (returning.current ? "greetBack" : "greet") : (current as TipKey);
      store("local", MET_KEY, "1");
      say(key, SECTION_FACE[current]);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sweep);
    };

    // Give the hero a moment before the greeting.
    const greet = window.setTimeout(sweep, 2200);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(greet);
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [ready, hidden]);

  // Lean and hop while the page scrolls; spring back upright when it stops.
  useEffect(() => {
    if (!ready || hidden || reduce.current) return;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let raf = 0;
    let stop = 0;

    const frame = () => {
      raf = 0;
      const el = btnRef.current;
      if (!el) return;
      const now = performance.now();
      const y = window.scrollY;
      const v = (y - lastY) / Math.max(now - lastT, 1); // px per ms
      lastY = y;
      lastT = now;
      const lean = Math.max(-12, Math.min(12, v * 7));
      const hop = -Math.abs(Math.sin(y / 45)) * 6; // one hop every ~140px: a little walk
      el.classList.add("is-moving");
      el.style.setProperty("--ira-lean", `${lean.toFixed(1)}deg`);
      el.style.setProperty("--ira-step", `${hop.toFixed(1)}px`);
      window.clearTimeout(stop);
      stop = window.setTimeout(() => {
        el.classList.remove("is-moving");
        el.style.setProperty("--ira-lean", "0deg");
        el.style.setProperty("--ira-step", "0px");
      }, 140);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(stop);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ready, hidden]);

  // Blink every few seconds.
  useEffect(() => {
    if (!ready || hidden) return;
    let timer = 0;
    const loop = () => {
      timer = window.setTimeout(() => {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 160);
        loop();
      }, 3000 + Math.random() * 3000);
    };
    loop();
    return () => window.clearTimeout(timer);
  }, [ready, hidden]);

  // Doze off after 30 s with no activity; wake with a wave.
  useEffect(() => {
    if (!ready || hidden) return;
    let last = Date.now();
    const wake = () => {
      last = Date.now();
      if (asleepRef.current) {
        setAsleep(false);
        say(null, "wave", 1400);
      }
    };
    const check = window.setInterval(() => {
      if (!asleepRef.current && !openRef.current && Date.now() - last > SLEEP_AFTER_MS) {
        setTip(null);
        setAsleep(true);
      }
    }, 5000);
    const events = ["scroll", "pointermove", "pointerdown", "keydown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    return () => {
      window.clearInterval(check);
      events.forEach((e) => window.removeEventListener(e, wake));
    };
  }, [ready, hidden]);

  // Welcome back after a tab switch, and celebrate a sent enquiry. Sending
  // opens WhatsApp in a new tab, so if the page is hidden by then, the
  // celebration waits for the visitor to come back.
  useEffect(() => {
    if (!ready || hidden) return;
    let hiddenAt = 0;
    let pending = false;
    let welcomed = false;

    const onSent = () => {
      window.setTimeout(() => {
        if (document.hidden) pending = true;
        else celebrate();
      }, 700);
    };
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      if (pending) {
        pending = false;
        celebrate();
      } else if (!welcomed && hiddenAt && Date.now() - hiddenAt > 10000) {
        welcomed = true;
        say("back", "wave");
      }
    };
    window.addEventListener(ENQUIRY_SENT_EVENT, onSent);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener(ENQUIRY_SENT_EVENT, onSent);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ready, hidden]);

  // Close the chat on Escape or a click outside it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  if (!ready || hidden) return null;

  const face: Face = asleep
    ? "sleepy"
    : mood !== "smile"
      ? mood
      : hover
        ? "wave"
        : blink
          ? "blink"
          : "smile";

  const go = (id: string) => {
    // The visitor chose this section, so its tip would only repeat them.
    seen.current.add(id);
    setOpen(false);
  };

  const pickLang = (l: Lang) => {
    setLang(l);
    store("local", LANG_KEY, l);
  };

  const hide = () => {
    store("session", HIDE_KEY, "1");
    setHidden(true);
  };

  return (
    <>
      <div className={`ira${intro ? " is-intro" : ""}`} ref={boxRef}>
        {chatMounted && (
          <IraChat
            open={open}
            lang={lang}
            onLang={pickLang}
            face={face}
            whatsapp={whatsapp}
            waHref={waHref}
            showReviews={showReviews}
            onMood={(f, ms) => say(null, f, ms)}
            onNavigate={go}
            onClose={() => {
              setOpen(false);
              btnRef.current?.focus();
            }}
            onHide={hide}
          />
        )}

        {tip && !open && (
          <p className="ira-tip" role="status" lang={lang} onClick={() => setOpen(true)}>
            {t[tip]}
          </p>
        )}

        {asleep && (
          <span className="ira-zz" aria-hidden="true">
            z<span>z</span>
          </span>
        )}

        <div className="ira-dock">
          <button
            ref={btnRef}
            type="button"
            className="ira-btn"
            aria-expanded={open}
            aria-controls="ira-chat"
            aria-label={open ? t.close : t.ask}
            title={t.ask}
            onClick={() => setOpen((o) => !o)}
            onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
            onPointerLeave={() => setHover(false)}
          >
            {/* Re-keying replays the little pop on a real change of expression, not on blinks. */}
            <img
              key={face === "blink" || face === "smile" ? "base" : face}
              src={faceSrc(face)}
              alt=""
              width={64}
              height={64}
            />
          </button>
          {/* WhatsApp stays one tap away now that the separate green button is gone. */}
          {!open && (
            <a className="ira-wa" href={waHref} target="_blank" rel="noopener noreferrer" aria-label={t.wa} title={t.wa}>
              <WhatsAppIcon />
            </a>
          )}
        </div>
      </div>

      {petals && (
        <div className="ira-petals" aria-hidden="true">
          {PETALS.map(([x, d, s, r], i) => (
            <i
              key={i}
              style={{ "--x": `${x}%`, "--d": `${d}s`, "--s": `${s}s`, "--r": `${r}deg` } as CSSProperties}
            />
          ))}
        </div>
      )}
    </>
  );
}
