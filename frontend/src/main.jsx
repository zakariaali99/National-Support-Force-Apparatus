import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { DirectionProvider } from "@radix-ui/react-direction";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { AuthProvider } from "./features/auth/AuthContext";
import "./index.css";
import { queryClient } from "./lib/queryClient";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DirectionProvider dir="rtl">
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </DirectionProvider>
  </StrictMode>
);
