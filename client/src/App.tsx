import { useEffect } from 'react'
import Lenis from 'lenis'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './lib/auth-context'
import { registerLenis, scrollToId, scrollToTop } from './lib/scroll'
import { Navbar } from './components/landing/navbar'
import { AppLayout } from './components/layout/app-layout'
import { LandingPage } from './pages/landing-page'
import { LoginPage } from './pages/auth/login'
import { SignupPage } from './pages/auth/signup'
import { ConsentPage } from './pages/auth/consent'
import { DashboardPage } from './pages/app/dashboard'
import { PracticePage } from './pages/app/practice'
import { ProfessionalIntroductionPage } from './pages/app/professional-introduction'
import { ReadAloudPage } from './pages/app/read-aloud'
import { SituationalQuestionsPage } from './pages/app/situational-questions'
import { ExtemporePage } from './pages/app/extempore'
import { PronunciationPage } from './pages/app/pronunciation'
import { RapidFirePage } from './pages/app/rapid-fire'
import { ResultPage } from './pages/app/result'
import { ProgressPage } from './pages/app/progress'
import { HistoryPage } from './pages/app/history'
import { SettingsPage } from './pages/app/settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

function AppRoutes() {
  const location = useLocation()
  const reduce = useReducedMotion()
  const isAppRoute = location.pathname.startsWith('/app')

  useEffect(() => {
    if (isAppRoute || reduce) {
      registerLenis(null)
      return
    }

    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.05,
      anchors: { offset: -88 },
    })
    registerLenis(lenis)
    return () => {
      lenis.destroy()
      registerLenis(null)
    }
  }, [isAppRoute, reduce])

  useEffect(() => {
    if (isAppRoute) return
    const id = location.hash.replace('#', '')
    const frame = requestAnimationFrame(() => {
      if (id) scrollToId(id)
      else scrollToTop()
    })
    return () => cancelAnimationFrame(frame)
  }, [location.pathname, location.hash, isAppRoute])

  useEffect(() => {
    if (location.pathname === '/sign-in') {
      document.title = 'Sign in · PrepHelp'
    } else if (location.pathname === '/get-started') {
      document.title = 'Get started · PrepHelp'
    } else if (location.pathname === '/consent') {
      document.title = 'Audio Privacy & Consent · PrepHelp'
    } else if (location.pathname.startsWith('/app/dashboard')) {
      document.title = 'Dashboard · PrepHelp'
    } else if (location.pathname.startsWith('/app/practice')) {
      document.title = 'Practice Speech · PrepHelp'
    } else if (location.pathname.startsWith('/app/exercise/situational-questions')) {
      document.title = 'Situational Questions · PrepHelp'
    } else if (location.pathname.startsWith('/app/exercise/professional-introduction')) {
      document.title = 'Professional Introduction · PrepHelp'
    } else if (location.pathname.startsWith('/app/exercise/read-aloud')) {
      document.title = 'Read Aloud · PrepHelp'
    } else if (location.pathname.startsWith('/app/exercise/extempore')) {
      document.title = 'Extempore Practice · PrepHelp'
    } else if (location.pathname.startsWith('/app/exercise/pronunciation')) {
      document.title = 'Pronunciation Drill · PrepHelp'
    } else if (location.pathname.startsWith('/app/exercise/rapid-fire')) {
      document.title = 'Interview Rapid Fire · PrepHelp'
    } else if (location.pathname.startsWith('/app/result')) {
      document.title = 'Speech Analysis Report · PrepHelp'
    } else if (location.pathname.startsWith('/app/progress')) {
      document.title = 'Progress & Trends · PrepHelp'
    } else if (location.pathname.startsWith('/app/history')) {
      document.title = 'Practice History · PrepHelp'
    } else if (location.pathname.startsWith('/app/settings')) {
      document.title = 'Settings · PrepHelp'
    } else {
      document.title = 'PrepHelp — Practice speaking. See measurable progress.'
    }
  }, [location.pathname])

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:shadow-card focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Skip to content
      </a>

      {/* Landing Navbar only on public non-app routes */}
      {!isAppRoute && <Navbar />}

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1"
        >
          <Routes location={location}>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/sign-in" element={<LoginPage />} />
            <Route path="/get-started" element={<SignupPage />} />
            <Route path="/consent" element={<ConsentPage />} />

            {/* Authenticated / App routes wrapped in AppLayout */}
            <Route
              path="/app"
              element={<Navigate to="/app/dashboard" replace />}
            />
            <Route
              path="/app/dashboard"
              element={
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              }
            />
            <Route
              path="/app/practice"
              element={
                <AppLayout>
                  <PracticePage />
                </AppLayout>
              }
            />
            <Route
              path="/app/practice/:exerciseId"
              element={
                <AppLayout>
                  <PracticePage />
                </AppLayout>
              }
            />
            {/* ── Dedicated exercise routes ── */}
            <Route
              path="/app/exercise/situational-questions"
              element={
                <AppLayout>
                  <SituationalQuestionsPage />
                </AppLayout>
              }
            />
            <Route
              path="/app/exercise/professional-introduction"
              element={
                <AppLayout>
                  <ProfessionalIntroductionPage />
                </AppLayout>
              }
            />
            <Route
              path="/app/exercise/professional-introduction/:exerciseId"
              element={
                <AppLayout>
                  <ProfessionalIntroductionPage />
                </AppLayout>
              }
            />
            <Route
              path="/app/exercise/read-aloud"
              element={
                <AppLayout>
                  <ReadAloudPage />
                </AppLayout>
              }
            />
            <Route
              path="/app/exercise/read-aloud/:exerciseId"
              element={
                <AppLayout>
                  <ReadAloudPage />
                </AppLayout>
              }
            />
            <Route
              path="/app/exercise/extempore"
              element={
                <AppLayout>
                  <ExtemporePage />
                </AppLayout>
              }
            />
            <Route
              path="/app/exercise/pronunciation"
              element={
                <AppLayout>
                  <PronunciationPage />
                </AppLayout>
              }
            />
            <Route
              path="/app/exercise/rapid-fire"
              element={
                <AppLayout>
                  <RapidFirePage />
                </AppLayout>
              }
            />
            <Route
              path="/app/exercise/rapid-fire/:sessionId"
              element={
                <AppLayout>
                  <RapidFirePage />
                </AppLayout>
              }
            />
            <Route
              path="/app/result/:sessionId"
              element={
                <AppLayout>
                  <ResultPage />
                </AppLayout>
              }
            />
            <Route
              path="/app/progress"
              element={
                <AppLayout>
                  <ProgressPage />
                </AppLayout>
              }
            />
            <Route
              path="/app/history"
              element={
                <AppLayout>
                  <HistoryPage />
                </AppLayout>
              }
            />
            <Route
              path="/app/settings"
              element={
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              }
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </QueryClientProvider>
  )
}
