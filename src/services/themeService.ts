export type ThemeMode = "dark" | "light";

const THEME_KEY = "theme";

export const getStoredTheme = (): ThemeMode => {
  const savedTheme = localStorage.getItem(THEME_KEY);

  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return "light";
};

export const applyTheme = (theme: ThemeMode) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(THEME_KEY, theme);
};

export const initializeTheme = () => {
  applyTheme(getStoredTheme());
};
