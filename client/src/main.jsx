import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#111820",
            color: "#e6edf3",
            border: "1px solid #21262d",
            fontFamily: "'Inter', sans-serif",
            fontSize: "14px",
          },
          success: {
            iconTheme: { primary: "#00ff9d", secondary: "#080c10" },
          },
          error: {
            iconTheme: { primary: "#ff4d4d", secondary: "#080c10" },
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
);
