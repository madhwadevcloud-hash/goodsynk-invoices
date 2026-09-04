import { Receipt } from 'lucide-react';

export default function BrandLogo({ className = '', style }) {
  return (
    <span className={`brand-logo ${className}`.trim()} style={style}>
      <span className="brand-logo-icon"><Receipt size={22} /></span>
      <span className="brand-logo-text">Goodsynk Invoices</span>
    </span>
  );
}