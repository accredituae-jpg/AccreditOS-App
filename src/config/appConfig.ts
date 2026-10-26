export const appConfig = {
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:5000",
  enableRoleSwitcher:
    import.meta.env.DEV && import.meta.env.VITE_ENABLE_ROLE_SWITCHER === "true",
};
