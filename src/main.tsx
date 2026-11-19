import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import App from "./App";
import { AuthProvider, SettingsProvider } from "./lib/state";
import "./index.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider
      client={
        new QueryClient({
          queryCache: new QueryCache({
            onError: (error) =>
              window.dispatchEvent(
                new CustomEvent("bestin-error", { detail: error.message }),
              ),
          }),
        })
      }
    >
      <BrowserRouter>
        <SettingsProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SettingsProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
