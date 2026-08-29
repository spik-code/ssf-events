import { Mark } from "./Mark";
import { ThemeSelect } from "./ThemeSelect";
import { PhoneIcon } from "./icons";
import { SITE, telHref } from "@/lib/site";

export function Header({ showReviews = false }: { showReviews?: boolean }) {
  return (
    <header className="bar">
      <div className="wrap bar-in">
        <Mark label={`${SITE.name}, home`} />
        <nav className="nav" aria-label="Sections">
          <a href="#work">The work</a>
          <a href="#services">What we do</a>
          <a href="#reel">On camera</a>
          {showReviews && <a href="#reviews">Reviews</a>}
          <a href="#about">The name</a>
          <a href="#enquire">Enquire</a>
        </nav>
        <ThemeSelect />
        <a className="btn btn-primary" href={telHref}>
          <PhoneIcon />
          <span className="lbl">{SITE.phone.replace("+91 ", "")}</span>
        </a>
      </div>
    </header>
  );
}
