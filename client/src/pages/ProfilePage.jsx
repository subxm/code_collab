import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Calendar, Edit3, Search, Clock, ArrowLeft,
  Code2, Hash, ArrowRight, Check, Loader2, Sparkles, AlertCircle, Upload
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Language Colors & Labels
const LANG_COLORS = {
  javascript: "#ffa657",
  python:     "#4ec9b0",
  java:       "#ff7b72",
  cpp:        "#79c0ff",
  c:          "#79c0ff",
  typescript: "#3178c6",
  go:         "#00acd7",
  rust:       "#ce422b",
};

const LANG_LABELS = {
  javascript: "JS", python: "PY", java: "Java",
  cpp: "C++", c: "C", typescript: "TS", go: "Go", rust: "RS"
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "N/A";
  const diff = Date.now() - new Date(dateStr);
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// Preset Avatars definition
export const PRESET_AVATARS = [
  { id: 'preset_1', name: 'Code Master', gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', symbol: '</>' },
  { id: 'preset_2', name: 'Sunset Brackets', gradient: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)', symbol: '{}' },
  { id: 'preset_3', name: 'Cyber Zap', gradient: 'linear-gradient(135deg, #a855f7 0%, #6b21a8 100%)', symbol: '⚡' },
  { id: 'preset_4', name: 'Coffee Coder', gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', symbol: '☕' },
  { id: 'preset_5', name: 'Hacker Terminal', gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', symbol: '💻' },
  { id: 'preset_6', name: 'AI Assistant', gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', symbol: '🤖' },
];

export const renderAvatar = (avatarData, username, size = 48) => {
  if (avatarData && avatarData.startsWith('data:image')) {
    return (
      <img 
        src={avatarData} 
        alt={username} 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: '50%', 
          objectFit: 'cover',
          border: '1px solid var(--border-bright)'
        }} 
      />
    );
  }

  if (avatarData && avatarData.startsWith('preset_')) {
    const preset = PRESET_AVATARS.find(p => p.id === avatarData) || PRESET_AVATARS[0];
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: preset.gradient,
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
      }}>
        {preset.symbol}
      </div>
    );
  }

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--accent-purple) 0%, #ffffff 100%)',
      color: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.45,
      fontWeight: 700,
    }}>
      {username?.[0]?.toUpperCase()}
    </div>
  );
};

