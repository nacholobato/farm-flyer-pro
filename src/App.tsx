import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useUserOrganizationId } from "@/hooks/useOrganization";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingPage } from "@/components/ui/loading-spinner";

// Pages
import AuthPage from "@/pages/Auth";
import OrganizationSetup from "@/pages/OrganizationSetup";
import Dashboard from "@/pages/Dashboard";
import ClientsList from "@/pages/clients/ClientsList";
import ClientDetail from "@/pages/clients/ClientDetail";
import FarmsList from "@/pages/farms/FarmsList";
import JobsList from "@/pages/jobs/JobsList";
import JobCreate from "@/pages/jobs/JobCreate";
import JobDetail from "@/pages/jobs/JobDetail";
import ProfilePage from "@/pages/Profile";
import Resources from "@/pages/Resources";
import CalculatorPage from "@/pages/tools/CalculatorPage";
import AgrochemicalsCatalog from "@/pages/catalog/AgrochemicalsCatalog";
import WorkTeamList from "@/pages/operations/WorkTeamList";
import DronesList from "@/pages/operations/DronesList";
import GeneratorsList from "@/pages/operations/GeneratorsList";
import AttendanceList from "@/pages/operations/AttendanceList";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { data: organizationId, isLoading: orgLoading } = useUserOrganizationId();

  if (loading || orgLoading) {
    return <LoadingPage />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // User is logged in but has no organization - redirect to setup
  if (!organizationId) {
    return <Navigate to="/organization-setup" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

function OrganizationSetupRoute() {
  const { user, loading } = useAuth();
  const { data: organizationId, isLoading: orgLoading } = useUserOrganizationId();

  if (loading || orgLoading) {
    return <LoadingPage />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Already has organization, go to dashboard
  if (organizationId) {
    return <Navigate to="/" replace />;
  }

  return <OrganizationSetup />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/organization-setup" element={<OrganizationSetupRoute />} />

      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      <Route path="/clients" element={<ProtectedRoute><ClientsList /></ProtectedRoute>} />
      <Route path="/clients/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />

      <Route path="/farms" element={<ProtectedRoute><FarmsList /></ProtectedRoute>} />

      <Route path="/jobs" element={<ProtectedRoute><JobsList /></ProtectedRoute>} />
      <Route path="/jobs/new" element={<ProtectedRoute><JobCreate /></ProtectedRoute>} />
      <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />

      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />

      <Route path="/tools/calculator" element={<ProtectedRoute><CalculatorPage /></ProtectedRoute>} />
      <Route path="/catalog" element={<ProtectedRoute><AgrochemicalsCatalog /></ProtectedRoute>} />

      <Route path="/operations/team" element={<ProtectedRoute><WorkTeamList /></ProtectedRoute>} />
      <Route path="/operations/drones" element={<ProtectedRoute><DronesList /></ProtectedRoute>} />
      <Route path="/operations/generators" element={<ProtectedRoute><GeneratorsList /></ProtectedRoute>} />
      <Route path="/operations/attendance" element={<ProtectedRoute><AttendanceList /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
