import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
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
  Database,
  FileCode,
  Box,
  Circle,
  Sparkles,
  Workflow,
  Layers,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Logo from "../components/Logo";

// ── Typing effect hook ──────────────────────────────────
const useTypingEffect = (text, speed = 80, startDelay = 500) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [startTyping, setStartTyping] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => setStartTyping(true), startDelay);
    return () => clearTimeout(startTimeout);
  }, [startDelay]);

  useEffect(() => {
    if (!startTyping) return;
    setIsTyping(true);
    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, startTyping]);

  return { displayedText, isTyping };
};

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
const FadeInSection = ({ children, delay = 0, className = "", style = {} }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={style}
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
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      whileHover={{
        y: -6,
        scale: 1.015,
        borderColor: "var(--border-bright)",
        boxShadow: "0 16px 36px rgba(0,0,0,0.6)"
      }}
      transition={{
        default: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
        y: { type: "spring", stiffness: 300, damping: 20 },
        scale: { type: "spring", stiffness: 300, damping: 20 }
      }}
      style={styles.featureCard}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
      <h3 style={{ ...styles.featureTitle, display: "flex", alignItems: "center", gap: 6 }}>
        {title}
        <motion.span
          animate={{ x: hovered ? 4 : 0, opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ fontSize: "16px", color: "var(--accent-cyan)", display: "inline-block" }}
        >
          →
        </motion.span>
      </h3>
      <p style={styles.featureDesc}>{desc}</p>
    </motion.div>
  );
};

