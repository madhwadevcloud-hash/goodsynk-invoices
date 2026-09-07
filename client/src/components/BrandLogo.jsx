import { Receipt } from 'lucide-react';

export default function BrandLogo({ className = '', style }) {
  return (
    <span className={`brand-logo ${className}`.trim()} style={style} aria-label="Goodsynk Invoices">
      <span className="brand-logo-icon"><Receipt size={22} strokeWidth={2.4} /></span>
      <span className="brand-logo-text">Goodsynk Invoices</span>
    </span>
  );
}