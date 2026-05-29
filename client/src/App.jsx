import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import EditorRoom from "./pages/EditorRoom";
import OAuthCallback from "./pages/OAuthCallback";

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/oauth-callback" element={<OAuthCallback />} />
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/room/:roomId"
      element={
        <ProtectedRoute>
          <EditorRoom />
        </ProtectedRoute>
      }
    />
  </Routes>
);

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <div className="noise">
        <AppRoutes />
      </div>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
