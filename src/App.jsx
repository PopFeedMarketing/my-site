import { useState, useEffect } from "react";
/*
 * ============================================
 *  POPFEED MARKETING — MAIN APP
 * ============================================
 *  
 *  PAGES:
 *  - "home"     → Landing page with service sections
 *  - "pricing"  → Pricing / subscription plans
 *  - "contact"  → Contact form
 *  - "login"    → Login page
 *  - "signup"   → Sign up page
 *
 *  TO EDIT: Search for "EDIT:" comments throughout this file
 *  to find the content sections you can easily change.
 *
 * ============================================
 */

/* ─── Color Palette (CSS Variables are in index.css) ───
 *  --black:       #0a0a0a
 *  --glass:       rgba(255,255,255,0.06)
 *  --glass-border:rgba(255,255,255,0.12)
 *  --peach:       #ffb399
 *  --purple:      #b388ff
 *  --slblue:      #7ec8e3  (salt lake blue)
 *  --text:        #e8e8e8
 *  --text-dim:    #888
 */

// ════════════════════════════════════════════
//  NAVIGATION BAR
// ════════════════════════════════════════════

import Silk from './Silk';
import ScrollVelocity from './ScrollVelocity';
import MagnetLines from './MagnetLines';
import { PRICE_IDS } from './stripeConfig';
import { supabase } from './supabaseClient';
import Dashboard from './Dashboard';
import './Dashboard.css';

