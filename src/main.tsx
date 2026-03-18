import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/variables.css";
import "./index.css";
import App from "./App.tsx";
import { registerServiceWorker } from "./services/serviceWorker";

// Register service worker for offline support
if (import.meta.env.PROD) {
  registerServiceWorker({
    onUpdateAvailable: () => {
      console.log("[App] New version available. Please refresh the page.");
    },
    onUpdateInstalled: () => {
      console.log("[App] App is ready for offline use.");
    },
    onError: (error) => {
      console.error("[App] Service worker error:", error);
    },
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
