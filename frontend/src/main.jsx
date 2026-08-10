import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { DirectionProvider } from "@radix-ui/react-direction";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { TooltipProvider } from "./components/ui/Tooltip";
import { AuthProvider } from "./features/auth/AuthContext";
import "./index.css";
import { queryClient } from "./lib/queryClient";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DirectionProvider dir="rtl">
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          {/* One shared TooltipProvider for the whole app: Radix needs it in
              the tree, and a single instance is what lets a tooltip open
              immediately when moving between adjacent triggers instead of
              re-waiting the open delay each time. */}
          <TooltipProvider delayDuration={300} skipDelayDuration={200}>
            <BrowserRouter>
              <AuthProvider>
                <App />
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </DirectionProvider>
  </StrictMode>
);
