import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import { KeyboardProvider } from "./contexts/KeyboardContext";
import { AriaLiveProvider } from "./contexts/AriaLiveContext";
import AppShell from "./components/AppShell";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import SubjectPage from "./pages/SubjectPage";
import LessonPage from "./pages/LessonPage";
import TutorPage from "./pages/TutorPage";
import ProgressPage from "./pages/ProgressPage";
import SettingsPage from "./pages/SettingsPage";
import ShortcutsPage from "./pages/ShortcutsPage";
import ECCPage from "./pages/ECCPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import GuardianDashboard from "./pages/GuardianDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ExamSkillsPage from "./pages/ExamSkillsPage";
import TopicsPage from "./pages/TopicsPage";
import CheckPage from "./pages/CheckPage";

function Router() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/subjects/:curriculumId" component={SubjectPage} />
        <Route path="/subjects/:curriculumId/topics/:subjectId" component={TopicsPage} />
        <Route path="/lesson/:lessonId" component={LessonPage} />
        <Route path="/tutor" component={TutorPage} />
        <Route path="/tutor/:lessonId" component={TutorPage} />
        <Route path="/progress" component={ProgressPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/shortcuts" component={ShortcutsPage} />
        <Route path="/ecc" component={ECCPage} />
        <Route path="/teacher" component={TeacherDashboard} />
        <Route path="/guardian" component={GuardianDashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/exam-skills" component={ExamSkillsPage} />
        <Route path="/check/:lessonId" component={CheckPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <ProfileProvider>
          <KeyboardProvider>
            <AriaLiveProvider>
              <TooltipProvider>
                <Toaster richColors position="top-center" />
                <Router />
              </TooltipProvider>
            </AriaLiveProvider>
          </KeyboardProvider>
        </ProfileProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
