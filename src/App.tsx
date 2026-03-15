import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AppShell from "./pages/AppShell";
import { AuthPage } from "@/components/auth/AuthPage";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import NotFound from "./pages/NotFound";
import { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

// Lazy-load each page
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ProdukPage = lazy(() => import("./pages/ProdukPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const MonitoringSalesPage = lazy(() => import("./pages/MonitoringSalesPage"));
const AkunPage = lazy(() => import("./pages/AkunPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache 5 menit — kurangi request berulang dan hemat data
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function PageLoader() {
  return <LoadingScreen />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner
          position="top-center"
          duration={4000}
          richColors
          expand
          toastOptions={{
            classNames: {
              error: 'bg-red-600 text-white border-red-700 shadow-2xl shadow-red-300 font-bold text-sm',
              success: 'bg-emerald-600 text-white border-emerald-700 font-bold text-sm',
              warning: 'bg-amber-500 text-white border-amber-600 font-bold text-sm',
              info: 'bg-slate-800 text-white border-slate-700 font-bold text-sm',
              title: 'font-extrabold text-base',
              description: 'font-medium opacity-90',
            },
          }}
        />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/reset-password" element={
              <Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense>
            } />

            <Route element={<AdminProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={
                  <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>
                } />
                <Route path="products" element={
                  <Suspense fallback={<PageLoader />}><ProdukPage /></Suspense>
                } />
                <Route path="monitoring" element={
                  <Suspense fallback={<PageLoader />}><MonitoringSalesPage /></Suspense>
                } />
                <Route path="users" element={
                  <Suspense fallback={<PageLoader />}><UsersPage /></Suspense>
                } />
                <Route path="settings" element={
                  <Suspense fallback={<PageLoader />}><AkunPage /></Suspense>
                } />
              </Route>
            </Route>

            {/* Redirect unknown routes ke home */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