function Navbar({ currentPage, setPage, user, setUser }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = (page) => {
    setPage(page);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <div className="nav-logo" onClick={() => navigate("home")}>
          <img src="/logo.png" alt="PopFeed" style={{ height: '100px', marginTop: '14px' }} />
        </div>
        <div className="nav-links">
          <button className={`nav-link ${currentPage === "home" ? "active" : ""}`} onClick={() => navigate("home")}>Home</button>
          <button className={`nav-link ${currentPage === "pricing" ? "active" : ""}`} onClick={() => navigate("pricing")}>Pricing</button>
          <button className={`nav-link ${currentPage === "examples" ? "active" : ""}`} onClick={() => navigate("examples")}>Examples</button>
          <button className={`nav-link ${currentPage === "contact" ? "active" : ""}`} onClick={() => navigate("contact")}>Contact</button>
        </div>
        <div className="nav-auth">
          {user ? (
            <div className="user-menu">
              <button className="btn-ghost" onClick={() => navigate("dashboard")}>Dashboard</button>
              <button className="btn-ghost" onClick={() => navigate("account")}>Hi, {user.name}</button>
              <button className="btn-ghost" onClick={() => { supabase.auth.signOut(); setUser(null); navigate("home"); }}>Log Out</button>
            </div>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => navigate("login")}>Log In</button>
              <button className="btn-accent" onClick={() => navigate("signup")}>Sign Up</button>
            </>
          )}
        </div>
        {/* Hamburger — mobile only */}
        <button
          className={`nav-hamburger ${mobileMenuOpen ? "open" : ""}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <button className={`mobile-nav-link ${currentPage === "home" ? "active" : ""}`} onClick={() => navigate("home")}>Home</button>
          <button className={`mobile-nav-link ${currentPage === "pricing" ? "active" : ""}`} onClick={() => navigate("pricing")}>Pricing</button>
          <button className={`mobile-nav-link ${currentPage === "examples" ? "active" : ""}`} onClick={() => navigate("examples")}>Examples</button>
          <button className={`mobile-nav-link ${currentPage === "contact" ? "active" : ""}`} onClick={() => navigate("contact")}>Contact</button>
          <div className="mobile-menu-divider"></div>
          {user ? (
            <>
              <button className="mobile-nav-link" onClick={() => navigate("dashboard")}>Dashboard</button>
              <button className="mobile-nav-link" onClick={() => navigate("account")}>Hi, {user.name}</button>
              <button className="mobile-nav-link mobile-nav-logout" onClick={() => { supabase.auth.signOut(); setUser(null); navigate("home"); }}>Log Out</button>
            </>
          ) : (
            <>
              <button className="mobile-nav-link" onClick={() => navigate("login")}>Log In</button>
              <button className="mobile-nav-link mobile-nav-accent" onClick={() => navigate("signup")}>Sign Up →</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

// ════════════════════════════════════════════
//  HOME / LANDING PAGE
// ════════════════════════════════════════════
function HomePage({ setPage, user }) {
  /*
   * EDIT: Change the hero section text below.
   * - heroTitle: The big headline
   * - heroSubtitle: The smaller text underneath
   */
  const heroTitle = "Effortless Social Media Automation.";
  const heroSubtitle = "PopFeed delivers AI-powered social media management that saves you time, grows your audience, and keeps your content consistent — all on autopilot.";

  /*
   * EDIT: Change the services below.
   * Each service has:
   *   - icon: an emoji or symbol
   *   - title: service name
   *   - description: what it does
   *   - color: "peach", "purple", or "blue" (accent color)
   */
  const services = [
    {
      icon: "⚡",
      title: "AI Content Generation",
      description: "Automatically generate on-brand posts, captions, and hashtags tailored to each platform. Never stare at a blank screen again.",
      color: "peach",
    },
    {
      icon: "📅",
      title: "Smart Scheduling",
      description: "Our AI analyzes your audience and posts at the perfect time for maximum engagement across all your channels.",
      color: "purple",
    },
    {
      icon: "📊",
      title: "Analytics Dashboard",
      description: "Track performance, audience growth, and engagement trends in one clean dashboard. Know what's working and what's not.",
      color: "blue",
    },
    {
      icon: "🔄",
      title: "Multi-Platform Sync",
      description: "Manage Instagram, TikTok, X, Facebook, and LinkedIn from a single hub. One post, every platform, automatically adapted.",
      color: "peach",
    },
    {
      icon: "🎯",
      title: "Audience Targeting",
      description: "Reach the right people with AI-driven audience insights. We find your ideal followers so you can focus on creating.",
      color: "purple",
    },
    {
      icon: "🤖",
      title: "Workflow Automation",
      description: "From lead capture to follow-up sequences, automate the repetitive tasks that eat up your day.",
      color: "blue",
    },
  ];

  /*
   * EDIT: Change the stats below.
   */
  const stats = [
    { number: "10x", label: "Faster Content Creation" },
    { number: "98%", label: "Client Retention" },
    { number: "24/7", label: "Always-On Posting" },
  ];

  return (
    <div className="page home-page">
      {/* ── Hero Section ── */}
      <section className="hero">
<div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
  <Silk
    speed={5}
    scale={1}
    color="#210059"
    noiseIntensity={1.5}
    rotation={0}
  />
</div>
        <div className="hero-content">
  {/* Glass logo card */}
  <div className="hero-glass-logo">
    <img src="/big-logo.png" alt="PopFeed" className="hero-logo-img" />
  </div>
  <h1 className="hero-title">{heroTitle}</h1>
          <p className="hero-subtitle">{heroSubtitle}</p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => setPage(user ? "account" : "signup")}>Subscribe Now</button>
            <button className="btn-outline" onClick={() => setPage("pricing")}>View Pricing</button>
          </div>
        </div>
      </section>

      {/* ── Scroll Velocity Text ── */}
<section className="scroll-velocity-section">
  <ScrollVelocity
    texts={['Faster Content Creation', 'Stronger Client Retention', 'Always-On Posting']}
    velocity={20}
    className="scroll-velocity-text"
  />
</section>

      {/* ── Services Section ── */}
      <section className="section">
        <h2 className="section-title">What We Do</h2>
        <p className="section-subtitle">Everything you need to dominate social media — powered by AI.</p>
        <div className="services-grid">
          {services.map((service, i) => (
            <div key={i} className={`glass-card service-card accent-${service.color}`} style={{ animationDelay: `${i * 0.1}s` }}>
              <span className="service-icon">{service.icon}</span>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-desc">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="cta-section">
        <div className="glass-card cta-card">
          <h2 className="cta-title">Ready to Put Your Social Media on Autopilot?</h2>
          <p className="cta-text">Join hundreds of brands already saving hours every week with PopFeed.</p>
          <button className="btn-primary btn-large"onClick={() => setPage(user ? "account" : "signup")}>Start Your Journey</button>
        </div>
      </section>
    </div>
  );
}

// ════════════════════════════════════════════
//  PRICING PAGE
// ════════════════════════════════════════════
function PricingPage({ setPage, user }) {
  /*
   * EDIT: Change the pricing plans below.
   * Each plan has:
   *   - name: plan name
   *   - price: monthly price
   *   - period: billing period text
   *   - description: short tagline
   *   - features: array of included features
   *   - color: "peach", "purple", or "blue"
   *   - popular: true/false (highlights the card)
   */
  const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "For beginners to growing brands.",
    features: [
      "3 Social Accounts",
      "50 PopCredits",
      "Smart scheduling",
      "Workflow automation",
      "Multi-platform sync",
      "Audience targeting",
      "Priority support",
    ],
    color: "purple",
    popular: false,
  },
  {
    name: "Unlimited",
    price: "$79",
    period: "/month",
    description: "For users managing multiple client brands.",
    features: [
      "Unlimited social accounts",
      "Unlimited PopCredits",
      "Client reporting",
      "Dedicated account manager",
      "Advanced analytics dashboard",
      "Everything included in Starter",
    ],
    color: "blue",
    popular: true,
  },
];

  return (
    <div className="page pricing-page">
      <section className="section">
        <h1 className="page-title">Simple, Transparent Pricing</h1>
        <p className="section-subtitle">No hidden fees. Cancel anytime.</p>
        <div className="pricing-grid">
          {plans.map((plan, i) => (
            <div key={i} className={`glass-card pricing-card accent-${plan.color} ${plan.popular ? "popular" : ""}`}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price">
                <span className="price-amount">{plan.price}</span>
                <span className="price-period">{plan.period}</span>
              </div>
              <p className="plan-desc">{plan.description}</p>
              <ul className="plan-features">
                {plan.features.map((feature, j) => (
                  <li key={j} className="plan-feature">
                    <span className="feature-check">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
  className={`btn-plan ${plan.popular ? "btn-primary" : "btn-outline"}`}
  onClick={async () => {//c
    if (!user) {
      setPage("signup");
      return;
    }

    // Create checkout session
    const priceId = plan.name.toLowerCase() === 'starter' ? PRICE_IDS.starter : PRICE_IDS.unlimited;
    const response = await fetch('/api/create-checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    priceId,
    userId: user.id,
    userEmail: user.email,
  }),
});

console.log("Response status:", response.status);
const data = await response.json();
if (data.url) window.location.href = data.url;
  }}
>
  Subscribe Now
</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ════════════════════════════════════════════
//  CONTACT PAGE
// ════════════════════════════════════════════
function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // EDIT: Hook this up to your backend, email service, or n8n webhook
    // Example: fetch("https://your-n8n-webhook.com/contact", { method: "POST", body: JSON.stringify(form) })
    console.log("Contact form submitted:", form);
    setSent(true);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="page contact-page">
      <section className="section">
        <h1 className="page-title">Get in Touch</h1>
        <p className="section-subtitle">Have a question? Want a custom plan? We'd love to hear from you.</p>
        <div className="contact-container">
          <div className="glass-card contact-card">
            {sent ? (
              <div className="success-message">
                <span className="success-icon">✓</span>
                <h3>Message Sent!</h3>
                <p>We'll get back to you within 48 hours.</p>
                <button className="btn-outline" onClick={() => setSent(false)}>Send Another</button>
              </div>
            ) : (
              <>
                <div className="input-group">
                  <label className="input-label">Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Message</label>
                  <textarea
                    className="input-field textarea"
                    placeholder="Tell us what you need..."
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                  />
                </div>
                <button className="btn-primary btn-full" onClick={handleSubmit}>Send Message</button>
              </>
            )}
          </div>
          <div className="contact-info">
            {/* EDIT: Update your contact details */}
            <div className="glass-card info-card">
              <h3>Email Us</h3>
              <p>popfeedworkflows@gmail.com</p>
            </div>
            <div className="glass-card info-card">
              <h3>Follow Us</h3>
              <p>@popfeedmarketing</p>
            </div>
            <div className="glass-card info-card">
              <h3>Office Hours</h3>
              <p>Mon–Fri, 9am–5pm EST</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ════════════════════════════════════════════
//  LOGIN PAGE
// ════════════════════════════════════════════
function LoginPage({ setPage, setUser }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
  e.preventDefault();
  if (!form.email || !form.password) {
    setError("Please fill in all fields.");
    return;
  }

  const { data, error: loginError } = await supabase.auth.signInWithPassword({
    email: form.email,
    password: form.password,
  });

  if (loginError) {
    setError(loginError.message);
    return;
  }

  // Fetch their profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  setUser({
    name: profile?.name || form.email.split("@")[0],
    email: form.email,
    id: data.user.id,
    subscription: profile?.subscription || 'free',
  });
  setPage("home");
};

  return (
    <div className="page auth-page">
  <div className="auth-bg">
  <MagnetLines
    rows={7}
    columns={11}
    containerSize="100%"
    lineColor="#b50981"
    lineWidth="2px"
    lineHeight="30px"
    baseAngle={0}
  />
</div>
  <div className="glass-card auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Log in to your PopFeed account</p>
        {error && <div className="auth-error">{error}</div>}
        <div className="input-group">
          <label className="input-label">Email</label>
          <input
            type="email"
            className="input-field"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Password</label>
          <input
            type="password"
            className="input-field"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button className="btn-primary btn-full" onClick={handleLogin}>Log In</button>
        <p className="auth-switch">
          Don't have an account?{" "}
          <button className="link-btn" onClick={() => setPage("signup")}>Sign up</button>
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
//  SIGN UP PAGE
// ════════════════════════════════════════════
function SignupPage({ setPage, setUser }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
  e.preventDefault();
  if (!form.name || !form.email || !form.password) {
    setError("Please fill in all fields.");
    return;
  }
  if (form.password !== form.confirm) {
    setError("Passwords don't match.");
    return;
  }
  if (form.password.length < 6) {
    setError("Password must be at least 6 characters.");
    return;
  }

  const { data, error: signUpError } = await supabase.auth.signUp({
    email: form.email,
    password: form.password,
    options: {
      data: { name: form.name }
    }
  });

  if (signUpError) {
    setError(signUpError.message);
    return;
  }

  setUser({ name: form.name, email: form.email, id: data.user.id });
  setPage("home");
};

  return (
    <div className="page auth-page">
  <div className="auth-bg">
  <MagnetLines
    rows={7}
    columns={11}
    containerSize="100%"
    lineColor="#b50981"
    lineWidth="2px"
    lineHeight="30px"
    baseAngle={0}
  />
</div>
  <div className="glass-card auth-card">
        <h2 className="auth-title">Create Your Account</h2>
        <p className="auth-subtitle">Start your journey</p>
        {error && <div className="auth-error">{error}</div>}
        <div className="input-group">
          <label className="input-label">Full Name</label>
          <input
            type="text"
            className="input-field"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Email</label>
          <input
            type="email"
            className="input-field"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Password</label>
          <input
            type="password"
            className="input-field"
            placeholder="At least 6 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Confirm Password</label>
          <input
            type="password"
            className="input-field"
            placeholder="Type it again"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          />
        </div>
        <button className="btn-primary btn-full" onClick={handleSignup}>Create Account</button>
        <p className="auth-switch">
          Already have an account?{" "}
          <button className="link-btn" onClick={() => setPage("login")}>Log in</button>
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
//  EXAMPLES PAGE
// ════════════════════════════════════════════
function ExamplesPage({ setPage }) {
  /*
   * EDIT: Add, remove, or change examples here.
   * Each example has:
   *   - platform: "instagram", "facebook", "tiktok", or "linkedin"
   *   - image: URL to the post image (use /example1.jpg etc from your public folder)
   *   - caption: the auto-generated caption text
   *   - agent: the realtor's name
   *   - result: a short stat or outcome
   *   - color: "peach", "purple", or "blue"
   */
  const examples = [
    {
      platform: "Instagram",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=600&fit=crop",
      caption: "✨ Just Listed in Westlake! This stunning 4-bed, 3-bath home features an open floor plan, chef's kitchen with quartz countertops, and a backyard oasis with a heated pool. Schedule your private showing today! 🏡\n\n#JustListed #DreamHome #RealEstate #WestlakeLiving #LuxuryHomes #OpenHouse",
      agent: "Sarah Mitchell — Keller Williams",
      result: "342 likes · 28 saves · 12 DMs in 24hrs",
      color: "peach",
    },
    {
      platform: "Facebook",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=600&fit=crop",
      caption: "🏠 PRICE REDUCED — $450,000!\n\nThis beautifully renovated 3-bedroom ranch in Maple Ridge is now $25K below market value. New roof, updated HVAC, and a fully finished basement perfect for entertaining.\n\nDon't miss this one — homes in this neighborhood sell in under 7 days. Link in comments for the full virtual tour! 👇",
      agent: "Marcus Johnson — RE/MAX Elite",
      result: "89 shares · 2,400 reach · 6 buyer inquiries",
      color: "purple",
    },
    {
      platform: "Instagram",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=600&fit=crop",
      caption: "Modern living meets timeless design 🖤\n\nThis brand new construction in The Heights offers 2,800 sq ft of pure sophistication — floor-to-ceiling windows, waterfall island, smart home integration throughout.\n\nTap the link in bio to book a walkthrough before it's gone.\n\n#NewConstruction #ModernHome #TheHeights #RealEstateAgent #HomeBuyers",
      agent: "Jessica Park — Compass",
      result: "518 likes · 45 saves · 3 offers in 48hrs",
      color: "blue",
    },
    {
      platform: "TikTok",
      image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=600&fit=crop",
      caption: "POV: You just listed a $1.2M lakefront property and PopFeed made the content for you in 30 seconds 🎬\n\nThis 5-bed beauty on Lake Austin has a private dock, infinity pool, and views that don't quit. Auto-posted to all platforms at peak engagement time.\n\n#RealTok #LuxuryRealEstate #RealtorLife #LakefrontLiving",
      agent: "David Chen — Sotheby's International",
      result: "12.4K views · 890 likes · 34 inquiries",
      color: "peach",
    },
    {
      platform: "LinkedIn",
      image: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=600&h=600&fit=crop",
      caption: "My team closed 14 deals last quarter — and I didn't write a single social media post manually.\n\nHere's the truth: most agents spend 5+ hours/week on content creation. We spend zero. PopFeed handles our listings, market updates, and engagement posts automatically.\n\nThis duplex in Riverside? Listed Monday, posted across 4 platforms by Tuesday morning, under contract by Friday.\n\nThe future of real estate marketing is automation.",
      agent: "Rachel Torres — eXp Realty",
      result: "1,200 impressions · 47 reactions · 8 connection requests",
      color: "purple",
    },
    {
      platform: "Instagram",
      image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&h=600&fit=crop",
      caption: "SOLD 🔑 in just 5 days!\n\nOur sellers couldn't be happier. This charming colonial in Oak Park was auto-listed across Instagram, Facebook, and Zillow simultaneously. 47 showing requests in the first weekend.\n\nThinking about selling? Let's talk about what PopFeed + the right pricing strategy can do for your home.\n\n#SoldByPopFeed #RealEstateSuccess #OakPark #SellerMarket #JustSold",
      agent: "Kevin O'Brien — Coldwell Banker",
      result: "623 likes · 52 saves · SOLD over asking",
      color: "blue",
    },
  ];

  const platformIcons = {
    Instagram: "📸",
    Facebook: "📘",
    TikTok: "🎵",
    LinkedIn: "💼",
  };

  return (
    <div className="page examples-page">
      {/* ── Hero ── */}
      <section className="examples-hero">
        <h1 className="page-title">See PopFeed in Action</h1>
        <p className="section-subtitle">
          Real listings. Real captions. Real results. Every post below was auto-generated 
          by PopFeed — zero manual effort from the agent.
        </p>
      </section>

      {/* ── Examples Feed ── */}
      <section className="examples-feed">
        {examples.map((ex, i) => (
          <div key={i} className={`example-card accent-${ex.color}`}>
            <div className="example-image-wrap">
              <img src={ex.image} alt={`Example ${i + 1}`} className="example-image" />
              <div className="example-platform-badge">
                <span>{platformIcons[ex.platform]}</span>
                <span>{ex.platform}</span>
              </div>
            </div>
            <div className="example-content">
              <div className="example-agent">{ex.agent}</div>
              <p className="example-caption">{ex.caption}</p>
              <div className="example-result">
                <span className="result-icon">📈</span>
                <span className="result-text">{ex.result}</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Bottom CTA ── */}
      <section className="cta-section">
        <div className="glass-card cta-card">
          <h2 className="cta-title">Want Results Like These?</h2>
          <p className="cta-text">Subscribe Now and let PopFeed create scroll-stopping content for your listings — automatically.</p>
          <div className="hero-buttons">
            <button className="btn-primary btn-large" onClick={() => setPage(user ? "account" : "signup")}>Subscribe Now</button>
            <button className="btn-outline btn-large" onClick={() => setPage("pricing")}>See Pricing</button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ════════════════════════════════════════════
//  ACCOUNT PAGE
// ════════════════════════════════════════════
function AccountPage({ user, setPage }) {
  const subscriptionDetails = {
  free:      { label: "No Plan",     color: "#888",    features: ["No active subscription", "Choose a plan to get started"] },
  starter:   { label: "Starter",     color: "#b388ff", features: ["3 Social Accounts", "50 PopCredits", "Smart scheduling", "Workflow automation", "Multi-platform sync", "Audience targeting", "Priority support"] },
  unlimited: { label: "Unlimited",   color: "#7ec8e3", features: ["Unlimited social accounts", "Unlimited PopCredits", "Client reporting", "Dedicated account manager", "Advanced analytics dashboard", "Everything included in Starter"] },
};

  const plan = subscriptionDetails[user?.subscription] || subscriptionDetails.free;

  return (
    <div className="page auth-page">
      <div className="glass-card account-card">
        <div className="account-avatar">
          {user?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <h2 className="auth-title">{user?.name}</h2>
        <p className="auth-subtitle">{user?.email}</p>

        <div className="account-plan" style={{ borderColor: plan.color }}>
          <div className="plan-badge" style={{ background: plan.color, color: '#0a0a0a' }}>
            {plan.label}
          </div>
          <ul className="account-features">
            {plan.features.map((f, i) => (
              <li key={i} className="account-feature">
                <span style={{ color: plan.color }}>✓</span> {f}
              </li>
            ))}
          </ul>
          {(!user?.subscription || user?.subscription === 'free') && (
            <button className="btn-primary btn-full" style={{ marginTop: '1rem' }} onClick={() => setPage("pricing")}>
  	Choose a Plan
		</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
//  FOOTER
// ════════════════════════════════════════════
function Footer({ setPage }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="nav-logo" onClick={() => setPage("home")}>
  <img src="/logo.png" alt="PopFeed" style={{ height: '90px' }} />
</div>
          <p className="footer-tagline">AI-powered social media on autopilot.</p>
        </div>
        <div className="footer-links">
          <button className="footer-link" onClick={() => setPage("home")}>Home</button>
          <button className="footer-link" onClick={() => setPage("pricing")}>Pricing</button>
	  <button className="footer-link" onClick={() => setPage("examples")}>Examples</button>
          <button className="footer-link" onClick={() => setPage("contact")}>Contact</button>
        </div>
        <div className="footer-copy">
          {/* EDIT: Update the year and company name */}
          © 2025 PopFeed Marketing. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// ════════════════════════════════════════════
//  MAIN APP (Puts it all together)
// ════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);

 useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .then(({ data: profile }) => {
          setUser({
            name: profile?.name || session.user.email.split("@")[0],
            email: session.user.email,
            id: session.user.id,
            subscription: profile?.subscription || 'free',
          });
        });
    }
  });
}, []);

  // Scroll to top when changing pages
  const changePage = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (page) {
      case "home":    return <HomePage setPage={changePage} user={user} />;
      case "pricing": return <PricingPage setPage={changePage} user={user} />;
      case "examples": return <ExamplesPage setPage={changePage} />;
      case "contact": return <ContactPage />;
      case "account": return <AccountPage user={user} setPage={changePage} />;
      case "login":   return <LoginPage setPage={changePage} setUser={setUser} />;
      case "signup":  return <SignupPage setPage={changePage} setUser={setUser} />;
      case "dashboard": return <Dashboard user={user} setPage={changePage} />;
      default:        return <HomePage setPage={changePage} />;
    }
  };

  return (
    <div className="app">
      <Navbar currentPage={page} setPage={changePage} user={user} setUser={setUser} />
      <main className="main-content">
        {renderPage()}
      </main>
      <Footer setPage={changePage} />
    </div>
  );
}