// ── Mock Code snippets ───────────────────────────────────
const CODE_SNIPPETS = {
  js: {
    fileName: "main.js",
    lines: [
      { tokens: [{ t: "// Real-time collaboration", c: "#484f58" }] },
      { tokens: [
        { t: "const ", c: "#ff7b72" },
        { t: "room", c: "#79c0ff" },
        { t: " = ", c: "#e6edf3" },
        { t: "await ", c: "#ff7b72" },
        { t: "CodeCollab", c: "#ffa657" },
        { t: ".", c: "#e6edf3" },
        { t: "createRoom", c: "#d2a8ff" },
        { t: "({", c: "#e6edf3" }
      ] },
      { tokens: [
        { t: "  name", c: "#79c0ff" },
        { t: ": ", c: "#e6edf3" },
        { t: '"My Project"', c: "#a5d6ff" },
        { t: ",", c: "#e6edf3" }
      ] },
      { tokens: [
        { t: "  language", c: "#79c0ff" },
        { t: ": ", c: "#e6edf3" },
        { t: '"javascript"', c: "#a5d6ff" }
      ] },
      { tokens: [{ t: "})", c: "#e6edf3" }] },
      { tokens: [] },
      { tokens: [{ t: "// AI-powered review", c: "#484f58" }] },
      { tokens: [
        { t: "const ", c: "#ff7b72" },
        { t: "review", c: "#79c0ff" },
        { t: " = ", c: "#e6edf3" },
        { t: "await ", c: "#ff7b72" },
        { t: "AI", c: "#ffa657" },
        { t: ".", c: "#e6edf3" },
        { t: "reviewCode", c: "#d2a8ff" },
        { t: "(code)", c: "#e6edf3" }
      ] },
      { tokens: [
        { t: "console", c: "#ffa657" },
        { t: ".", c: "#e6edf3" },
        { t: "log", c: "#d2a8ff" },
        { t: "(review.issues)", c: "#e6edf3" }
      ] }
    ],
    cursors: [
      { name: "Sarah", color: "#ff007f", top: 46, left: 165, x: [0, 20, 0], y: [0, -6, 0] },
      { name: "Alex", color: "#00d4ff", top: 166, left: 240, x: [0, -15, 0], y: [0, 4, 0] }
    ]
  },
  py: {
    fileName: "main.py",
    lines: [
      { tokens: [{ t: "# Real-time collaboration", c: "#484f58" }] },
      { tokens: [
        { t: "room", c: "#79c0ff" },
        { t: " = ", c: "#e6edf3" },
        { t: "await ", c: "#ff7b72" },
        { t: "CodeCollab", c: "#ffa657" },
        { t: ".", c: "#e6edf3" },
        { t: "create_room", c: "#d2a8ff" },
        { t: "(", c: "#e6edf3" }
      ] },
      { tokens: [
        { t: "    name", c: "#79c0ff" },
        { t: "=", c: "#ff7b72" },
        { t: '"My Project"', c: "#a5d6ff" },
        { t: ",", c: "#e6edf3" }
      ] },
      { tokens: [
        { t: "    language", c: "#79c0ff" },
        { t: "=", c: "#ff7b72" },
        { t: '"python"', c: "#a5d6ff" }
      ] },
      { tokens: [{ t: ")", c: "#e6edf3" }] },
      { tokens: [] },
      { tokens: [{ t: "# AI-powered review", c: "#484f58" }] },
      { tokens: [
        { t: "review", c: "#79c0ff" },
        { t: " = ", c: "#e6edf3" },
        { t: "await ", c: "#ff7b72" },
        { t: "AI", c: "#ffa657" },
        { t: ".", c: "#e6edf3" },
        { t: "review_code", c: "#d2a8ff" },
        { t: "(code)", c: "#e6edf3" }
      ] },
      { tokens: [
        { t: "print", c: "#ffa657" },
        { t: "(review", c: "#e6edf3" },
        { t: ".", c: "#e6edf3" },
        { t: "issues)", c: "#79c0ff" }
      ] }
    ],
    cursors: [
      { name: "Yuki", color: "#e8ff47", top: 46, left: 185, x: [0, -10, 0], y: [0, 8, 0] },
      { name: "Sarah", color: "#ff007f", top: 166, left: 200, x: [0, 15, 0], y: [0, -4, 0] }
    ]
  },
  cpp: {
    fileName: "main.cpp",
    lines: [
      { tokens: [{ t: "// Real-time collaboration", c: "#484f58" }] },
      { tokens: [
        { t: "auto ", c: "#ff7b72" },
        { t: "room", c: "#79c0ff" },
        { t: " = co_await ", c: "#ff7b72" },
        { t: "CodeCollab", c: "#ffa657" },
        { t: "::", c: "#e6edf3" },
        { t: "createRoom", c: "#d2a8ff" },
        { t: "({", c: "#e6edf3" }
      ] },
      { tokens: [
        { t: "    .name", c: "#79c0ff" },
        { t: " = ", c: "#e6edf3" },
        { t: '"My Project"', c: "#a5d6ff" },
        { t: ",", c: "#e6edf3" }
      ] },
      { tokens: [
        { t: "    .language", c: "#79c0ff" },
        { t: " = ", c: "#e6edf3" },
        { t: '"cpp"', c: "#a5d6ff" }
      ] },
      { tokens: [{ t: "});", c: "#e6edf3" }] },
      { tokens: [] },
      { tokens: [{ t: "// AI-powered review", c: "#484f58" }] },
      { tokens: [
        { t: "auto ", c: "#ff7b72" },
        { t: "review", c: "#79c0ff" },
        { t: " = co_await ", c: "#ff7b72" },
        { t: "AI", c: "#ffa657" },
        { t: "::", c: "#e6edf3" },
        { t: "reviewCode", c: "#d2a8ff" },
        { t: "(code);", c: "#e6edf3" }
      ] },
      { tokens: [
        { t: "std", c: "#ffa657" },
        { t: "::", c: "#e6edf3" },
        { t: "cout", c: "#79c0ff" },
        { t: " << ", c: "#e6edf3" },
        { t: "review", c: "#79c0ff" },
        { t: ".", c: "#e6edf3" },
        { t: "issues;", c: "#79c0ff" }
      ] }
    ],
    cursors: [
      { name: "Alex", color: "#00d4ff", top: 46, left: 220, x: [0, 10, 0], y: [0, -6, 0] },
      { name: "Yuki", color: "#e8ff47", top: 166, left: 280, x: [0, -20, 0], y: [0, 4, 0] }
    ]
  }
};

