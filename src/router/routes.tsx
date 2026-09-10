import { createBrowserRouter, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import AppLayout from '../layouts/AppLayout'
import DealerPortalLayout from '../layouts/DealerPortalLayout'
import LoginPage from '../features/auth/LoginPage'
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
import VisitDetailPage from '../features/visits/VisitDetailPage'
import VisitCapturePage from '../features/visits/VisitCapturePage'
import ReportsPage from '../features/reports/ReportsPage'
import NotificationsPage from '../features/notifications/NotificationsPage'
import SetupPage from '../features/setup/SetupPage'
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
import MobileCapturePage from '../features/mobile/MobileCapturePage'
import MobileVisitPage from '../features/mobile/MobileVisitPage'
import MobileWeekPage from '../features/mobile/MobileWeekPage'
// Dealer portal pages
import DealerNewRequestPage from '../features/dealer/DealerNewRequestPage'
import DealerRequestsPage from '../features/dealer/DealerRequestsPage'
import DealerRequestDetailPage from '../features/dealer/DealerRequestDetailPage'
import DealerProfilePage from '../features/dealer/DealerProfilePage'

/** Redirect to /login if not authenticated. */
function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

/** Internal routes: redirect dealer users to /dealer/requests. */
function InternalRoute() {
  const staff = useAuthStore((s) => s.staff)
  if (staff?.role === 'dealer') return <Navigate to="/dealer/requests" replace />
  return <Outlet />
}

/** Dealer portal routes: redirect non-dealer users to /dashboard. */
function DealerRoute() {
  const staff = useAuthStore((s) => s.staff)
  if (staff && staff.role !== 'dealer') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

function CalendarRoute() {
  return <>
    <div className="hidden md:block"><CalendarPage /></div>
    <div className="md:hidden"><MobileWeekPage /></div>
  </>
}

/** Root redirect: dealer → /dealer/requests, others → /dashboard */
function RootRedirect() {
  const staff = useAuthStore((s) => s.staff)
  if (staff?.role === 'dealer') return <Navigate to="/dealer/requests" replace />
  return <Navigate to="/dashboard" replace />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      // ── Dealer Portal ──────────────────────────────────────────────────────
      {
        element: <DealerRoute />,
        children: [
          {
            element: <DealerPortalLayout />,
            children: [
              { path: '/dealer/requests', element: <DealerRequestsPage /> },
              { path: '/dealer/requests/new', element: <DealerNewRequestPage /> },
              { path: '/dealer/requests/:id', element: <DealerRequestDetailPage /> },
              { path: '/dealer/profile', element: <DealerProfilePage /> },
              { path: '/dealer/notifications', element: <NotificationsPage /> },
            ],
          },
        ],
      },
      // ── Internal (admin/staff) ─────────────────────────────────────────────
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
              { path: '/visits/:id', element: <VisitDetailPage /> },
              { path: '/visits/:id/outcome', element: <VisitCapturePage /> },
              { path: '/reports', element: <ReportsPage /> },
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
              { path: 'week', element: <MobileWeekPage /> },
              { path: 'dealers', element: <MobileDealersPage /> },
              { path: 'capture', element: <MobileCapturePage /> },
              { path: 'visit/:id', element: <MobileVisitPage /> },
              { path: 'notifications', element: <NotificationsPage /> },
              { path: 'search', element: <Navigate to="/mobile" replace /> },
            ],
          },
        ],
      },
    ],
  },
])
