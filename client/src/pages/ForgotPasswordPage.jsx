import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Code2, Mail, ArrowLeft, KeyRound } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // 'email' | 'reset'
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendResetLink = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email is required");
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      toast.success("If an account exists, a reset link has been sent");
      setStep("reset");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!token || !newPassword) {
      toast.error("Token and new password are required");
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        token,
        newPassword,
      });
      toast.success("Password reset successful!");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page} className="grid-bg">
      <div style={styles.glow} />

      {/* Back to home */}
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
          <div style={styles.iconWrap}>
            <KeyRound size={24} color="var(--accent-cyan)" />
          </div>
          <h1 style={styles.title}>
            {step === "email" ? "Reset password" : "Enter new password"}
          </h1>
          <p style={styles.subtitle}>
            {step === "email"
              ? "Enter your email and we'll send you a reset link"
              : "Check your server console for the reset token"}
          </p>
        </div>

        <div className="divider" />

        {/* Form */}
        {step === "email" ? (
          <form onSubmit={handleSendResetLink} style={styles.form}>
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
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <motion.button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={styles.submitBtn}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? <span style={styles.spinner} /> : "Send Reset Link"}
            </motion.button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Reset Token</label>
              <input
                className="input"
                style={styles.input}
                type="text"
                placeholder="Paste token from server console"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>New Password</label>
              <input
                className="input"
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <motion.button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={styles.submitBtn}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? <span style={styles.spinner} /> : "Reset Password"}
            </motion.button>
          </form>
        )}

        {/* Footer */}
        <p style={styles.footerText}>
          <button
            onClick={() => navigate("/login")}
            style={styles.backToLogin}
          >
            <ArrowLeft size={14} /> Back to login
          </button>
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
      "radial-gradient(ellipse, rgba(0,212,255,0.07) 0%, transparent 70%)",
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
    maxWidth: 400,
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "32px 28px",
    position: "relative",
    zIndex: 1,
  },
  cardHeader: {
    textAlign: "center",
    marginBottom: 24,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "rgba(0,212,255,0.1)",
    border: "1px solid rgba(0,212,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  title: {
    fontSize: "22px",
    fontWeight: 700,
    marginBottom: 8,
    fontFamily: "var(--font-display)",
  },
  subtitle: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--text-secondary)",
  },
  inputWrap: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
  },
  inputWithIcon: {
    width: "100%",
    padding: "10px 12px 10px 36px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
  },
  submitBtn: {
    width: "100%",
    justifyContent: "center",
    padding: "12px",
    fontSize: "15px",
    marginTop: 8,
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
    marginTop: 20,
    fontSize: "13px",
    color: "var(--text-muted)",
  },
  backToLogin: {
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: "13px",
    padding: 0,
    transition: "color 0.2s",
  },
};

export default ForgotPasswordPage;