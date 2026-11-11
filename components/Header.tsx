import { Mark } from "./Mark";
import { Nav } from "./Nav";
import { ThemeSelect } from "./ThemeSelect";
import { PhoneIcon } from "./icons";
import { SITE } from "@/lib/site";

export function Header({
  showReviews = false,
  phone = SITE.phone,
  telHref = `tel:${SITE.phone.replace(/[^\d+]/g, "")}`,
}: {
  showReviews?: boolean;
  phone?: string;
  telHref?: string;
}) {
  return (
    <header className="bar">
      <div className="wrap bar-in">
        <Mark label={`${SITE.name}, home`} />
        <Nav
          links={[
            ["#work", "The work"],
            ["#services", "What we do"],
            ...(showReviews ? ([["#reviews", "Reviews"]] as [string, string][]) : []),
            ["#about", "The name"],
            ["#enquire", "Enquire"],
          ]}
        >
          <ThemeSelect />
        </Nav>
        <a className="btn btn-primary" href={telHref}>
          <PhoneIcon />
          <span className="lbl">{phone.replace(/^\+91\s*/, "")}</span>
        </a>
      </div>
    </header>
  );
}