// Edit Profile Modal
const EditProfileModal = ({ user, onClose, onUpdated, token }) => {
  const [form, setForm]       = useState({ username: user.username, bio: user.bio || "", tagline: user.tagline || "", avatar: user.avatar || "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // limit check: 800 KB
    if (file.size > 800 * 1024) {
      setError("Image size must be less than 800KB");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(p => ({ ...p, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) {
      setError("Username is required");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await axios.put(
        `${API_URL}/api/auth/profile`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Profile updated successfully!");
      onUpdated(res.data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      style={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={styles.modal}
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Edit Profile</h2>
        </div>

        <div className="divider" style={{ margin: "16px 0" }} />

        <form onSubmit={handleSave} style={styles.modalBody}>
          {error && (
            <div style={styles.errorBanner}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              className="input"
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Tagline</label>
            <input
              className="input"
              placeholder="e.g. Coding in the cloud ⚡"
              value={form.tagline}
              onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Profile Avatar</label>
            
            {/* Preview of current selection */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              {renderAvatar(form.avatar, form.username, 56)}
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Avatar Preview
                </span>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Choose a preset below or upload a custom image
                </p>
              </div>
            </div>

            {/* Presets Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 12 }}>
              
              {/* Fallback Initial Letter Preset */}
              <div 
                type="button"
                onClick={() => setForm(p => ({ ...p, avatar: '' }))}
                style={{
                  ...styles.presetCell,
                  border: !form.avatar ? '2px solid var(--accent-purple)' : '2px solid transparent',
                  background: 'rgba(255,255,255,0.03)'
                }}
                title="Default Initials"
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Ab</span>
              </div>

              {/* Mapping of 6 illustration gradients */}
              {PRESET_AVATARS.map(p => (
                <div 
                  key={p.id}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, avatar: p.id }))}
                  style={{
                    ...styles.presetCell,
                    background: p.gradient,
                    border: form.avatar === p.id ? '2px solid #ffffff' : '2px solid transparent',
                    boxShadow: form.avatar === p.id ? '0 0 10px rgba(139,92,246,0.3)' : 'none'
                  }}
                  title={p.name}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                    {p.symbol}
                  </span>
                </div>
              ))}
            </div>

            {/* Custom Upload Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  transition: 'background 0.2s'
                }}
              >
                <Upload size={12} /> Upload Custom Image
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
              {form.avatar && form.avatar.startsWith('data:image') && (
                <span style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: 600 }}>
                  Custom Image Loaded
                </span>
              )}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Bio</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Tell others about yourself..."
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              style={{ resize: "none", padding: "10px 12px", height: "auto" }}
            />
          </div>

          <div style={styles.modalFooter}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, justifyContent: "center" }}>
              {loading ? (
                <Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} />
              ) : (
                <>
                  <Check size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const ProfilePage = () => {
  const { username: paramUsername } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, token, updateUser } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [rooms, setRooms]             = useState([]);
  const [stats, setStats]             = useState({ languages: {}, totalRooms: 0 });
  const [loading, setLoading]         = useState(true);
  const [showEdit, setShowEdit]       = useState(false);
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState("all"); // all, owned, joined

  const targetUsername = paramUsername || currentUser?.username;
  const isOwnProfile   = currentUser && targetUsername?.toLowerCase() === currentUser.username?.toLowerCase();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/auth/profile/${targetUsername}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileUser(res.data.user);
      setRooms(res.data.rooms);
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load profile");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetUsername) {
      fetchProfile();
    }
  }, [targetUsername]);

  const handleProfileUpdated = (updatedUserData) => {
    setProfileUser(updatedUserData);
    if (isOwnProfile) {
      updateUser(updatedUserData);
    }
    // Refresh data
    fetchProfile();
  };

  // Filter & Search Creations
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "owned" && room.myRole === "owner") ||
      (filter === "joined" && room.myRole !== "owner");
    return matchesSearch && matchesFilter;
  });

  // Calculate languages percentage
  const totalLangRooms = Object.values(stats.languages).reduce((a, b) => a + b, 0);
  const languagesList = Object.entries(stats.languages)
    .map(([lang, count]) => ({
      lang,
      count,
      percentage: totalLangRooms > 0 ? Math.round((count / totalLangRooms) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div className="spinner-container">
          <div className="spinner-ring" />
          <h2 style={styles.stillLoaderText}>Loading Profile...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={{ ...styles.navInner, justifyContent: 'flex-start' }}>
          <Link to="/dashboard" style={styles.backBtn}>
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>
        </div>
      </nav>

      <main style={styles.main}>
        {/* Profile Card Header */}
        <motion.div
          style={styles.profileCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={styles.profileTop}>
            <div style={styles.avatarBig}>
              {renderAvatar(profileUser?.avatar, profileUser?.username, 96)}
              <div style={styles.avatarRing} />
            </div>

            <div style={styles.profileMeta}>
              <div style={styles.usernameRow}>
                <h1 style={styles.username}>{profileUser?.username}</h1>
                {isOwnProfile && (
                  <button onClick={() => setShowEdit(true)} style={styles.editBtn} title="Edit Profile">
                    <Edit3 size={14} />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>
              <p style={styles.tagline}>{profileUser?.tagline || "Building things with code ⚡"}</p>
              
              <div style={styles.metaGrid}>
                {isOwnProfile && (
                  <span style={styles.metaPill}>
                    <Mail size={12} />
                    {profileUser?.email}
                  </span>
                )}
                <span style={styles.metaPill}>
                  <Calendar size={12} />
                  Joined {new Date(profileUser?.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                </span>
              </div>
            </div>
          </div>

          <div className="divider" style={{ margin: "24px 0 16px" }} />
          
          <div style={styles.bioSection}>
            <h3 style={styles.bioTitle}>About Me</h3>
            <p style={styles.bioText}>{profileUser?.bio || "This developer hasn't written a bio yet."}</p>
          </div>
        </motion.div>

        {/* Dashboard Grid Split */}
        <div className="profile-grid">
          {/* Left Column: Creations */}
          <div style={styles.leftCol}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Creations & Rooms</h2>
              <div style={styles.filterBar}>
                {/* Search */}
                <div style={styles.searchWrap}>
                  <Search size={14} style={styles.searchIcon} />
                  <input
                    style={styles.searchInput}
                    placeholder="Search creations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {/* Filters */}
                <div style={styles.tabs}>
                  {["all", "owned", "joined"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilter(t)}
                      style={{
                        ...styles.tab,
                        color: filter === t ? "var(--accent-purple)" : "var(--text-secondary)",
                        background: filter === t ? "rgba(139,92,246,0.08)" : "transparent",
                        borderColor: filter === t ? "rgba(139,92,246,0.3)" : "transparent"
                      }}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredRooms.length === 0 ? (
              <div style={styles.emptyState}>
                <Code2 size={24} color="var(--text-muted)" />
                <p style={styles.emptyText}>No creations found matching the criteria.</p>
              </div>
            ) : (
              <div style={styles.creationsGrid}>
                {filteredRooms.map((room, i) => {
                  const color = LANG_COLORS[room.language] || "#00e5ff";
                  const label = LANG_LABELS[room.language] || room.language;
                  return (
                    <motion.div
                      key={room.id}
                      style={styles.roomCard}
                      whileHover={{ y: -4, borderColor: "var(--border-bright)", boxShadow: `0 8px 24px ${color}08` }}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => navigate(`/room/${room.id}`)}
                    >
                      <div style={{ ...styles.roomAccent, background: color }} />
                      <div style={styles.roomCardTop}>
                        <span style={{ ...styles.langBadge, background: `${color}15`, color, border: `1px solid ${color}30` }}>
                          {label}
                        </span>
                        <span style={{
                          ...styles.roleBadge,
                          background: room.myRole === 'owner' ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.06)',
                          color: room.myRole === 'owner' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                        }}>
                          {room.myRole}
                        </span>
                      </div>
                      <h3 style={styles.roomName}>{room.name}</h3>
                      <div style={styles.roomMeta}>
                        <span style={styles.metaItem}>
                          <Clock size={11} />
                          {timeAgo(room.updatedAt)}
                        </span>
                      </div>
                      <div style={styles.roomCardFooter}>
                        <span style={styles.roomId}>
                          <Hash size={10} />
                          {room.id.slice(0, 8)}...
                        </span>
                        <span style={styles.openLink}>
                          Enter Room <ArrowRight size={12} />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Stats & Languages */}
          <div style={styles.rightCol}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Stats Overview</h2>
            </div>

            {/* Quick Stats Grid */}
            <div style={styles.statsCardGrid}>
              <div style={styles.statBox}>
                <span style={styles.statLabel}>Creations</span>
                <span style={styles.statValue}>{stats.totalRooms}</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statLabel}>Owned</span>
                <span style={styles.statValue}>
                  {rooms.filter((r) => r.myRole === "owner").length}
                </span>
              </div>
            </div>

            {/* Language Breakdown */}
            <div style={styles.statsPanel}>
              <h3 style={styles.panelTitle}>Language Breakdown</h3>
              {languagesList.length === 0 ? (
                <p style={styles.emptyText}>No coding data available yet.</p>
              ) : (
                <div style={styles.langList}>
                  {languagesList.map(({ lang, count, percentage }) => {
                    const color = LANG_COLORS[lang] || "#00e5ff";
                    return (
                      <div key={lang} style={styles.langItem}>
                        <div style={styles.langItemHeader}>
                          <span style={styles.langName}>
                            <span style={{ ...styles.langDot, background: color }} />
                            {LANG_LABELS[lang] || lang}
                          </span>
                          <span style={styles.langCount}>
                            {count} room{count !== 1 ? "s" : ""} ({percentage}%)
                          </span>
                        </div>
                        <div style={styles.progressBarBg}>
                          <div style={{ ...styles.progressBarFill, width: `${percentage}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEdit && (
          <EditProfileModal
            user={profileUser}
            onClose={() => setShowEdit(false)}
            onUpdated={handleProfileUpdated}
            token={token}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Styles
const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
  },
  nav: {
    position: "sticky", top: 0, zIndex: 50,
    background: "rgba(0,0,0,0.9)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid var(--border)",
  },
  navInner: {
    width: "100%",
    padding: "0 40px", height: 60,
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    display: "flex", alignItems: "center", gap: 6,
    textDecoration: "none", color: "var(--text-secondary)",
    fontSize: "13px", fontWeight: 500,
    transition: "color 0.2s",
  },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoText: {
    fontFamily: "var(--font-display)",
    fontWeight: 700, fontSize: "18px",
  },
  main: {
    maxWidth: 1200, margin: "0 auto",
    padding: "40px 24px",
  },
  profileCard: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "36px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
    marginBottom: 40,
  },
  profileTop: {
    display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap",
  },
  avatarBig: {
    width: 96, height: 96, borderRadius: "50%",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-bright)",
    display: "flex", alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  avatarRing: {
    position: "absolute", inset: -4, borderRadius: "50%",
    border: "2px solid rgba(139,92,246,0.25)",
  },
  presetCell: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: 'center',
    cursor: "pointer",
    transition: "transform 0.15s ease",
    outline: "none",
  },
  profileMeta: { flex: 1 },
  usernameRow: {
    display: "flex", alignItems: "center", gap: 16, marginBottom: 8, flexWrap: "wrap",
  },
  username: {
    fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-display)",
  },
  editBtn: {
    display: "flex", alignItems: "center", gap: 6,
    background: "var(--bg-elevated)", border: "1px solid var(--border)",
    borderRadius: "20px", padding: "6px 14px", color: "var(--text-primary)",
    fontSize: "12px", fontWeight: 600, cursor: "pointer",
    transition: "all 0.2s ease",
  },
  tagline: {
    fontSize: "15px", color: "var(--text-secondary)", marginBottom: 16,
  },
  metaGrid: { display: "flex", gap: 12, flexWrap: "wrap" },
  metaPill: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: "12px", color: "var(--text-secondary)",
    background: "var(--bg-elevated)", border: "1px solid var(--border)",
    borderRadius: "20px", padding: "4px 12px",
  },
  bioSection: { display: "flex", flexDirection: "column", gap: 8 },
  bioTitle: {
    fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)",
    textTransform: "uppercase", letterSpacing: "0.05em",
  },
  bioText: { fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6 },
  
  leftCol: {},
  rightCol: {},
  sectionHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 20, flexWrap: "wrap", gap: 12,
  },
  sectionTitle: {
    fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-display)",
  },
  filterBar: { display: "flex", alignItems: "center", gap: 12 },
  searchWrap: {
    position: "relative",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    height: 32, display: "flex", alignItems: "center",
  },
  searchIcon: { position: "absolute", left: 10, color: "var(--text-muted)" },
  searchInput: {
    background: "transparent", border: "none", outline: "none",
    color: "var(--text-primary)", fontSize: "12px", paddingLeft: 30, paddingRight: 10,
    width: 160,
  },
  tabs: {
    display: "flex", background: "var(--bg-card)",
    border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
    padding: 2,
  },
  tab: {
    border: "1px solid transparent", background: "none",
    padding: "4px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: 600,
    cursor: "pointer", transition: "all 0.2s",
  },
  creationsGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 16,
  },
  roomCard: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)", padding: "16px", cursor: "pointer",
    position: "relative", overflow: "hidden", transition: "all 0.2s ease",
  },
  roomAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 2 },
  roomCardTop: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12,
  },
  langBadge: {
    padding: "2px 6px", borderRadius: 4, fontSize: "10px", fontWeight: 700,
    fontFamily: "var(--font-mono)",
  },
  roleBadge: {
    padding: "2px 6px", borderRadius: 4, fontSize: "10px", fontWeight: 600,
    fontFamily: "var(--font-mono)", textTransform: "uppercase",
  },
  roomName: {
    fontSize: "14px", fontWeight: 700, marginBottom: 8, color: "var(--text-primary)",
    fontFamily: "var(--font-display)",
  },
  roomMeta: { display: "flex", gap: 10, marginBottom: 12 },
  metaItem: {
    display: "flex", alignItems: "center", gap: 4, fontSize: "11px", color: "var(--text-secondary)",
  },
  roomCardFooter: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    paddingTop: 10, borderTop: "1px solid var(--border)",
  },
  roomId: {
    display: "flex", alignItems: "center", gap: 2, fontFamily: "var(--font-mono)",
    fontSize: "10px", color: "var(--text-muted)",
  },
  openLink: {
    display: "flex", alignItems: "center", gap: 4, fontSize: "11px", fontWeight: 600,
    color: "var(--accent-cyan)",
  },
  
  statsCardGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20,
  },
  statBox: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)", padding: "16px 20px",
    display: "flex", flexDirection: "column", gap: 4,
  },
  statLabel: { fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" },
  statValue: { fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-display)" },
  
  statsPanel: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)", padding: "20px",
  },
  panelTitle: {
    fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)",
    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16,
  },
  langList: { display: "flex", flexDirection: "column", gap: 14 },
  langItem: { display: "flex", flexDirection: "column", gap: 6 },
  langItemHeader: { display: "flex", justifyContent: "space-between", fontSize: "12px" },
  langName: { display: "flex", alignItems: "center", gap: 6, fontWeight: 600 },
  langDot: { width: 8, height: 8, borderRadius: "50%" },
  langCount: { color: "var(--text-secondary)" },
  progressBarBg: { height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 2 },
  
  loadingWrap: {
    minHeight: "100vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", background: "#050505",
  },
  stillLoaderInner: {
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  stillLoaderText: {
    fontSize: "15px", fontWeight: 600, color: "var(--text-secondary)",
    fontFamily: "var(--font-display)",
  },
  emptyState: {
    background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
    padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
    textAlign: "center",
  },
  emptyText: { fontSize: "13px", color: "var(--text-secondary)" },

  // Modals Styles
  overlay: {
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
  },
  modal: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", width: "100%", maxWidth: 440,
    boxShadow: "0 32px 80px rgba(0,0,0,0.6)", overflow: "hidden",
  },
  modalHeader: { padding: "20px 24px 0" },
  modalTitle: { fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-display)" },
  modalBody: { padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 16 },
  modalFooter: { display: "flex", gap: 10, marginTop: 8 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" },
  errorBanner: {
    display: "flex", alignItems: "center", gap: 8, background: "rgba(255,77,77,0.1)",
    border: "1px solid rgba(255,77,77,0.2)", borderRadius: "var(--radius-sm)",
    padding: "8px 12px", fontSize: "12px", color: "#ff4d4d",
  },
};

export default ProfilePage;
