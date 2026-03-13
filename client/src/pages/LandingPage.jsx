import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  Code2,
  Users,
  Zap,
  Brain,
  Terminal,
  GitBranch,
  ChevronRight,
  Globe,
  Lock,
  Cpu,
} from "lucide-react";

// ── Animated counter hook ────────────────────────────────
const useCounter = (end, duration = 2000, inView) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, end, duration]);
  return count;
};

// ── Fade in on scroll ────────────────────────────────────
const FadeInSection = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ── Stat card ────────────────────────────────────────────
const StatCard = ({ end, suffix, label, inView }) => {
  const count = useCounter(end, 2000, inView);
  return (
    <div style={styles.statCard}>
      <span style={styles.statNumber}>
        {count}
        {suffix}
      </span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
};

// ── Feature card ─────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, desc, accent, delay }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        ...styles.featureCard,
        "--accent": accent,
      }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
    >
      <div
        style={{
          ...styles.featureIcon,
          background: `${accent}18`,
          border: `1px solid ${accent}30`,
        }}
      >
        <Icon size={22} color={accent} />
      </div>
      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureDesc}>{desc}</p>
    </motion.div>
  );
};

// ── Code preview block ───────────────────────────────────
const CodePreview = () => {
  const lines = [
    {
      tokens: [
        { t: "// ", c: "#484f58" },
        { t: "Real-time collaboration", c: "#484f58" },
      ],
    },
    {
      tokens: [
        { t: "const ", c: "#ff7b72" },
        { t: "room", c: "#79c0ff" },
        { t: " = ", c: "#e6edf3" },
        { t: "await ", c: "#ff7b72" },
        { t: "CodeCollab", c: "#ffa657" },
        { t: ".", c: "#e6edf3" },
        { t: "createRoom", c: "#d2a8ff" },
        { t: "({", c: "#e6edf3" },
      ],
    },
    {
      tokens: [
        { t: "  name", c: "#79c0ff" },
        { t: ": ", c: "#e6edf3" },
        { t: '"My Project"', c: "#a5d6ff" },
        { t: ",", c: "#e6edf3" },
      ],
    },
    {
      tokens: [
        { t: "  language", c: "#79c0ff" },
        { t: ": ", c: "#e6edf3" },
        { t: '"javascript"', c: "#a5d6ff" },
      ],
    },
    { tokens: [{ t: "})", c: "#e6edf3" }] },
    { tokens: [] },
    {
      tokens: [
        { t: "// ", c: "#484f58" },
        { t: "AI-powered review", c: "#484f58" },
      ],
    },
    {
      tokens: [
        { t: "const ", c: "#ff7b72" },
        { t: "review", c: "#79c0ff" },
        { t: " = ", c: "#e6edf3" },
        { t: "await ", c: "#ff7b72" },
        { t: "AI", c: "#ffa657" },
        { t: ".", c: "#e6edf3" },
        { t: "reviewCode", c: "#d2a8ff" },
        { t: "(code)", c: "#e6edf3" },
      ],
    },
    {
      tokens: [
        { t: "console", c: "#ffa657" },
        { t: ".", c: "#e6edf3" },
        { t: "log", c: "#d2a8ff" },
        { t: "(review.issues)", c: "#e6edf3" },
      ],
    },
  ];

  return (
    <div style={styles.codePreview}>
      {/* Window chrome */}
      <div style={styles.codeHeader}>
        <div style={styles.dots}>
          <span style={{ ...styles.dot, background: "#ff5f57" }} />
          <span style={{ ...styles.dot, background: "#febc2e" }} />
          <span style={{ ...styles.dot, background: "#28c840" }} />
        </div>
        <span style={styles.codeFileName}>
          <Code2 size={12} style={{ marginRight: 6 }} />
          main.js — CodeCollab
        </span>
      </div>
      {/* Code lines */}
      <div style={styles.codeBody}>
        {lines.map((line, i) => (
          <motion.div
            key={i}
            style={styles.codeLine}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.08, duration: 0.3 }}
          >
            <span style={styles.lineNum}>{i + 1}</span>
            <span>
              {line.tokens.map((token, j) => (
                <span key={j} style={{ color: token.c }}>
                  {token.t}
                </span>
              ))}
            </span>
          </motion.div>
        ))}
        {/* Blinking cursor */}
        <motion.div
          style={styles.codeLine}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          <span style={styles.lineNum}>10</span>
          <motion.span
            style={styles.cursor}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            ▋
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
};

