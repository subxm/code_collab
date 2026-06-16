import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const GOOGLE_AUTH_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace("/api", "")}/api/auth/google`
  : "http://localhost:5000/api/auth/google";

const containerVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 150, damping: 18 },
  },
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email format";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/auth/login`, form);
      login(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.username}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = () => {
    window.location.href = `${GOOGLE_AUTH_URL}?origin=${window.location.origin}`;
  };

  return (
    <div style={styles.page} className="grid-bg">
      {/* Ambient glow */}
      <div style={styles.glow} />

      {/* Back to home */}
      <motion.div
        style={styles.backLink}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Link to="/" style={styles.back}>
          <Logo size={18} style={{ marginRight: 6 }} />
          <span style={styles.backText}>CodeCollab</span>
        </Link>
      </motion.div>

      {/* Card */}
      <motion.div
        style={styles.card}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div style={styles.cardHeader} variants={itemVariants}>
          <h1 style={styles.title}>Welcome back</h1>
          <p style={styles.subtitle}>Sign in to your CodeCollab account</p>
        </motion.div>

        {/* Social Login */}
        <motion.div style={styles.socialSection} variants={itemVariants}>
          <motion.button
            type="button"
            style={styles.googleIconButton}
            whileHover={{ 
              y: -2,
              scale: 1.01,
              borderColor: "var(--border-bright)",
              background: "rgba(255, 255, 255, 0.04)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
            }}
            whileTap={{ scale: 0.99 }}
            onClick={() => handleOAuthLogin()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </motion.button>
        </motion.div>

        <motion.div className="divider" variants={itemVariants} style={{ margin: "20px 0" }} />

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Email */}
          <motion.div style={styles.field} variants={itemVariants}>
            <label style={styles.label}>Email</label>
            <div style={styles.inputWrap}>
              <Mail
                size={15}
                style={styles.inputIcon}
                color={errors.email ? "#ff4d4d" : "var(--text-muted)"}
              />
              <input
                className="input"
                style={{
                  ...styles.inputWithIcon,
                  borderColor: errors.email ? "#ff4d4d" : "var(--border)",
                }}
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
            <AnimatePresence>
              {errors.email && (
                <motion.div
                  style={{ overflow: "hidden" }}
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <span style={styles.errorText}>
                    {errors.email}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Password */}
          <motion.div style={styles.field} variants={itemVariants}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <Lock
                size={15}
                style={styles.inputIcon}
                color={errors.password ? "#ff4d4d" : "var(--text-muted)"}
              />
              <input
                className="input"
                style={{
                  ...styles.inputWithIcon,
                  borderColor: errors.password ? "#ff4d4d" : "var(--border)",
                }}
                type={showPass ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
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
            <AnimatePresence>
              {errors.password && (
                <motion.div
                  style={{ overflow: "hidden" }}
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <span style={styles.errorText}>
                    {errors.password}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Submit */}
          <motion.button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={styles.submitBtn}
            variants={itemVariants}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span style={styles.spinner} />
            ) : (
              <>
                Sign In <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <motion.p style={styles.footerText} variants={itemVariants}>
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{ color: "var(--accent-cyan)", fontWeight: 600 }}
          >
            Create one
          </Link>
        </motion.p>
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
      "radial-gradient(ellipse, rgba(255,255,255,0.07) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  backLink: {
    position: "absolute",
    top: 24,
    left: 24,
  },
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
  cardHeader: { marginBottom: 24 },
  title: {
    fontSize: "26px",
    fontWeight: 800,
    fontFamily: "var(--font-display)",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    marginBottom: 24,
  },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: {
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--text-secondary)",
  },
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
    border: "2px solid rgba(255,255,255,0.1)",
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
  socialSection: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 8,
  },
  googleIconButton: {
    width: "100%",
    height: 46,
    borderRadius: "23px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--text-primary)",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s, color 0.2s",
  },
  socialDivider: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  socialDividerText: {
    fontSize: "12px",
    color: "var(--text-muted)",
    whiteSpace: "nowrap",
    fontWeight: 500,
  },
  socialButtons: {
    display: "flex",
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "10px 16px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "var(--font-body)",
  },
  socialBtnFull: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "12px 16px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "var(--font-body)",
  },
  errorText: {
    fontSize: "12px",
    color: "#ff4d4d",
    marginTop: 4,
    fontWeight: 500,
  },
};

export default LoginPage;
