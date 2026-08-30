import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import { PublicFooter } from '@/components/PublicFooter.jsx';
import { EditorialDestinations } from '@/components/ui/EditorialDestinations.jsx';
import { ExpenseSummaryWidget } from '@/components/dashboard/ExpenseSummaryWidget.jsx';
import { TravelImage } from '@/components/common/TravelImage.jsx';
import { useTheme } from '@/providers/ThemeProvider.jsx';
import {
  HERO_TRAVELER,
  HERO_VIEWPOINT,
  HERO_MAP,
  HERO_FRIENDS,
  EXPLORE_CATEGORIES,
  POPULAR_DESTINATIONS,
} from '@/lib/travelImagery.js';

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Tell us your journey',
    desc: 'Origin, destination, dates, budget, and travel style.',
    image: HERO_MAP,
  },
  {
    step: '2',
    title: 'Let AI build your route',
    desc: 'Discovery, transport, stays, and a time-aware itinerary.',
    image: HERO_VIEWPOINT,
  },
  {
    step: '3',
    title: 'Travel with YOLO',
    desc: 'Live map, progress, expenses, and contextual AI help.',
    image: HERO_FRIENDS,
  },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold bg-gradient-to-r from-[var(--brand-strong)] to-[var(--brand-primary)] bg-clip-text text-transparent">
            YOLO
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--text-secondary)]">
            <a href="#popular" className="hover:text-[var(--text-primary)]">Popular</a>
            <a href="#experiences" className="hover:text-[var(--text-primary)]">Experiences</a>
            <a href="#how" className="hover:text-[var(--text-primary)]">How it works</a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="yolo-theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
            <Link to="/login" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hidden sm:inline">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold rounded-full px-4 py-2 text-white"
              style={{ background: 'var(--gradient-ai)' }}
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-end">
        <TravelImage
          src={HERO_TRAVELER}
          alt=""
          className="absolute inset-0 h-full w-full"
          imgClassName="h-full w-full"
          loading="eager"
        />
        <div className="yolo-hero-overlay" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-16 md:pb-24 pt-32 w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl text-white"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.05]">
              Your journey.
              <br />
              Intelligently planned.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/75 leading-relaxed max-w-xl">
              Tell YOLO where you want to go. We&apos;ll plan the route, discover places worth
              stopping for, manage your budget, and stay with you throughout the journey.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup">
                <PrimaryButton>Plan My Journey</PrimaryButton>
              </Link>
              <a href="#popular">
                <SecondaryButton className="!border-white/30 !bg-white/10 !text-white hover:!bg-white/20">
                  Explore Destinations
                </SecondaryButton>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Popular Places */}
      <div id="popular" className="max-w-6xl mx-auto px-6 pt-16 md:pt-20">
        <EditorialDestinations
          destinations={POPULAR_DESTINATIONS}
          onExplore={() => navigate('/signup')}
        />
      </div>

      {/* Travel Experiences */}
      <section id="experiences" className="max-w-6xl mx-auto px-6 yolo-section-gap">
        <p className="yolo-label text-[var(--brand)]">Travel Experiences</p>
        <h2 className="mt-2 text-2xl md:text-3xl font-display font-bold">Explore by vibe</h2>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {EXPLORE_CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className={`relative overflow-hidden rounded-2xl md:rounded-3xl min-h-[140px] ${
                cat.size === 'large' ? 'md:col-span-2 md:row-span-2 min-h-[280px]' : ''
              }`}
            >
              <TravelImage
                src={cat.image}
                alt=""
                className="absolute inset-0 h-full w-full"
                imgClassName="h-full w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
              <span className="absolute bottom-4 left-4 font-display text-lg font-semibold text-white">
                {cat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How YOLO Works */}
      <section id="how" className="max-w-6xl mx-auto px-6 yolo-section-gap">
        <p className="yolo-label text-[var(--brand)]">How YOLO Works</p>
        <h2 className="mt-2 text-2xl md:text-3xl font-display font-bold">Three steps to smarter travel</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-5">
          {HOW_IT_WORKS.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="yolo-widget overflow-hidden"
            >
              <div className="relative h-40">
                <TravelImage
                  src={item.image}
                  alt=""
                  className="h-full w-full"
                  imgClassName="h-full w-full"
                />
                <span className="absolute top-3 left-3 h-8 w-8 rounded-full bg-[var(--brand)] text-white text-sm font-bold flex items-center justify-center">
                  {item.step}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-display font-semibold text-lg">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Travel Companion */}
      <section className="max-w-6xl mx-auto px-6 yolo-section-gap">
        <div className="grid md:grid-cols-2 gap-8 items-center yolo-widget overflow-hidden p-0">
          <div className="relative min-h-[280px] md:min-h-full">
            <TravelImage
              src={HERO_MAP}
              alt=""
              className="absolute inset-0 h-full w-full"
              imgClassName="h-full w-full"
            />
            <div className="absolute inset-0 bg-[var(--brand)]/20" />
          </div>
          <div className="p-8 md:p-10">
            <p className="yolo-label text-[var(--ai-accent)]">AI Travel Companion</p>
            <h2 className="mt-2 text-2xl font-display font-bold">Ask anything on the road</h2>
            <div className="mt-6 space-y-3">
              <ChatBubble role="user" text="Where should we stop for lunch?" />
              <ChatBubble
                role="ai"
                text="I found three highly-rated restaurants 18 minutes ahead on your route."
              />
            </div>
            <Link to="/signup" className="inline-block mt-6">
              <PrimaryButton>Try YOLO AI</PrimaryButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Expense Intelligence */}
      <section className="max-w-6xl mx-auto px-6 yolo-section-gap">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="yolo-label text-[var(--brand)]">Expense Intelligence</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-display font-bold">
              Know where every rupee goes
            </h2>
            <p className="mt-3 text-[var(--text-secondary)] leading-relaxed">
              Track spending by category, compare against your budget, and get AI insights while you
              travel.
            </p>
          </div>
          <ExpenseSummaryWidget
            spent={18420}
            budget={30000}
            currency="₹"
            byCategory={{ FOOD: 4200, TRANSPORT: 7800, STAY: 5200, ACTIVITIES: 1220 }}
            insight="You're currently 12% under your planned budget."
          />
        </div>
      </section>

      {/* Trending */}
      <section className="max-w-6xl mx-auto px-6 yolo-section-gap">
        <p className="yolo-label text-[var(--brand)]">Travel Discovery</p>
        <h2 className="mt-2 text-2xl md:text-3xl font-display font-bold">Trending this week</h2>
        <div className="mt-6 flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {POPULAR_DESTINATIONS.slice(0, 4).map((d) => (
            <Link
              key={d.id}
              to="/signup"
              className="snap-start shrink-0 w-[260px] relative overflow-hidden rounded-2xl min-h-[320px] group yolo-card-hover"
            >
              <TravelImage
                src={d.image}
                alt=""
                className="absolute inset-0 h-full w-full group-hover:scale-105 transition-transform duration-500"
                imgClassName="h-full w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="relative p-5 flex flex-col justify-end min-h-[320px] text-white">
                <h3 className="font-display text-xl font-bold">{d.name}</h3>
                <p className="text-xs text-white/60 mt-1">{d.region}</p>
                <p className="text-xs mt-2 text-white/75">★ {d.rating} · {d.category}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-8">
        <div className="relative overflow-hidden rounded-[1.75rem] min-h-[280px] flex items-center justify-center text-center">
          <TravelImage
            src={HERO_VIEWPOINT}
            alt=""
            className="absolute inset-0 h-full w-full"
            imgClassName="h-full w-full"
          />
          <div className="yolo-hero-overlay" />
          <div className="relative z-10 p-10 text-white max-w-lg">
            <h2 className="text-3xl md:text-4xl font-display font-bold">Your next adventure is waiting.</h2>
            <p className="mt-3 text-white/70">Join travelers who plan smarter with AI.</p>
            <Link to="/signup" className="inline-block mt-6">
              <PrimaryButton>Start Planning</PrimaryButton>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function ChatBubble({ role, text }) {
  const isUser = role === 'user';
  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm max-w-[90%] ${
        isUser
          ? 'ml-auto bg-[var(--surface-muted)] text-[var(--text-primary)]'
          : 'mr-auto border border-[var(--ai-accent)]/25 text-[var(--text-secondary)]'
      }`}
      style={!isUser ? { background: 'var(--ai-accent-soft)' } : undefined}
    >
      {!isUser && <span className="text-[var(--ai-accent)] font-semibold text-xs">✨ YOLO</span>}
      <p className={!isUser ? 'mt-1' : ''}>{text}</p>
    </div>
  );
}
