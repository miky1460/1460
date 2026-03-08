import { useState, useEffect, useRef } from "react";

const KANDZ = () => {
  const [scrollY, setScrollY] = useState(0);
  const [activeService, setActiveService] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const statsRef = useRef(null);
  const [countAnimated, setCountAnimated] = useState(false);
  const [counts, setCounts] = useState({ employees: 0, contracts: 0, hours: 0, reviews: 0 });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !countAnimated) {
          setCountAnimated(true);
          const targets = { employees: 50, contracts: 200, hours: 17500, reviews: 100 };
          const duration = 2000;
          const steps = 60;
          const interval = duration / steps;
          let step = 0;
          const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const ease = 1 - Math.pow(1 - progress, 3);
            setCounts({
              employees: Math.round(targets.employees * ease),
              contracts: Math.round(targets.contracts * ease),
              hours: Math.round(targets.hours * ease),
              reviews: Math.round(targets.reviews * ease),
            });
            if (step >= steps) clearInterval(timer);
          }, interval);
        }
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [countAnimated]);

  const services = [
    { icon: "🎯", title: "Lead Generation & Sales", desc: "End-to-end lead gen, appointment setting, cold calling, and sales closing for B2B & B2C. We don't just find leads — we convert them.", color: "#FF6B35" },
    { icon: "📞", title: "Call & Contact Center", desc: "24/7 inbound & outbound support. Phone, email, chat — your customers get instant, professional assistance round the clock.", color: "#4ECDC4" },
    { icon: "📈", title: "SEO & Digital Marketing", desc: "Dominate search rankings with data-driven SEO, content marketing, and strategic link building using Semrush & Ahrefs.", color: "#7B68EE" },
    { icon: "🎨", title: "Creative & Design", desc: "Brand identity, graphic design, video editing, and motion graphics that make your brand unforgettable.", color: "#FF1493" },
    { icon: "💻", title: "Google & Meta Ads", desc: "ROI-focused paid campaigns on Google, Facebook & Instagram. Every dollar tracked, every conversion optimized.", color: "#00CED1" },
    { icon: "⚡", title: "Admin & Virtual Assistance", desc: "Executive VAs, data entry, CRM management, calendar handling — we become your remote operations team.", color: "#FFD700" },
  ];

  const testimonials = [
    { text: "The expert team KANDZ assembled delivered truly exceptional results in support of our critical lead generation efforts.", client: "Structural & MEP Design Firm", role: "Lead Generation Operations" },
    { text: "The team showed thorough understanding of SEO best practices and Google AdWords at the expert level.", client: "GDI Engineering", role: "Google Ads & SEO" },
    { text: "They assembled a team that provided outstanding customer service. The level of experience was simply remarkable.", client: "Enterprise Client", role: "Customer Support" },
  ];

  const sectionClass = (id) =>
    `transition-all duration-1000 ${visibleSections.has(id) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0A0A0F", color: "#E8E6E1", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Syne:wght@400..800&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .hero-gradient {
          background: radial-gradient(ellipse 80% 60% at 50% -20%, rgba(120, 80, 255, 0.15), transparent),
                      radial-gradient(ellipse 60% 40% at 80% 50%, rgba(255, 107, 53, 0.08), transparent),
                      radial-gradient(ellipse 60% 40% at 20% 80%, rgba(78, 205, 196, 0.06), transparent);
        }

        .grain-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 999;
        }

        .nav-blur {
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          background: rgba(10, 10, 15, 0.8);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .text-gradient {
          background: linear-gradient(135deg, #FF6B35, #FF1493, #7B68EE);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glow-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
          position: relative; overflow: hidden;
        }
        .glow-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.06), transparent 60%);
          opacity: 0; transition: opacity 0.5s;
        }
        .glow-card:hover::before { opacity: 1; }
        .glow-card:hover {
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .stat-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 32px; text-align: center;
        }

        .cta-button {
          background: linear-gradient(135deg, #FF6B35, #FF1493);
          color: white; border: none; padding: 16px 40px;
          border-radius: 60px; font-size: 16px; font-weight: 600;
          cursor: pointer; transition: all 0.4s;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.5px;
          position: relative; overflow: hidden;
        }
        .cta-button::after {
          content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.6s;
        }
        .cta-button:hover::after { left: 100%; }
        .cta-button:hover { transform: translateY(-2px); box-shadow: 0 10px 40px rgba(255,107,53,0.3); }

        .cta-outline {
          background: transparent; color: #E8E6E1;
          border: 1px solid rgba(255,255,255,0.2);
          padding: 16px 40px; border-radius: 60px;
          font-size: 16px; font-weight: 500; cursor: pointer;
          transition: all 0.4s; font-family: 'DM Sans', sans-serif;
        }
        .cta-outline:hover {
          border-color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.05);
        }

        .service-active {
          background: rgba(255,255,255,0.06) !important;
          border-color: rgba(255,255,255,0.15) !important;
        }

        .upwork-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, rgba(20, 163, 0, 0.15), rgba(20, 163, 0, 0.05));
          border: 1px solid rgba(20, 163, 0, 0.3);
          padding: 8px 20px; border-radius: 50px;
          font-size: 13px; font-weight: 600; color: #14A300;
          letter-spacing: 1px; text-transform: uppercase;
        }

        .testimonial-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px; padding: 40px;
          position: relative;
        }
        .testimonial-card::before {
          content: '"'; position: absolute; top: 16px; left: 24px;
          font-size: 80px; color: rgba(255,107,53,0.15);
          font-family: 'Playfair Display', serif; line-height: 1;
        }

        .section-label {
          font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
          color: #FF6B35; font-weight: 600; margin-bottom: 16px;
          display: inline-block;
        }

        .marquee-track {
          display: flex; gap: 60px; animation: marquee 25s linear infinite;
          white-space: nowrap;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .footer-link {
          color: rgba(232,230,225,0.5); text-decoration: none;
          transition: color 0.3s; font-size: 14px;
        }
        .footer-link:hover { color: #FF6B35; }

        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        .float-animation { animation: float 6s ease-in-out infinite; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fadeInUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.25s; opacity: 0; }
        .delay-3 { animation-delay: 0.4s; opacity: 0; }
        .delay-4 { animation-delay: 0.55s; opacity: 0; }

        .nav-link {
          color: rgba(232,230,225,0.7); text-decoration: none;
          font-size: 14px; font-weight: 500; transition: color 0.3s;
          letter-spacing: 0.5px;
        }
        .nav-link:hover { color: #FF6B35; }

        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .mobile-full { width: 100% !important; }
          .mobile-col { flex-direction: column !important; }
          .mobile-text-center { text-align: center !important; }
          .mobile-padding { padding: 0 20px !important; }
        }
      `}</style>

      <div className="grain-overlay" />

      {/* Navigation */}
      <nav className="nav-blur" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "16px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #FF6B35, #FF1493)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, fontFamily: "'Syne', sans-serif" }}>K</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: 1 }}>KANDZ</span>
        </div>
        <div className="hide-mobile" style={{ display: "flex", gap: 36, alignItems: "center" }}>
          <a href="#" className="nav-link">Home</a>
          <a href="#services" className="nav-link">Services</a>
          <a href="#results" className="nav-link">Results</a>
          <a href="#testimonials" className="nav-link">Testimonials</a>
          <a href="#about" className="nav-link">About</a>
          <a href="calendly.html" className="cta-button" style={{ padding: "10px 28px", fontSize: 14, textDecoration: "none" }}>Book a Call</a>
        </div>
        <button className="hide-mobile" style={{ display: "none", background: "none", border: "none", color: "#E8E6E1", fontSize: 24, cursor: "pointer" }} onClick={() => setIsMenuOpen(!isMenuOpen)}>☰</button>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "140px 24px 80px", position: "relative" }}>

        {/* Floating orbs */}
        <div className="float-animation" style={{ position: "absolute", top: "15%", left: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.08), transparent 70%)", filter: "blur(40px)" }} />
        <div className="float-animation" style={{ position: "absolute", bottom: "20%", right: "10%", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,104,238,0.08), transparent 70%)", filter: "blur(40px)", animationDelay: "-3s" }} />

        <div className="animate-in delay-1">
          <div className="upwork-badge" style={{ marginBottom: 32 }}>
            <span>●</span> Top Rated Plus on Upwork
          </div>
        </div>

        <h1 className="animate-in delay-2" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(40px, 7vw, 82px)", fontWeight: 700, lineHeight: 1.05, maxWidth: 900, marginBottom: 24 }}>
          We Execute<br />
          <span className="text-gradient">Your Growth</span>
        </h1>

        <p className="animate-in delay-3" style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "rgba(232,230,225,0.6)", maxWidth: 580, lineHeight: 1.7, marginBottom: 48 }}>
          From lead generation to sales execution, marketing to operations — we're the team that scales your business while you focus on strategy.
        </p>

        <div className="animate-in delay-4" style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <a href="calendly.html" className="cta-button" style={{ textDecoration: "none" }}>Book a Free Consultation →</a>
          <button className="cta-outline">View Our Work</button>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: 0.4 }}>
          <span style={{ fontSize: 12, letterSpacing: 2 }}>SCROLL</span>
          <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)" }} />
        </div>
      </section>

      {/* Marquee */}
      <div style={{ overflow: "hidden", padding: "24px 0", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="marquee-track">
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 60, alignItems: "center" }}>
              {["Lead Generation", "Sales Execution", "Call Center", "SEO & Marketing", "Google & Meta Ads", "Admin Support", "Creative Design", "CRM Management", "Virtual Assistance"].map((item, j) => (
                <span key={j} style={{ fontSize: 14, color: "rgba(232,230,225,0.3)", fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  {item} <span style={{ color: "#FF6B35", margin: "0 20px" }}>✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <section ref={statsRef} id="results" data-animate style={{ padding: "100px 48px" }}>
        <div className={sectionClass("results")} style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <span className="section-label">Our Track Record</span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 600 }}>
              Numbers That <span className="text-gradient">Speak</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
            {[
              { num: `${counts.employees}+`, label: "Team Members", sub: "Skilled professionals" },
              { num: `${counts.contracts}+`, label: "Total Contracts", sub: "Successfully delivered" },
              { num: `${counts.hours.toLocaleString()}+`, label: "Hours on Upwork", sub: "Of dedicated work" },
              { num: `${counts.reviews}%`, label: "Client Satisfaction", sub: "5-star reviews" },
            ].map((stat, i) => (
              <div key={i} className="stat-card">
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 42, fontWeight: 800, marginBottom: 8 }} className="text-gradient">{stat.num}</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: 13, color: "rgba(232,230,225,0.4)" }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" data-animate style={{ padding: "80px 48px 100px" }}>
        <div className={sectionClass("services")} style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <span className="section-label">What We Do</span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 600 }}>
              Full-Stack <span className="text-gradient">Growth Services</span>
            </h2>
            <p style={{ color: "rgba(232,230,225,0.5)", marginTop: 16, maxWidth: 500, margin: "16px auto 0", lineHeight: 1.7 }}>
              Everything you need to scale — under one roof, one team, one partner.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {services.map((service, i) => (
              <div
                key={i}
                className={`glow-card ${activeService === i ? "service-active" : ""}`}
                style={{ padding: 36, cursor: "pointer" }}
                onClick={() => setActiveService(i)}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty("--mouse-x", `${((e.clientX - rect.left) / rect.width) * 100}%`);
                  e.currentTarget.style.setProperty("--mouse-y", `${((e.clientY - rect.top) / rect.height) * 100}%`);
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 16 }}>{service.icon}</div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 12, color: service.color }}>{service.title}</h3>
                <p style={{ color: "rgba(232,230,225,0.5)", fontSize: 14, lineHeight: 1.7 }}>{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" data-animate style={{ padding: "80px 48px 100px" }}>
        <div className={sectionClass("testimonials")} style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <span className="section-label">Client Love</span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 600 }}>
              Don't Take Our Word. <span className="text-gradient">Take Theirs.</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(232,230,225,0.7)", marginBottom: 24, position: "relative", zIndex: 1 }}>
                  "{t.text}"
                </p>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{t.client}</div>
                  <div style={{ fontSize: 13, color: "#FF6B35" }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" data-animate style={{ padding: "80px 48px 100px" }}>
        <div className={sectionClass("about")} style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 60, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 400px" }}>
            <span className="section-label">About KANDZ</span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 600, marginBottom: 24 }}>
              Your Growth Team,<br /><span className="text-gradient">Based in Pakistan,</span><br />Serving the World
            </h2>
            <p style={{ color: "rgba(232,230,225,0.5)", lineHeight: 1.8, marginBottom: 20, fontSize: 15 }}>
              Founded in 2019, KANDZ Communications has grown from a small call center to a full-service growth execution agency. With 50+ skilled professionals, we've completed 200+ contracts on Upwork with a Top Rated Plus badge.
            </p>
            <p style={{ color: "rgba(232,230,225,0.5)", lineHeight: 1.8, marginBottom: 32, fontSize: 15 }}>
              90% of our team are university graduates. Many have lived in the USA and Europe, giving us deep cultural understanding for targeting specific markets globally.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {["Upwork Top Rated Plus", "50+ Team Members", "Since 2019", "Global Clients"].map((badge, i) => (
                <span key={i} style={{ padding: "8px 18px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.1)", fontSize: 13, color: "rgba(232,230,225,0.6)" }}>{badge}</span>
              ))}
            </div>
          </div>
          <div style={{ flex: "1 1 300px", minHeight: 400, borderRadius: 24, background: "linear-gradient(135deg, rgba(255,107,53,0.1), rgba(123,104,238,0.1))", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg, #FF6B35, #FF1493)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontFamily: "'Syne', sans-serif", fontWeight: 800 }}>K</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700 }}>KANDZ</div>
            <div style={{ fontSize: 13, letterSpacing: 3, color: "rgba(232,230,225,0.4)", textTransform: "uppercase" }}>Communications</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: "100px 48px", textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.1), transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, marginBottom: 20 }}>
            Ready to <span className="text-gradient">Scale?</span>
          </h2>
          <p style={{ color: "rgba(232,230,225,0.5)", marginBottom: 40, fontSize: 18, maxWidth: 500, margin: "0 auto 40px" }}>
            Book a free consultation. Let's discuss how we can become your growth execution team.
          </p>
          <button className="cta-button" style={{ fontSize: 18, padding: "20px 52px" }}>
            Book Your Free Call →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "60px 48px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 40, marginBottom: 40 }}>
            <div style={{ flex: "1 1 250px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #FF6B35, #FF1493)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, fontFamily: "'Syne', sans-serif" }}>K</div>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18 }}>KANDZ Communications</span>
              </div>
              <p style={{ fontSize: 14, color: "rgba(232,230,225,0.4)", lineHeight: 1.7 }}>Your growth execution partner. Based in Pakistan, serving clients worldwide.</p>
            </div>
            <div style={{ flex: "0 1 auto" }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>Quick Links</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {["Services", "Case Studies", "About", "Contact"].map((link, i) => (
                  <a key={i} href="#" className="footer-link">{link}</a>
                ))}
              </div>
            </div>
            <div style={{ flex: "0 1 auto" }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>Contact</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span className="footer-link">Syed@kandz.io</span>
                <a href="https://www.upwork.com/agencies/kandzio/" className="footer-link" target="_blank" rel="noopener">Upwork Profile →</a>
                <a href="calendly.html" className="footer-link">Book a Call →</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <span style={{ fontSize: 13, color: "rgba(232,230,225,0.3)" }}>© 2024 KANDZ Communications. All rights reserved.</span>
            <div className="upwork-badge" style={{ fontSize: 11 }}>
              <span>●</span> Top Rated Plus
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default KANDZ;
