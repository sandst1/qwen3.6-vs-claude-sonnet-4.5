import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
// Importing the plugin entry registers all built-in widget types.
// Keep this import above the app render; the registry must be populated first.
import "./plugins";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