// ── Code preview block ───────────────────────────────────
const CodePreview = ({ whileHover, transition }) => {
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
    <motion.div 
      style={styles.codePreview}
      whileHover={whileHover}
      transition={transition}
    >
      {/* Window chrome */}
      <div style={styles.codeHeader}>
        <div style={styles.dots}>
          <span style={{ ...styles.dot, background: "#ff5f57" }} />
          <span style={{ ...styles.dot, background: "#febc2e" }} />
          <span style={{ ...styles.dot, background: "#28c840" }} />
        </div>
        <span style={styles.codeFileName}>
          <Logo size={12} style={{ marginRight: 6 }} />
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
    </motion.div>
  );
};

// ── Tech badge component ─────────────────────────────────
const TechBadge = ({ tech }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      style={{
        ...styles.techBadgeTicker,
        borderColor: hovered ? "var(--border-bright)" : "var(--border)",
        background: hovered ? "rgba(255, 255, 255, 0.03)" : "var(--bg-card)",
      }}
      whileHover={{ y: -4, scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        style={{
          ...styles.techIcon,
          color: tech.color,
          filter: hovered ? "none" : "grayscale(100%)",
          opacity: hovered ? 1 : 0.4,
          transition: "filter 0.3s ease, opacity 0.3s ease, color 0.3s ease",
        }}
      >
        {tech.icon}
      </span>
      <span
        style={{
          ...styles.techName,
          opacity: hovered ? 0.9 : 0.6,
          transition: "opacity 0.3s ease",
        }}
      >
        {tech.name}
      </span>
    </motion.div>
  );
};

// ── Main Landing Page ────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);



  const statsRef = useRef(null);

  return (
    <div style={styles.page}>
      {/* ── Nav ─────────────────────────────────────── */}
      <motion.nav
        style={{
          ...styles.nav,
          background: scrolled ? "rgba(17, 17, 17, 0.75)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottomColor: scrolled ? "var(--border)" : "transparent",
          transition: "background 0.3s, backdrop-filter 0.3s, border-color 0.3s",
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={styles.navInner}>
          <div
            style={styles.logoLink}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            role="button"
            tabIndex={0}
          >
            <Logo size={22} style={{ marginRight: 6 }} />
            <span style={styles.logoText}>CodeCollab</span>
          </div>
          <div className="nav-links" style={styles.navLinks}>
            <a href="#features" className="nav-link" style={styles.navLink}>
              Features
            </a>
            <a href="#how" className="nav-link" style={styles.navLink}>
              How it works
            </a>
          </div>
          <div style={styles.navActions}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/login")}
              style={{ padding: "8px 22px", fontSize: "13px", borderRadius: "24px", fontWeight: 600 }}
            >
              Sign in
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/register")}
              style={{ padding: "8px 22px", fontSize: "13px", borderRadius: "24px", fontWeight: 700 }}
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
        <div style={styles.heroInner}>
          <motion.h1
            style={styles.heroTitle}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            <span style={{ display: "block", marginBottom: "8px", color: "var(--text-primary)" }}>
              Code Together,
            </span>
            <span style={{ ...styles.heroAccent, display: "block" }}>
              Ship Faster.
            </span>
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
          </motion.div>
        </div>

        {/* Code Preview with floating animation */}
        <motion.div
          style={styles.heroCode}
          initial={{ opacity: 0, x: 60, y: 40 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.5,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          <motion.div style={styles.floatingEditor}>
            <CodePreview 
              whileHover={{
                y: -12,
                scale: 1.015,
                borderColor: "var(--border-bright)",
                boxShadow: "0 30px 100px rgba(0,0,0,0.75), 0 0 40px rgba(255, 255, 255, 0.08)"
              }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
            />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ── Tech Stack Ticker ────────────────────────────────────── */}
      <section ref={statsRef} className="ticker-container">
        <div className="ticker-mask-left" />
        <div className="ticker-mask-right" />
        <div className="stats-track" style={styles.statsTrack}>
          {[
            { name: "React", icon: <Box size={16} />, color: "#61DAFB" },
            { name: "Node.js", icon: <Circle size={16} />, color: "#339933" },
            { name: "Yjs CRDTs", icon: <Layers size={16} />, color: "#8B5CF6" },
            { name: "Groq AI", icon: <Sparkles size={16} />, color: "#F59E0B" },
            { name: "PostgreSQL", icon: <Database size={16} />, color: "#4169E1" },
            { name: "Socket.io", icon: <Workflow size={16} />, color: "#010101" },
            { name: "Prisma", icon: <Database size={16} />, color: "#2D3748" },
            { name: "Monaco Editor", icon: <FileCode size={16} />, color: "#00D4FF" },
            { name: "Express", icon: <Circle size={16} />, color: "#000000" },
            { name: "Framer Motion", icon: <Zap size={16} />, color: "#0055FF" },
            { name: "Vite", icon: <Zap size={16} />, color: "#646CFF" },
            { name: "TypeScript", icon: <Code2 size={16} />, color: "#3178C6" },
          ].map((tech, i) => (
            <TechBadge key={i} tech={tech} />
          ))}
          {/* Duplicate for seamless loop */}
          {[
            { name: "React", icon: <Box size={16} />, color: "#61DAFB" },
            { name: "Node.js", icon: <Circle size={16} />, color: "#339933" },
            { name: "Yjs CRDTs", icon: <Layers size={16} />, color: "#8B5CF6" },
            { name: "Groq AI", icon: <Sparkles size={16} />, color: "#F59E0B" },
            { name: "PostgreSQL", icon: <Database size={16} />, color: "#4169E1" },
            { name: "Socket.io", icon: <Workflow size={16} />, color: "#010101" },
            { name: "Prisma", icon: <Database size={16} />, color: "#2D3748" },
            { name: "Monaco Editor", icon: <FileCode size={16} />, color: "#00D4FF" },
            { name: "Express", icon: <Circle size={16} />, color: "#000000" },
            { name: "Framer Motion", icon: <Zap size={16} />, color: "#0055FF" },
            { name: "Vite", icon: <Zap size={16} />, color: "#646CFF" },
            { name: "TypeScript", icon: <Code2 size={16} />, color: "#3178C6" },
          ].map((tech, i) => (
            <TechBadge key={`dup-${i}`} tech={tech} />
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section id="features" className="landing-section" style={styles.section}>
        <FadeInSection>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              Everything you need to
              <br />
              collaborate on code
            </h2>
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

      <div style={{ borderTop: "1px solid var(--border)", width: "100%" }} />

      {/* ── How it works ─────────────────────────────── */}
      <section
        id="how"
        className="landing-section"
        style={{ ...styles.section, background: "var(--bg-secondary)" }}
      >
        <FadeInSection>
          <div style={styles.sectionHeader}>
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
            <FadeInSection key={i} delay={i * 0.15} style={{ height: "100%" }}>
              <motion.div 
                style={{ ...styles.step, height: "100%" }}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  borderColor: "var(--border-bright)",
                  boxShadow: "0 16px 36px rgba(0,0,0,0.6)"
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 22
                }}
              >
                <div style={styles.stepNum}>{step.n}</div>
                <div style={styles.stepIcon}>
                  <step.icon size={20} color="var(--accent-cyan)" />
                </div>
                <h3 style={styles.stepTitle}>{step.title}</h3>
                <p style={styles.stepDesc}>{step.desc}</p>
              </motion.div>
            </FadeInSection>
          ))}
        </div>
      </section>

      <div style={{ borderTop: "1px solid var(--border)", width: "100%" }} />

      {/* ── CTA ──────────────────────────────────────── */}
      <FadeInSection>
        <section className="cta-section" style={styles.cta}>
          <span className="badge badge-cyan" style={{ marginBottom: 20 }}>
            <Zap size={10} /> Start Free
          </span>
          <h2 style={styles.ctaTitle}>Ready to collaborate?</h2>
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
        <p style={styles.footerCopyright}>
          © {new Date().getFullYear()} CodeCollab. All rights reserved.
        </p>
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
    background: "rgba(0, 0, 0, 0.85)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid var(--border)",
  },
  navInner: {
    maxWidth: 1200,
    width: "100%",
    margin: "0 auto",
    padding: "0 24px",
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  logo: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  logoLink: { display: "flex", alignItems: "center", gap: 10, textDecoration: "none", cursor: "pointer" },
  logoText: {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "18px",
    color: "var(--text-primary)",
  },
  navLinks: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: 32,
  },
  navLink: {
    color: "var(--text-primary)",
    fontSize: "15px",
    fontWeight: 600,
    transition: "color 0.2s",
    cursor: "pointer",
    textDecoration: "none",
    letterSpacing: "0.01em",
  },
  navActions: { display: "flex", gap: 10, alignItems: "center" },
  themeToggleBtn: {
    background: "transparent",
    border: "1px solid var(--border-bright)",
    borderRadius: "50%",
    width: 34,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "var(--text-primary)",
    transition: "all 0.2s ease",
    padding: 0,
    marginRight: 6,
  },

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
      "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
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
      "linear-gradient(135deg, #ffffff 0%, #999999 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  typingText: {
    color: "var(--text-primary)",
  },
  cursor: {
    color: "var(--accent-cyan)",
    marginLeft: 2,
    animation: "blink 1s infinite",
  },
  heroSub: {
    fontSize: "17px",
    color: "var(--text-secondary)",
    lineHeight: 1.7,
    marginBottom: 32,
  },
  heroCtas: { display: "flex", gap: 12, marginBottom: 32 },
  heroCode: { flex: 1, position: "relative", minWidth: 0 },
  floatingEditor: {
    position: "relative",
    width: "100%",
  },

  codePreview: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden",
    boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
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
    fontSize: "13px",
    color: "var(--text-secondary)",
    display: "flex",
    alignItems: "center",
    fontWeight: 500,
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

  statsTicker: {
    borderTop: "1px solid var(--border)",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-secondary)",
    overflow: "hidden",
    padding: "48px 0",
  },
  statsTrack: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    animation: "scrollStats 25s linear infinite",
    width: "fit-content",
  },
  techBadgeTicker: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 32px",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    whiteSpace: "nowrap",
  },
  techIcon: {
    display: "flex",
    alignItems: "center",
  },
  techName: {
    fontFamily: "var(--font-mono)",
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--text-primary)",
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
    fontSize: "clamp(36px, 5vw, 56px)",
    fontWeight: 800,
    lineHeight: 1.1,
    marginBottom: 16,
    letterSpacing: "-0.03em",
    color: "var(--text-primary)",
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
  step: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "32px 24px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
  },
  stepNum: {
    fontFamily: "var(--font-mono)",
    fontSize: "16px",
    fontWeight: 700,
    color: "var(--accent-cyan)",
    marginBottom: 16,
    letterSpacing: "0.05em",
    opacity: 0.95,
  },
  stepIcon: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
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
    padding: "80px 48px",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    maxWidth: 900,
    margin: "80px auto",
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
      "radial-gradient(ellipse, rgba(255,255,255,0.08) 0%, transparent 70%)",
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
    background: "var(--bg-primary)",
    padding: "32px 24px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  footerCopyright: {
    fontSize: "13px",
    color: "var(--text-muted)",
    textAlign: "center",
  },
};

export default LandingPage;
