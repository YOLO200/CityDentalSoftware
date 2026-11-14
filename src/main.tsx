
  import { createRoot } from "react-dom/client";
  import { initSentry } from "./lib/sentry";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // Before render, so errors during the first paint are caught too.
  initSentry();

  createRoot(document.getElementById("root")!).render(<App />);
  