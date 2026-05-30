/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect } from "react";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const theme = "dark";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light");
    localStorage.setItem("theme", "dark");
  }, []);

  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
