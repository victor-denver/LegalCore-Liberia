import { useEffect, useRef, useState } from 'react';
import { Copy, Check, FileDown, Loader2 } from 'lucide-react';
import type { LegalDocument } from '../data/legalData';
import { exportDocumentPdf } from '../utils/exportPdf';

/** Scan, verify & export card: QR code + bar code + copy link + download PDF.
 *  Heavy libs (qrcode/jsbarcode/jspdf) lazy-load only when a law is opened. */
export default function VerifyCard({ doc }: { doc: LegalDocument & { jurisdiction?: string } }) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const barRef = useRef<SVGSVGElement>(null);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/document/${doc.id}` : `/document/${doc.id}`;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const dataUrl: string = await QRCode.toDataURL(url, { width: 220, margin: 1 });
        if (alive) setQr(dataUrl);
      } catch {
        /* card still shows the URL + barcode */
      }
    })();
    return () => {
      alive = false;
    };
  }, [url]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const JsBarcode = (await import('jsbarcode')).default;
        if (!alive || !barRef.current) return;
        JsBarcode(barRef.current, doc.id.toUpperCase(), {
          format: 'CODE128',
          height: 46,
          displayValue: true,
          fontSize: 11,
          background: '#ffffff',
          lineColor: '#0e0e0e',
          margin: 8,
        });
      } catch {
        /* ignore — QR + URL remain */
      }
    })();
    return () => {
      alive = false;
    };
  }, [doc.id]);

  const download = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    try {
      await exportDocumentPdf(doc);
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="verify-card">
      <div className="verify-codes">
        <div className="verify-qr">
          {qr ? <img src={qr} alt={`QR code for ${doc.title}`} /> : <span className="verify-skel" />}
          <small>QR — scan to open this law</small>
        </div>
        <div className="verify-bar">
          <svg ref={barRef} role="img" aria-label={`Bar code for record ${doc.id}`} />
          <small>BAR CODE — record {doc.id.toUpperCase()}</small>
        </div>
      </div>
      <div className="verify-actions">
        <code className="verify-url">{url}</code>
        <div className="verify-btns">
          <button
            className="toolbar-btn"
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy link'}
          </button>
          <button className="toolbar-btn toolbar-btn--pdf" onClick={download} disabled={pdfBusy}>
            {pdfBusy ? <Loader2 size={14} className="spin" /> : <FileDown size={14} />}{pdfBusy ? 'Making PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
