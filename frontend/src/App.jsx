import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from './features/auth/ProtectedRoute.jsx';
import { WizardLayout } from './layouts/WizardLayout.jsx';
import { PageLoader } from './components/ui/PageLoader.jsx';

const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const LoginPage = lazy(() => import('./features/auth/LoginPage.jsx'));
const SignupPage = lazy(() => import('./features/auth/SignupPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./features/auth/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./features/auth/ResetPasswordPage.jsx'));
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage.jsx'));
const BasicsPage = lazy(() => import('./features/planner/BasicsPage.jsx'));
const TransportPage = lazy(() => import('./features/planner/TransportPage.jsx'));
const BookingPage = lazy(() => import('./features/planner/BookingPage.jsx'));
const StayPage = lazy(() => import('./features/planner/StayPage.jsx'));
const DiscoverPage = lazy(() => import('./features/planner/DiscoverPage.jsx'));
const SelectPage = lazy(() => import('./features/planner/SelectPage.jsx'));
const OptimizePage = lazy(() => import('./features/planner/OptimizePage.jsx'));
const ReviewPage = lazy(() => import('./features/planner/ReviewPage.jsx'));
const NewTripRedirect = lazy(() => import('./features/planner/NewTripRedirect.jsx'));
const TripOverviewPage = lazy(() => import('./features/trips/TripOverviewPage.jsx'));
const TripsPage = lazy(() => import('./features/trips/TripsPage.jsx'));
const ActiveTripPage = lazy(() => import('./features/live-trip/ActiveTripPage.jsx'));
const ExpensesPage = lazy(() => import('./features/expenses/ExpensesPage.jsx'));
const ExpensesHubPage = lazy(() => import('./features/expenses/ExpensesHubPage.jsx'));
const ExplorePage = lazy(() => import('./features/explore/ExplorePage.jsx'));
const ConciergePage = lazy(() => import('./features/payments/ConciergePage.jsx'));
const CopilotPage = lazy(() => import('./features/copilot/CopilotPage.jsx'));
const TripSummaryPage = lazy(() => import('./features/trips/TripSummaryPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const StaticInfoPage = lazy(() => import('./pages/StaticInfoPage.jsx'));

function EditTripRedirect() {
  const { tripId } = useParams();
  return <Navigate to={`/trips/new/basics?tripId=${tripId}`} replace />;
}

function LiveTripRedirect() {
  const { tripId } = useParams();
  return <Navigate to={`/trips/${tripId}/active`} replace />;
}

function MapTripRedirect() {
  const { tripId } = useParams();
  return <Navigate to={`/trips/${tripId}/active/map`} replace />;
}

function ItineraryTripRedirect() {
  const { tripId } = useParams();
  return <Navigate to={`/trips/${tripId}#itinerary`} replace />;
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/oauth/google/callback" element={<Navigate to="/login" replace />} />

        <Route
          path="/about"
          element={
            <StaticInfoPage title="About YOLO">
              <p>
                YOLO is an AI-native travel companion that helps you plan trips, live them with a
                real-time cockpit, and reflect with summaries and expense intelligence.
              </p>
            </StaticInfoPage>
          }
        />
        <Route
          path="/contact"
          element={
            <StaticInfoPage title="Contact">
              <p>Reach the YOLO team at support@yolo.travel for product questions and partnership.</p>
            </StaticInfoPage>
          }
        />
        <Route
          path="/privacy"
          element={
            <StaticInfoPage title="Privacy Policy">
              <p>
                YOLO stores account, trip, and preference data to provide planning and live-trip
                features. Session cookies are httpOnly. Passwords are hashed. We do not sell personal
                travel data.
              </p>
            </StaticInfoPage>
          }
        />
        <Route
          path="/terms"
          element={
            <StaticInfoPage title="Terms of Service">
              <p>
                YOLO provides planning and organization tooling. External booking providers may handle
                actual reservations. Test payments do not create real bookings.
              </p>
            </StaticInfoPage>
          }
        />
        <Route
          path="/help"
          element={
            <StaticInfoPage title="Help Center">
              <p>
                Start from the dashboard, plan a trip, optimize your itinerary, then tap Start Trip
                when you are ready to go live.
              </p>
            </StaticInfoPage>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/trips"
          element={
            <ProtectedRoute>
              <TripsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <ExpensesHubPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <ExplorePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/trips/new"
          element={
            <ProtectedRoute>
              <NewTripRedirect />
            </ProtectedRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <WizardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/trips/new/basics" element={<BasicsPage />} />
          <Route path="/trips/new/transport" element={<TransportPage />} />
          <Route path="/trips/new/booking" element={<BookingPage />} />
          <Route path="/trips/new/stay" element={<StayPage />} />
          <Route path="/trips/new/discover" element={<DiscoverPage />} />
          <Route path="/trips/new/select" element={<SelectPage />} />
          <Route path="/trips/new/optimize" element={<OptimizePage />} />
          <Route path="/trips/new/review" element={<ReviewPage />} />
        </Route>

        <Route
          path="/trips/:tripId"
          element={
            <ProtectedRoute>
              <TripOverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:tripId/edit"
          element={
            <ProtectedRoute>
              <EditTripRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:tripId/itinerary"
          element={
            <ProtectedRoute>
              <ItineraryTripRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:tripId/map"
          element={
            <ProtectedRoute>
              <MapTripRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:tripId/live"
          element={
            <ProtectedRoute>
              <LiveTripRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:tripId/expenses"
          element={
            <ProtectedRoute>
              <ExpensesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:tripId/concierge"
          element={
            <ProtectedRoute>
              <ConciergePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:tripId/copilot"
          element={
            <ProtectedRoute>
              <CopilotPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:tripId/summary"
          element={
            <ProtectedRoute>
              <TripSummaryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:tripId/active"
          element={
            <ProtectedRoute>
              <ActiveTripPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:tripId/active/map"
          element={
            <ProtectedRoute>
              <ActiveTripPage mapOnly />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:tripId/active/copilot"
          element={
            <ProtectedRoute>
              <CopilotPage activeMode />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
