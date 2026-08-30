import { Link } from 'react-router-dom';
import { PublicFooter } from '@/components/PublicFooter.jsx';

/**
 * Lightweight public info pages linked from the footer.
 */
export default function StaticInfoPage({ title, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_#EEF6FF_0%,_#F9FAFC_50%,_#F3F7FB_100%)]">
      <header className="px-6 py-5 flex items-center justify-between max-w-4xl mx-auto w-full">
        <Link to="/" className="font-display text-xl font-bold text-[var(--text-primary)]">
          YOLO
        </Link>
        <Link to="/login" className="text-sm font-medium text-primary-600">
          Sign in
        </Link>
      </header>
      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full">
        <h1 className="text-3xl font-display font-semibold text-[var(--text-primary)]">{title}</h1>
        <div className="mt-6 prose prose-neutral text-[var(--text-secondary)] space-y-4 text-[15px] leading-relaxed">
          {children}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
