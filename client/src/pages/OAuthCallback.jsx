import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const user = {
          id: payload.userId,
          username: payload.username,
        };
        // Store in localStorage first
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
        // Force a reload so AuthProvider re-initializes with the new token
        window.location.href = "/dashboard";
      } catch (err) {
        console.error("OAuth callback error:", err);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [searchParams, navigate]);

  return (
    <div style={styles.page}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={styles.card}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={styles.spinner}
        />
        <p style={styles.text}>Authenticating...</p>
      </motion.div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-primary)",
  },
  card: {
    textAlign: "center",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid var(--border)",
    borderTopColor: "var(--accent-cyan)",
    borderRadius: "50%",
    margin: "0 auto 16px",
  },
  text: {
    color: "var(--text-secondary)",
    fontSize: "14px",
  },
};

export default OAuthCallback;