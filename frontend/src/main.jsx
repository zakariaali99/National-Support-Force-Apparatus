import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { DirectionProvider } from "@radix-ui/react-direction";
import { QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App.jsx";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { TooltipProvider } from "./components/ui/Tooltip";
import { AuthProvider } from "./features/auth/AuthContext";
import "./index.css";
import { queryClient } from "./lib/queryClient";

// Data router (createBrowserRouter) rather than <BrowserRouter>: useBlocker and
// friends in the navigational guard on MemberForm require a data router.
const router = createBrowserRouter([{ path: "*", element: <App /> }]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DirectionProvider dir="rtl">
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={300} skipDelayDuration={200}>
            <AuthProvider>
              <RouterProvider router={router} />
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </DirectionProvider>
  </StrictMode>
);
