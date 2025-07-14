// src/main.tsx
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store";
import "./index.css";
import App from "./App";

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>
  );
} else {
  console.error("Root element not found");
}
