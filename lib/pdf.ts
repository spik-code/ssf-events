import { SITE } from "@/lib/site";
import { TERMS, inr, totals, type Doc } from "@/lib/documents";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** Builds the PDF in the browser (jsPDF loads on demand). English only: the
 *  built-in PDF fonts have no Kannada glyphs. shortcut: embed a Noto Kannada font if Kannada items are needed. */
export async function buildPdf(d: Doc): Promise<File> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 14;
  const NAVY: [number, number, number] = [1, 13, 64];
  const GOLD: [number, number, number] = [228, 190, 128];
  const { subtotal, total, balance } = totals(d);
  const isInv = d.kind === "invoice";

  pdf.setFillColor(...NAVY).rect(0, 0, W, 30, "F");
  pdf.setFillColor(...GOLD).rect(0, 30, W, 1.2, "F");
  pdf.setTextColor(246, 239, 226).setFont("times", "normal").setFontSize(22).text(SITE.name, M, 15);
  pdf.setFontSize(9).setTextColor(...GOLD).text(SITE.legalName, M, 22);
  pdf.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(217, 214, 228);
  pdf.text([SITE.phone, SITE.email, `${SITE.base} · ${SITE.serving}`], W - M, 11, { align: "right" });

  pdf.setTextColor(...NAVY).setFont("times", "normal").setFontSize(19).text(isInv ? "Invoice" : "Quotation", M, 44);
  pdf.setFont("helvetica", "normal").setFontSize(9).setTextColor(93, 96, 117);
  pdf.text([`No: ${d.number}`, `Date: ${fmt(d.created_at)}`], W - M, 40, { align: "right" });

  pdf.setTextColor(27, 30, 46).setFont("helvetica", "bold").setFontSize(10).text(d.client_name, M, 54);
  pdf.setFont("helvetica", "normal").setFontSize(9);
  const info = [
    d.client_phone,
    d.event_date && `Event: ${fmt(d.event_date)}`,
    d.venue && `Venue: ${d.venue}`,
  ].filter(Boolean) as string[];
  pdf.text(info, M, 59);

  let y = 59 + info.length * 4.5 + 5;
  const head = () => {
    pdf.setFillColor(...NAVY).rect(M, y, W - 2 * M, 7, "F");
    pdf.setTextColor(246, 239, 226).setFont("helvetica", "bold").setFontSize(8);
    pdf.text("#", M + 2, y + 4.7);
    pdf.text("ITEM", M + 10, y + 4.7);
    pdf.text("QTY", 128, y + 4.7, { align: "right" });
    pdf.text("RATE", 158, y + 4.7, { align: "right" });
    pdf.text("AMOUNT", W - M - 2, y + 4.7, { align: "right" });
    y += 7;
    pdf.setTextColor(27, 30, 46).setFont("helvetica", "normal").setFontSize(9);
  };
  head();

  d.items.forEach((it, i) => {
    const lines = pdf.splitTextToSize(it.desc, 100) as string[];
    const h = lines.length * 4.4 + 2.4;
    if (y + h > 270) {
      pdf.addPage();
      y = 16;
      head();
    }
    pdf.text(String(i + 1), M + 2, y + 5);
    pdf.text(lines, M + 10, y + 5);
    pdf.text(String(it.qty), 128, y + 5, { align: "right" });
    pdf.text(inr(it.rate), 158, y + 5, { align: "right" });
    pdf.text(inr(it.qty * it.rate), W - M - 2, y + 5, { align: "right" });
    pdf.setDrawColor(226, 217, 198).line(M, y + h, W - M, y + h);
    y += h;
  });

  const row = (label: string, val: string, bold = false) => {
    if (y > 270) {
      pdf.addPage();
      y = 16;
    }
    pdf.setFont("helvetica", bold ? "bold" : "normal").setFontSize(bold ? 11 : 9);
    pdf.text(label, 150, y, { align: "right" });
    pdf.text(val, W - M - 2, y, { align: "right" });
    y += bold ? 7 : 5.5;
  };
  y += 6;
  row("Subtotal", inr(subtotal));
  if (d.discount) row("Discount", `- ${inr(d.discount)}`);
  row("Total", inr(total), true);
  if (isInv) {
    row("Received", inr(d.paid));
    row("Balance due", inr(balance), true);
  } else {
    row("Advance to confirm (50%)", inr(total / 2));
  }

  y += 4;
  if (y > 255) {
    pdf.addPage();
    y = 16;
  }
  pdf.setFont("helvetica", "bold").setFontSize(8).setTextColor(184, 145, 76).text("NOTES & TERMS", M, y);
  y += 5;
  pdf.setFont("helvetica", "normal").setFontSize(8.2).setTextColor(58, 61, 80);
  ([d.notes, ...TERMS[d.kind]].filter(Boolean) as string[]).forEach((n) => {
    const l = pdf.splitTextToSize(`• ${n}`, W - 2 * M) as string[];
    if (y + l.length * 4 > 285) {
      pdf.addPage();
      y = 16;
    }
    pdf.text(l, M, y);
    y += l.length * 4 + 0.8;
  });

  return new File([pdf.output("blob")], `${d.number}-${d.client_name.replace(/[^\w]+/g, "-")}.pdf`, {
    type: "application/pdf",
  });
}

/** Opens the phone's share sheet (WhatsApp etc.) with the PDF; downloads it where unsupported. */
export async function sharePdf(d: Doc) {
  const file = await buildPdf(d);
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `${SITE.name} ${d.kind} ${d.number}` });
    } catch (e) {
      if ((e as Error).name !== "AbortError") throw e; // AbortError = owner closed the sheet
    }
    return;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(a.href);
}
