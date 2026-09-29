import { createBrowserRouter, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useMediaQuery } from '../hooks/useMediaQuery'
import AppLayout from '../layouts/AppLayout'
import LoginPage from '../features/auth/LoginPage'
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage'
import DashboardPage from '../features/dashboard/DashboardPage'
import ControlRoomPage from '../features/control-room/ControlRoomPage'
import DealersListPage from '../features/dealers/DealersListPage'
import DealerDetailPage from '../features/dealers/DealerDetailPage'
import DealerFormPage from '../features/dealers/DealerFormPage'
import ProspectsListPage from '../features/prospects/ProspectsListPage'
import ProspectDetailPage from '../features/prospects/ProspectDetailPage'
import ProspectFormPage from '../features/prospects/ProspectFormPage'
import RequestsListPage from '../features/requests/RequestsListPage'
import RequestDetailPage from '../features/requests/RequestDetailPage'
import RequestFormPage from '../features/requests/RequestFormPage'
import VisitsCalendarPage from '../features/visits/VisitsCalendarPage'
import VisitFormPage from '../features/visits/VisitFormPage'
import VisitDetailPage from '../features/visits/VisitDetailPage'
import VisitCapturePage from '../features/visits/VisitCapturePage'
import ReportsPage from '../features/reports/ReportsPage'
import NotificationsPage from '../features/notifications/NotificationsPage'
import SetupPage from '../features/setup/SetupPage'
import ServicesListPage from '../features/services/ServicesListPage'
import ServiceDetailPage from '../features/services/ServiceDetailPage'
import ProvidersListPage from '../features/providers/ProvidersListPage'
import ProviderDetailPage from '../features/providers/ProviderDetailPage'
import DesktopDealersPage from '../features/desktop/DesktopDealersPage'
import DesktopDealer360Page from '../features/desktop/DesktopDealer360Page'
import DesktopRequestsPage from '../features/desktop/DesktopRequestsPage'
import DesktopRequestDetailPage from '../features/desktop/DesktopRequestDetailPage'
import DesktopRequestNewPage from '../features/desktop/DesktopRequestNewPage'
import DesktopProspectsPage from '../features/desktop/DesktopProspectsPage'
import DesktopProspectDetailPage from '../features/desktop/DesktopProspectDetailPage'
import DesktopVisitDetailPage from '../features/desktop/DesktopVisitDetailPage'
import DesktopCalendarBoardPage from '../features/desktop/DesktopCalendarBoardPage'
import CalendarPage from '../features/calendar/CalendarPage'
import MobileLayout from '../features/mobile/MobileLayout'
import MobileDayPage from '../features/mobile/MobileDayPage'
import MobileDealersPage from '../features/mobile/MobileDealersPage'
import MobileDealerNewPage from '../features/mobile/MobileDealerNewPage'
import MobileCapturePage from '../features/mobile/MobileCapturePage'
import MobileVisitPage from '../features/mobile/MobileVisitPage'
import MobileVisitNewPage from '../features/mobile/MobileVisitNewPage'
import MobileProspectNewPage from '../features/mobile/MobileProspectNewPage'
import MobilePlanningPage from '../features/calendar/MobilePlanningPage'
import MobileDealerDetailPage from '../features/mobile/MobileDealerDetailPage'
import MobileRequestDetailPage from '../features/mobile/MobileRequestDetailPage'
// Dealer portal pages — a genuinely separate surface from the staff console,
// not a filtered view of it. See PortalLayout / server/src/modules/portal.
import PortalLayout from '../features/portal/PortalLayout'
import PortalHomePage from '../features/portal/PortalHomePage'
import PortalNewRequestPage from '../features/portal/PortalNewRequestPage'
import PortalRequestsPage from '../features/portal/PortalRequestsPage'
import PortalRequestDetailPage from '../features/portal/PortalRequestDetailPage'
import PortalServicesPage from '../features/portal/PortalServicesPage'
import PortalServiceDetailPage from '../features/portal/PortalServiceDetailPage'
import PortalProvidersPage from '../features/portal/PortalProvidersPage'
import PortalProviderDetailPage from '../features/portal/PortalProviderDetailPage'
import PortalProfilePage from '../features/portal/PortalProfilePage'
import PortalNotificationsPage from '../features/portal/PortalNotificationsPage'
import MobileProspectDetailPage from '../features/mobile/MobileProspectDetailPage'
import MobileSearchPage from '../features/mobile/MobileSearchPage'
import RouteErrorBoundary from '../components/errors/RouteErrorBoundary'

/** Redirect to /login if not authenticated. */
function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

/** Internal (staff/admin) routes: redirect dealer logins to /portal. */
function InternalRoute() {
  const staff = useAuthStore((s) => s.staff)
  if (staff?.role === 'dealer') return <Navigate to="/portal" replace />
  return <Outlet />
}

