import { Link } from 'react-router-dom';
import { FOOTER_BG } from '@/lib/travelImagery.js';
import { TravelImage } from '@/components/common/TravelImage.jsx';

const PRODUCT = [
  { to: '/login?redirect=/trips/new/basics', label: 'AI Travel Planner' },
  { to: '/login?redirect=/trips', label: 'Live Trips' },
  { to: '/login?redirect=/expenses', label: 'Expense Tracker' },
  { to: '/help', label: 'Travel Assistant' },
];

const COMPANY = [
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const LEGAL = [
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
];

/**
 * Public-site footer. Do not use inside live-trip / authenticated app chrome.
 */
export function PublicFooter({ compact = false }) {
  if (compact) {
    return (
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--surface-raised)]/70 backdrop-blur px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-[var(--text-muted)]">
          <p>
            <span className="font-display font-semibold text-[var(--text-primary)]">YOLO</span>
            <span className="mx-2">·</span>
            Your journey. Intelligently planned.
          </p>
          <p>© 2026 YOLO. All rights reserved.</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative overflow-hidden text-white">
      <TravelImage
        src={FOOTER_BG}
        alt=""
        className="absolute inset-0 h-full w-full"
        imgClassName="h-full w-full"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-ocean-950/95 via-ocean-900/90 to-teal-950/85" />
      <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-20">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <p className="font-display text-3xl font-bold tracking-tight">YOLO</p>
            <p className="mt-4 text-base text-white/70 leading-relaxed max-w-sm">
              Your journey. Intelligently planned. Discovery, itineraries, live guidance, and
              expenses — powered by AI.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="yolo-chip bg-white/10 text-white/80 backdrop-blur">AI-native</span>
              <span className="yolo-chip bg-white/10 text-white/80 backdrop-blur">Plan · Live · Reflect</span>
            </div>
          </div>
          <div className="md:col-span-7 grid sm:grid-cols-3 gap-8">
            <FooterCol title="Product" links={PRODUCT} />
            <FooterCol title="Company" links={COMPANY} />
            <FooterCol title="Legal" links={LEGAL} />
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-white/50">© 2026 YOLO. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link to="/login" className="text-white/70 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              to="/login?redirect=/trips/new/basics"
              className="text-teal-300 hover:text-teal-200 font-semibold transition-colors"
            >
              Plan My Journey →
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">{title}</p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.to} className="text-sm text-white/70 hover:text-white transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
