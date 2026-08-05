import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const ThemeContext = createContext(null);

/**
 * Theme scaffolding.
 *
 * The Figma designs ship a single light theme, so `light` is the only value in
 * use today — this provider exists so adding a dark palette later is a CSS
 * change plus one extra option, not a refactor.
 */
export const ThemeProvider = ({ children, defaultTheme = 'light' }) => {
  const [theme, setTheme] = useLocalStorage('alotel.theme', defaultTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((current) => (current === 'light' ? 'dark' : 'light')),
    [setTheme],
  );

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within <ThemeProvider>');
  return context;
};
