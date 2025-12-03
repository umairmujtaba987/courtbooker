import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, setRedirectCallback, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Home from "@/pages/home";
import Availability from "@/pages/availability";
import Dashboard from "@/pages/dashboard";
import Bookings from "@/pages/bookings";
import CreateBooking from "@/pages/create-booking";
import AdminLogin from "@/pages/admin-login";
import NotFound from "@/pages/not-found";

interface AuthUser {
  id: string;
  username: string;
}

function LoginRedirectPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/");
  }, [setLocation]);

  return null;
}

function Router({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <Switch>
      <Route path="/admin" component={isAuthenticated ? LoginRedirectPage : AdminLogin} />
      <Route path="/" component={() => <Home isAuthenticated={isAuthenticated} />} />
      <Route path="/availability" component={Availability} />
      <Route path="/bookings/create" component={CreateBooking} />
      {isAuthenticated && <Route path="/dashboard" component={Dashboard} />}
      {isAuthenticated && <Route path="/bookings" component={Bookings} />}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent({ isAuthenticated, onLogout }: { isAuthenticated: boolean; onLogout: () => void }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (!isAuthenticated) {
    return (
      <TooltipProvider>
        <Router isAuthenticated={isAuthenticated} />
        <Toaster />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex min-h-screen w-full">
          <AppSidebar onLogout={onLogout} />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sticky top-0 z-50">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onLogout}
                  data-testid="button-logout"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <Router isAuthenticated={isAuthenticated} />
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  );
}

function AppWithAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: authUser, isError: authError } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      setIsAuthenticated(false);
      setIsLoggingOut(true);
      queryClient.clear();
      setLocation("/admin");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleSessionExpired = () => {
    if (isLoggingOut) return;
    setIsAuthenticated(false);
    setLocation("/admin");
    queryClient.clear();
    toast({
      title: "Session expired",
      description: "Your session has expired. Please log in again.",
      variant: "destructive",
    });
  };

  useEffect(() => {
    setRedirectCallback(handleSessionExpired);
  }, [isLoggingOut]);

  useEffect(() => {
    if (authUser) {
      setIsAuthenticated(true);
    } else if (authError) {
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, [authUser, authError]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <AppContent isAuthenticated={isAuthenticated} onLogout={handleLogout} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppWithAuth />
    </QueryClientProvider>
  );
}

export default App;