// ── Main Landing Page ────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true });

  return (
    <div style={styles.page}>
      {/* ── Nav ─────────────────────────────────────── */}
      <motion.nav
        style={styles.nav}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={styles.navInner}>
          <div style={styles.logo}>
            <Code2 size={20} color="var(--accent-cyan)" />
            <span style={styles.logoText}>CodeCollab</span>
          </div>
          <div style={styles.navLinks}>
            <a href="#features" style={styles.navLink}>
              Features
            </a>
            <a href="#how" style={styles.navLink}>
              How it works
            </a>
          </div>
          <div style={styles.navActions}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/login")}
              style={{ padding: "8px 18px", fontSize: "13px" }}
            >
              Sign in
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/register")}
              style={{ padding: "8px 18px", fontSize: "13px" }}
            >
              Get Started
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ─────────────────────────────────────── */}
      <motion.section
        style={{ ...styles.hero, y: heroY, opacity: heroOpacity }}
        className="grid-bg"
      >
        {/* Ambient blobs */}
        <div style={styles.blob1} />
        <div style={styles.blob2} />

        <div style={styles.heroInner}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span
              className="badge badge-cyan animate-float"
              style={{ marginBottom: 24, display: "inline-flex" }}
            >
              <Zap size={10} />
              AI-Powered Collaboration
            </span>
          </motion.div>

          <motion.h1
            style={styles.heroTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            Code Together,
            <br />
            <span style={styles.heroAccent}>Ship Faster.</span>
          </motion.h1>

          <motion.p
            style={styles.heroSub}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            A real-time collaborative editor with AI code review,
            <br />
            auto-fix, and instant execution. Built for teams.
          </motion.p>

          <motion.div
            style={styles.heroCtas}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <button
              className="btn btn-primary"
              onClick={() => navigate("/register")}
              style={{ padding: "13px 28px", fontSize: "15px" }}
            >
              Start Collaborating
              <ChevronRight size={16} />
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/login")}
              style={{ padding: "13px 28px", fontSize: "15px" }}
            >
              Sign In
            </button>
          </motion.div>

          {/* Tech badges */}
          <motion.div
            style={styles.techBadges}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {["React", "Node.js", "Yjs CRDTs", "Groq AI", "MySQL"].map((t) => (
              <span key={t} style={styles.techBadge}>
                {t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Code Preview */}
        <motion.div
          style={styles.heroCode}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <CodePreview />
          {/* Floating user avatars */}
          <motion.div
            style={styles.floatingUser1}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div style={{ ...styles.avatar, background: "#ff6b6b" }}>A</div>
            <span style={styles.avatarLabel}>Alex is typing…</span>
          </motion.div>
          <motion.div
            style={styles.floatingUser2}
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div style={{ ...styles.avatar, background: "#00d4ff" }}>S</div>
            <span style={styles.avatarLabel}>Sam reviewing</span>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ── Stats ────────────────────────────────────── */}
      <section ref={statsRef} style={styles.stats}>
        <div style={styles.statsInner}>
          <StatCard
            end={50}
            suffix="+"
            label="Languages Supported"
            inView={statsInView}
          />
          <div style={styles.statDivider} />
          <StatCard
            end={0}
            suffix="ms"
            label="Avg Sync Latency"
            inView={statsInView}
          />
          <div style={styles.statDivider} />
          <StatCard
            end={4}
            suffix=""
            label="AI Features Built-in"
            inView={statsInView}
          />
          <div style={styles.statDivider} />
          <StatCard
            end={100}
            suffix="%"
            label="Free to Use"
            inView={statsInView}
          />
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section id="features" style={styles.section}>
        <FadeInSection>
          <div style={styles.sectionHeader}>
            <span className="badge badge-green" style={{ marginBottom: 16 }}>
              Features
            </span>
            <h2 style={styles.sectionTitle}>
              Everything you need to
              <br />
              collaborate on code
            </h2>
            <p style={styles.sectionSub}>
              From real-time editing to AI-powered reviews — all in one
              platform.
            </p>
          </div>
        </FadeInSection>

        <div style={styles.featuresGrid}>
          <FeatureCard
            delay={0.0}
            accent="var(--accent-cyan)"
            icon={Users}
            title="Real-time Collaboration"
            desc="Multiple cursors, instant sync via Yjs CRDTs. No conflicts, no lag. Edit together like you're in the same room."
          />
          <FeatureCard
            delay={0.1}
            accent="var(--accent-green)"
            icon={Brain}
            title="AI Code Review"
            desc="Get instant feedback on bugs, security issues, and improvements. Powered by Llama 3.3 via Groq."
          />
          <FeatureCard
            delay={0.2}
            accent="var(--accent-purple)"
            icon={Terminal}
            title="Live Code Execution"
            desc="Run your code directly in the browser. Output is shared with everyone in the room instantly."
          />
          <FeatureCard
            delay={0.3}
            accent="#ffa657"
            icon={Zap}
            title="AI Auto-fix"
            desc="Hit a runtime error? AI detects it and patches your code automatically with a before/after preview."
          />
          <FeatureCard
            delay={0.4}
            accent="#ff7b72"
            icon={Cpu}
            title="Code Completion"
            desc="Context-aware AI suggestions as you type. Press Tab to accept, keep typing to dismiss."
          />
          <FeatureCard
            delay={0.5}
            accent="#79c0ff"
            icon={GitBranch}
            title="Version Snapshots"
            desc="Auto-saved snapshots every session. Roll back to any point in your collaboration history."
          />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section
        id="how"
        style={{ ...styles.section, background: "var(--bg-secondary)" }}
      >
        <FadeInSection>
          <div style={styles.sectionHeader}>
            <span className="badge badge-cyan" style={{ marginBottom: 16 }}>
              How it works
            </span>
            <h2 style={styles.sectionTitle}>
              Up and running
              <br />
              in 30 seconds
            </h2>
          </div>
        </FadeInSection>

        <div style={styles.steps}>
          {[
            {
              n: "01",
              title: "Create a Room",
              desc: "Name your session, pick a language. A unique shareable link is generated instantly.",
              icon: Globe,
            },
            {
              n: "02",
              title: "Invite your team",
              desc: "Share the room link. Collaborators join instantly — no account required for guests.",
              icon: Users,
            },
            {
              n: "03",
              title: "Code together",
              desc: "Edit in real-time, run code, use AI review and auto-fix. Chat inline with your team.",
              icon: Code2,
            },
            {
              n: "04",
              title: "Ship it",
              desc: "Save snapshots, review history, and export your final code when you're ready to ship.",
              icon: Lock,
            },
          ].map((step, i) => (
            <FadeInSection key={i} delay={i * 0.15}>
              <div style={styles.step}>
                <div style={styles.stepNum}>{step.n}</div>
                <div style={styles.stepIcon}>
                  <step.icon size={20} color="var(--accent-cyan)" />
                </div>
                <h3 style={styles.stepTitle}>{step.title}</h3>
                <p style={styles.stepDesc}>{step.desc}</p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <FadeInSection>
        <section style={styles.cta}>
          <div style={styles.ctaGlow} />
          <span className="badge badge-cyan" style={{ marginBottom: 20 }}>
            <Zap size={10} /> Free Forever
          </span>
          <h2 style={styles.ctaTitle}>Ready to collaborate?</h2>
          <p style={styles.ctaSub}>
            Create your first room in seconds. No credit card. No setup.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/register")}
            style={{ padding: "14px 32px", fontSize: "16px", marginTop: 8 }}
          >
            Start for Free <ChevronRight size={18} />
          </button>
        </section>
      </FadeInSection>

      {/* ── Footer ───────────────────────────────────── */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.logo}>
            <Code2 size={16} color="var(--accent-cyan)" />
            <span style={{ ...styles.logoText, fontSize: "14px" }}>
              CodeCollab
            </span>
          </div>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
            }}
          >
            Built with ♥ for developers
          </p>
        </div>
      </footer>
    </div>
  );
};

// ── Styles ───────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    overflowX: "hidden",
  },
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: "rgba(8, 12, 16, 0.85)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid var(--border)",
  },
  navInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoText: {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "18px",
    color: "var(--text-primary)",
  },
  navLinks: { display: "flex", gap: 32 },
  navLink: {
    color: "var(--text-secondary)",
    fontSize: "14px",
    fontWeight: 500,
    transition: "color 0.2s",
  },
  navActions: { display: "flex", gap: 10 },

  hero: {
    minHeight: "100vh",
    paddingTop: 64,
    display: "flex",
    alignItems: "center",
    maxWidth: 1200,
    margin: "0 auto",
    padding: "80px 24px",
    gap: 60,
    position: "relative",
  },
  heroInner: { flex: 1, maxWidth: 560 },
  blob1: {
    position: "fixed",
    top: "10%",
    left: "-10%",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  blob2: {
    position: "fixed",
    top: "40%",
    right: "-5%",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0,255,157,0.05) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  heroTitle: {
    fontSize: "clamp(42px, 6vw, 72px)",
    fontWeight: 800,
    lineHeight: 1.1,
    marginBottom: 20,
    letterSpacing: "-0.02em",
  },
  heroAccent: {
    background:
      "linear-gradient(135deg, var(--accent-cyan), var(--accent-green))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSub: {
    fontSize: "17px",
    color: "var(--text-secondary)",
    lineHeight: 1.7,
    marginBottom: 32,
  },
  heroCtas: { display: "flex", gap: 12, marginBottom: 32 },
  techBadges: { display: "flex", flexWrap: "wrap", gap: 8 },
  techBadge: {
    padding: "4px 10px",
    borderRadius: 4,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    fontSize: "11px",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
  },
  heroCode: { flex: 1, position: "relative", minWidth: 0 },

  codePreview: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden",
    boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,255,0.1)",
  },
  codeHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    background: "var(--bg-elevated)",
    borderBottom: "1px solid var(--border)",
  },
  dots: { display: "flex", gap: 6 },
  dot: { width: 12, height: 12, borderRadius: "50%" },
  codeFileName: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
  },
  codeBody: { padding: "16px 0" },
  codeLine: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "2px 16px",
    fontSize: "13px",
    fontFamily: "var(--font-mono)",
    lineHeight: 1.8,
    minHeight: 24,
  },
  lineNum: { color: "#484f58", width: 16, textAlign: "right", flexShrink: 0 },
  cursor: { color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" },

  floatingUser1: {
    position: "absolute",
    top: -16,
    right: 20,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 100,
    padding: "6px 12px 6px 6px",
  },
  floatingUser2: {
    position: "absolute",
    bottom: -16,
    left: 20,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 100,
    padding: "6px 12px 6px 6px",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 700,
    color: "#fff",
  },
  avatarLabel: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    fontFamily: "var(--font-mono)",
  },

  stats: {
    borderTop: "1px solid var(--border)",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-secondary)",
  },
  statsInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "48px 24px",
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    alignItems: "center",
    gap: 0,
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "8px 24px",
  },
  statNumber: {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: "42px",
    color: "var(--accent-cyan)",
    lineHeight: 1,
  },
  statLabel: {
    fontSize: "13px",
    color: "var(--text-muted)",
    textAlign: "center",
  },
  statDivider: {
    height: 40,
    width: 1,
    background: "var(--border)",
    margin: "0 auto",
  },

  section: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "100px 24px",
  },
  sectionHeader: { textAlign: "center", marginBottom: 64 },
  sectionTitle: {
    fontSize: "clamp(32px, 4vw, 48px)",
    fontWeight: 800,
    lineHeight: 1.15,
    marginBottom: 16,
    letterSpacing: "-0.02em",
  },
  sectionSub: {
    fontSize: "16px",
    color: "var(--text-secondary)",
    maxWidth: 480,
    margin: "0 auto",
    lineHeight: 1.7,
  },

  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 20,
  },
  featureCard: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "28px 28px",
    cursor: "default",
    transition: "border-color 0.2s",
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: "17px",
    fontWeight: 700,
    marginBottom: 10,
    fontFamily: "var(--font-display)",
  },
  featureDesc: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: 1.7,
  },

  steps: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 32,
  },
  step: { textAlign: "center", padding: "8px" },
  stepNum: {
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "var(--accent-cyan)",
    marginBottom: 16,
    opacity: 0.7,
  },
  stepIcon: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "rgba(0,212,255,0.08)",
    border: "1px solid rgba(0,212,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  stepTitle: {
    fontSize: "17px",
    fontWeight: 700,
    marginBottom: 10,
    fontFamily: "var(--font-display)",
  },
  stepDesc: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: 1.7,
  },

  cta: {
    textAlign: "center",
    padding: "100px 24px",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  ctaGlow: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 600,
    height: 300,
    borderRadius: "50%",
    background:
      "radial-gradient(ellipse, rgba(0,212,255,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  ctaTitle: {
    fontSize: "clamp(36px, 5vw, 60px)",
    fontWeight: 800,
    marginBottom: 16,
    letterSpacing: "-0.02em",
  },
  ctaSub: {
    fontSize: "16px",
    color: "var(--text-secondary)",
    marginBottom: 32,
    maxWidth: 400,
    lineHeight: 1.7,
  },

  footer: {
    borderTop: "1px solid var(--border)",
    padding: "24px",
  },
  footerInner: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
};

export default LandingPage;