/** Dealer portal routes: redirect staff/admin logins to /dashboard. */
function DealerRoute() {
  const staff = useAuthStore((s) => s.staff)
  if (staff && staff.role !== 'dealer') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

/**
 * At phone width, AppLayout's sidebar never collapses, so cramming the
 * mobile calendar into its remaining sliver of horizontal space produced
 * an unreadable, overlapping layout. Redirect into the real mobile shell
 * (which owns the whole viewport) instead of rendering both in the same tree.
 */
function CalendarRoute() {
  const isNarrow = useMediaQuery('(max-width: 767px)')
  if (isNarrow) return <Navigate to="/mobile/week" replace />
  return <CalendarPage />
}

/** Root redirect: dealer → /portal, others → /dashboard */
function RootRedirect() {
  const staff = useAuthStore((s) => s.staff)
  if (staff?.role === 'dealer') return <Navigate to="/portal" replace />
  return <Navigate to="/dashboard" replace />
}

export const router = createBrowserRouter([
  {
    element: <Outlet />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          // ── Dealer Portal ──────────────────────────────────────────────────
          {
            element: <DealerRoute />,
            children: [
              {
                element: <PortalLayout />,
                children: [
                  { path: '/portal', element: <PortalHomePage /> },
                  { path: '/portal/requests', element: <PortalRequestsPage /> },
                  { path: '/portal/requests/new', element: <PortalNewRequestPage /> },
                  { path: '/portal/requests/:id', element: <PortalRequestDetailPage /> },
                  { path: '/portal/services', element: <PortalServicesPage /> },
                  { path: '/portal/services/:id', element: <PortalServiceDetailPage /> },
                  { path: '/portal/providers', element: <PortalProvidersPage /> },
                  { path: '/portal/providers/:id', element: <PortalProviderDetailPage /> },
                  { path: '/portal/profile', element: <PortalProfilePage /> },
                  { path: '/portal/notifications', element: <PortalNotificationsPage /> },
                ],
              },
            ],
          },
          // ── Internal (admin/staff) ───────────────────────────────────────────
          {
            element: <InternalRoute />,
            children: [
              {
                element: <AppLayout />,
                children: [
                  { path: '/', element: <RootRedirect /> },
                  { path: '/dashboard', element: <DashboardPage /> },
                  { path: '/control-room', element: <ControlRoomPage /> },
                  { path: '/calendar', element: <CalendarRoute /> },
                  { path: '/calendar/day', element: <CalendarRoute /> },
                  { path: '/calendar/week', element: <CalendarRoute /> },
                  { path: '/calendar/month', element: <CalendarRoute /> },
                  { path: '/dealers', element: <DealersListPage /> },
                  { path: '/dealers/new', element: <DealerFormPage /> },
                  { path: '/dealers/:id', element: <DealerDetailPage /> },
                  { path: '/prospects', element: <ProspectsListPage /> },
                  { path: '/prospects/new', element: <ProspectFormPage /> },
                  { path: '/prospects/:id', element: <ProspectDetailPage /> },
                  { path: '/requests', element: <RequestsListPage /> },
                  { path: '/requests/new', element: <RequestFormPage /> },
                  { path: '/requests/:id', element: <RequestDetailPage /> },
                  { path: '/visits', element: <VisitsCalendarPage /> },
                  { path: '/visits/new', element: <VisitFormPage /> },
                  { path: '/visits/:id', element: <VisitDetailPage /> },
                  { path: '/visits/:id/outcome', element: <VisitCapturePage /> },
                  { path: '/reports', element: <ReportsPage /> },
                  { path: '/services', element: <ServicesListPage /> },
                  { path: '/services/:id', element: <ServiceDetailPage /> },
                  { path: '/providers', element: <ProvidersListPage /> },
                  { path: '/providers/:id', element: <ProviderDetailPage /> },
                  { path: '/notifications', element: <NotificationsPage /> },
                  { path: '/setup', element: <SetupPage /> },
                  // ── Desktop views ──
                  { path: '/desktop/dealers', element: <DesktopDealersPage /> },
                  { path: '/desktop/dealers/:id', element: <DesktopDealer360Page /> },
                  { path: '/desktop/requests', element: <DesktopRequestsPage /> },
                  { path: '/desktop/requests/new', element: <DesktopRequestNewPage /> },
                  { path: '/desktop/requests/:id', element: <DesktopRequestDetailPage /> },
                  { path: '/desktop/prospects', element: <DesktopProspectsPage /> },
                  { path: '/desktop/prospects/:id', element: <DesktopProspectDetailPage /> },
                  { path: '/desktop/visits/:id', element: <DesktopVisitDetailPage /> },
                  { path: '/desktop/calendar', element: <DesktopCalendarBoardPage /> },
                ],
              },
              {
                path: '/mobile',
                element: <MobileLayout />,
                children: [
                  { index: true, element: <MobileDayPage /> },
                  { path: 'week', element: <MobilePlanningPage /> },
                  { path: 'dealers', element: <MobileDealersPage /> },
                  { path: 'dealers/new', element: <MobileDealerNewPage /> },
                  { path: 'dealers/:id', element: <MobileDealerDetailPage /> },
                  { path: 'request/:id', element: <MobileRequestDetailPage /> },
                  { path: 'capture', element: <MobileCapturePage /> },
                  { path: 'visit/new', element: <MobileVisitNewPage /> },
                  { path: 'visit/:id', element: <MobileVisitPage /> },
                  { path: 'prospect/new', element: <MobileProspectNewPage /> },
                  { path: 'prospect/:id', element: <MobileProspectDetailPage /> },
                  { path: 'notifications', element: <NotificationsPage /> },
                  { path: 'search', element: <MobileSearchPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
])
