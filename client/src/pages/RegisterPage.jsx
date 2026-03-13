import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Code2,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Password strength checker
const getStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const map = [
    { label: "", color: "transparent" },
    { label: "Weak", color: "#ff4d4d" },
    { label: "Fair", color: "#ffa657" },
    { label: "Good", color: "var(--accent-cyan)" },
    { label: "Strong", color: "var(--accent-green)" },
  ];
  return { score, ...map[score] };
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const strength = getStrength(form.password);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.username || !form.password) {
      toast.error("All fields are required");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/auth/register`, form);
      login(res.data.user, res.data.token);
      toast.success("Account created! Welcome to CodeCollab 🚀");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page} className="grid-bg">
      <div style={styles.glow} />

      {/* Logo */}
      <motion.div
        style={styles.backLink}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Link to="/" style={styles.back}>
          <Code2 size={18} color="var(--accent-cyan)" />
          <span style={styles.backText}>CodeCollab</span>
        </Link>
      </motion.div>

      {/* Card */}
      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div style={styles.cardHeader}>
          <h1 style={styles.title}>Create account</h1>
          <p style={styles.subtitle}>
            Join thousands of developers on CodeCollab
          </p>
        </div>

        {/* Perks */}
        <div style={styles.perks}>
          {["Free forever", "AI-powered tools", "Real-time sync"].map((p) => (
            <span key={p} style={styles.perk}>
              <Check size={11} color="var(--accent-green)" />
              {p}
            </span>
          ))}
        </div>

        <div className="divider" />

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Email */}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <div style={styles.inputWrap}>
              <Mail
                size={15}
                style={styles.inputIcon}
                color="var(--text-muted)"
              />
              <input
                className="input"
                style={styles.inputWithIcon}
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Username */}
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <div style={styles.inputWrap}>
              <User
                size={15}
                style={styles.inputIcon}
                color="var(--text-muted)"
              />
              <input
                className="input"
                style={styles.inputWithIcon}
                type="text"
                name="username"
                placeholder="yourname"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <Lock
                size={15}
                style={styles.inputIcon}
                color="var(--text-muted)"
              />
              <input
                className="input"
                style={styles.inputWithIcon}
                type={showPass ? "text" : "password"}
                name="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                style={styles.eyeBtn}
              >
                {showPass ? (
                  <EyeOff size={15} color="var(--text-muted)" />
                ) : (
                  <Eye size={15} color="var(--text-muted)" />
                )}
              </button>
            </div>

            {/* Strength meter */}
            {form.password && (
              <motion.div
                style={styles.strengthWrap}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div style={styles.strengthBars}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.strengthBar,
                        background:
                          i <= strength.score
                            ? strength.color
                            : "var(--border)",
                        transition: "background 0.3s ease",
                      }}
                    />
                  ))}
                </div>
                <span
                  style={{ ...styles.strengthLabel, color: strength.color }}
                >
                  {strength.label}
                </span>
              </motion.div>
            )}
          </div>

          {/* Submit */}
          <motion.button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={styles.submitBtn}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span style={styles.spinner} />
            ) : (
              <>
                Create Account <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <p style={styles.footerText}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "var(--accent-cyan)", fontWeight: 600 }}
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    position: "relative",
    overflow: "hidden",
  },
  glow: {
    position: "fixed",
    top: "30%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 600,
    height: 400,
    borderRadius: "50%",
    background:
      "radial-gradient(ellipse, rgba(0,255,157,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  backLink: { position: "absolute", top: 24, left: 24 },
  back: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
  },
  backText: {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "16px",
    color: "var(--text-primary)",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "36px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
    position: "relative",
    zIndex: 1,
  },
  cardHeader: { marginBottom: 16 },
  title: {
    fontSize: "26px",
    fontWeight: 800,
    fontFamily: "var(--font-display)",
    marginBottom: 6,
  },
  subtitle: { fontSize: "14px", color: "var(--text-secondary)" },
  perks: { display: "flex", gap: 16, marginBottom: 4, flexWrap: "wrap" },
  perk: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: "12px",
    color: "var(--text-secondary)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    marginBottom: 24,
  },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" },
  inputWrap: { position: "relative" },
  inputIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },
  inputWithIcon: { paddingLeft: "36px" },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
  },
  strengthWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  strengthBars: { display: "flex", gap: 4, flex: 1 },
  strengthBar: { height: 3, flex: 1, borderRadius: 2 },
  strengthLabel: {
    fontSize: "11px",
    fontFamily: "var(--font-mono)",
    minWidth: 40,
  },
  submitBtn: {
    width: "100%",
    justifyContent: "center",
    padding: "12px",
    fontSize: "15px",
    marginTop: 4,
  },
  spinner: {
    width: 18,
    height: 18,
    border: "2px solid rgba(8,12,16,0.3)",
    borderTopColor: "var(--bg-primary)",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  footerText: {
    textAlign: "center",
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
};

export default RegisterPage;
