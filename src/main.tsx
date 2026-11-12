import { createRoot } from "react-dom/client";
import { MotionConfig } from "framer-motion";
import App from "./app/App";
import { LanguageProvider } from "./app/context/LanguageContext";
import "./styles/index.css";
import "./styles/portfolio.css";

createRoot(document.getElementById("root")!).render(
  <MotionConfig reducedMotion="user">
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </MotionConfig>,
);
