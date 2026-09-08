/** Client-side PDF export for a single law — jsPDF + QR, all lazy-loaded
 *  so the main bundle stays lean. Produces a clean A4 memo: header,
 *  certificate of authenticity, full text, citations, verify-with-QR page. */
import type { LegalDocument } from '../data/legalData';
import { getProvenance } from '../data/provenance';

type Doc = LegalDocument & { jurisdiction?: string };

export async function exportDocumentPdf(doc: Doc): Promise<void> {
  const QRCode = (await import('qrcode')).default;
  const { jsPDF } = await import('jspdf');
  const prov = getProvenance(doc);
  const url = `${window.location.origin}/document/${doc.id}`;

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const M = 56;
  let y = 0;

  const footer = () => {
    const n = pdf.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      pdf.setPage(i);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(130);
      pdf.text(`LegalCore • ${doc.id.toUpperCase()} • Research assistance — not legal advice`, M, H - 28);
      pdf.text(`Page ${i} of ${n}`, W - M, H - 28, { align: 'right' });
    }
  };
  const ensure = (need: number) => {
    if (y + need > H - 70) {
      pdf.addPage();
      y = M;
    }
  };

  // header band
  pdf.setFillColor(10, 46, 34);
  pdf.rect(0, 0, W, 64, 'F');
  pdf.setFillColor(212, 175, 23);
  pdf.rect(0, 64, W, 4, 'F');
  pdf.setTextColor(255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text('LegalCore — West Africa Law Library', M, 30);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(220);
  pdf.text(`${prov.tierLabel} • ${prov.binding} • Verified ${prov.verifiedOn}`, M, 47);
  y = 102;

  // title + meta
  pdf.setTextColor(15);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  const titleLines: string[] = pdf.splitTextToSize(doc.title, W - M * 2);
  ensure(titleLines.length * 21 + 12);
  pdf.text(titleLines, M, y);
  y += titleLines.length * 21;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(90);
  const meta = `${doc.type.toUpperCase()} • ${doc.date} • ${doc.category}${doc.court ? ` • ${doc.court}` : ''}`;
  const metaLines: string[] = pdf.splitTextToSize(meta, W - M * 2);
  pdf.text(metaLines, M, y);
  y += metaLines.length * 13 + 14;

  // certificate box
  pdf.setFontSize(9.5);
  const wrapped: string[] = [];
  [
    `Came from: ${prov.source} — ${prov.sourceDetail}`,
    `Authority: ${prov.authority}`,
    `Legitimacy: ${prov.legitimacy}`,
  ].forEach((l) => wrapped.push(...pdf.splitTextToSize(l, W - M * 2 - 16)));
  const boxH = wrapped.length * 13 + 22;
  ensure(boxH + 8);
  pdf.setFillColor(247, 247, 244);
  pdf.setDrawColor(212, 175, 23);
  pdf.roundedRect(M, y, W - M * 2, boxH, 4, 4, 'FD');
  y += 15;
  pdf.setTextColor(40);
  wrapped.forEach((l) => {
    pdf.text(l, M + 8, y);
    y += 13;
  });
  y += 16;

  // body
  for (const rawLine of doc.body.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      y += 6;
      continue;
    }
    const isHead = line === line.toUpperCase() && line.length > 3 && !line.startsWith('(');
    if (isHead) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11.5);
      pdf.setTextColor(10, 46, 34);
      const hl: string[] = pdf.splitTextToSize(line, W - M * 2);
      ensure(hl.length * 14 + 14);
      y += 6;
      pdf.text(hl, M, y);
      y += hl.length * 14 + 4;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10.5);
      pdf.setTextColor(30);
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10.5);
      pdf.setTextColor(30);
      const pl: string[] = pdf.splitTextToSize(line, W - M * 2);
      ensure(pl.length * 13.5 + 4);
      pdf.text(pl, M, y);
      y += pl.length * 13.5 + 2;
    }
  }

  // citations
  if (doc.citations.length > 0) {
    y += 10;
    ensure(30);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(15);
    pdf.text('Citations & Authority', M, y);
    y += 16;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(40);
    doc.citations.forEach((c, i) => {
      const cl: string[] = pdf.splitTextToSize(`${i + 1}. ${c}`, W - M * 2);
      ensure(cl.length * 13 + 4);
      pdf.text(cl, M, y);
      y += cl.length * 13 + 2;
    });
  }

  // verify page with QR
  const qr: string = await QRCode.toDataURL(url, { width: 220, margin: 1 });
  pdf.addPage();
  y = M;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(15);
  pdf.text('Verify this document', M, y);
  y += 22;
  pdf.addImage(qr, 'PNG', M, y, 150, 150);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(60);
  const ul: string[] = pdf.splitTextToSize(`Scan to open this law on any phone:\n${url}\n\nRecord: ${doc.id.toUpperCase()}`, W - M * 2 - 170);
  pdf.text(ul, M + 170, y + 14);

  footer();
  pdf.save(`${doc.id}.pdf`);
}
