import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { OfflineBanner } from "./components/OfflineBanner";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import BowlerRegistration from "./pages/BowlerRegistration";
import TeamCaptain from "./pages/TeamCaptain";
import DoormanCheckIn from "./pages/DoormanCheckIn";
import BowlerProfile from "./pages/BowlerProfile";
import ImportData from "./pages/ImportData";
import ProgramDirector from "./pages/ProgramDirector";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/register" component={BowlerRegistration} />
      <Route path="/captain" component={TeamCaptain} />
      <Route path="/doorman" component={DoormanCheckIn} />
      <Route path="/bowler/:id" component={BowlerProfile} />
      <Route path="/import" component={ImportData} />
      <Route path="/program-director" component={ProgramDirector} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <OfflineBanner />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
