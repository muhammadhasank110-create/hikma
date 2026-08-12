import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Link, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProfileProvider, useProfile } from "./contexts/ProfileContext";
import { SpeechProvider } from "./contexts/SpeechContext";
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
import ECCAreaPage from "./pages/ECCAreaPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import CurriculumPage from "@/pages/CurriculumPage";
import ClassJoinPage from "@/pages/ClassJoinPage";
import GuardianDashboard from "@/pages/GuardianDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ExamSkillsPage from "./pages/ExamSkillsPage";
import TopicsPage from "./pages/TopicsPage";
import CheckPage from "./pages/CheckPage";
import SignUpPage from "./pages/SignUpPage";
import SignInPage from "./pages/SignInPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import { VoiceCommandOverlay } from "./components/VoiceCommandOverlay";
import { useAccessibilityProfile } from "./hooks/useAccessibilityProfile";
import { useAuth } from "@/_core/hooks/useAuth";

function AccessibilityProfileManager() {
  useAccessibilityProfile();
  return null;
}

function AccessBoundary({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  const { locale } = useProfile();
  const isArabic = locale === "ar";

  if (loading) {
    return <div className="grid min-h-[50vh] place-items-center" role="status" aria-live="polite">{isArabic ? "جارٍ تحميل حسابك…" : "Loading your account…"}</div>;
  }

  if (!user) {
    return (
      <section className="mx-auto grid min-h-[50vh] max-w-lg place-items-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">{isArabic ? "سجّل الدخول للمتابعة" : "Sign in to continue"}</h1>
          <p className="mt-2 text-muted-foreground">{isArabic ? "يلزم تسجيل الدخول للوصول إلى مساحة التعلّم الخاصة بك." : "You need to sign in to access your learning space."}</p>
          <Button asChild className="mt-5"><Link href="/signin">{isArabic ? "تسجيل الدخول" : "Sign in"}</Link></Button>
        </div>
      </section>
    );
  }

  if (roles && !roles.includes(user.role ?? "learner")) {
    return (
      <section className="mx-auto grid min-h-[50vh] max-w-lg place-items-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">{isArabic ? "لا تملك صلاحية الوصول" : "You do not have access"}</h1>
          <p className="mt-2 text-muted-foreground">{isArabic ? "هذه المنطقة متاحة للحسابات المصرّح لها فقط." : "This area is available only to authorised account roles."}</p>
          <Button asChild className="mt-5"><Link href="/dashboard">{isArabic ? "العودة إلى الرئيسية" : "Return home"}</Link></Button>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/signup" component={SignUpPage} />
      <Route path="/signin" component={SignInPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route>
        <AccessBoundary>
          <AppShell>
            <Switch>
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
              <Route path="/ecc/:areaId" component={ECCAreaPage} />
              <Route path="/teacher">{() => <AccessBoundary roles={["teacher", "admin"]}><TeacherDashboard /></AccessBoundary>}</Route>
              <Route path="/guardian">{() => <AccessBoundary roles={["guardian", "admin"]}><GuardianDashboard /></AccessBoundary>}</Route>
              <Route path="/admin">{() => <AccessBoundary roles={["admin"]}><AdminDashboard /></AccessBoundary>}</Route>
              <Route path="/exam-skills" component={ExamSkillsPage} />
              <Route path="/check/:lessonId" component={CheckPage} />
              <Route path="/curriculum" component={CurriculumPage} />
              <Route path="/class/join" component={ClassJoinPage} />
              <Route path="/404" component={NotFound} />
              <Route component={NotFound} />
            </Switch>
            <VoiceCommandOverlay />
            <AccessibilityProfileManager />
          </AppShell>
        </AccessBoundary>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system">
        <ProfileProvider>
          <SpeechProvider>
            <KeyboardProvider>
              <AriaLiveProvider>
                <TooltipProvider>
                  <Toaster richColors position="top-center" />
                  <Router />
                </TooltipProvider>
              </AriaLiveProvider>
            </KeyboardProvider>
          </SpeechProvider>
        </ProfileProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
