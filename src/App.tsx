import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import FacilitatorLayout from './components/FacilitatorLayout'

const UserHome = lazy(() => import('./pages/user/UserHome'))
const ActivityDetail = lazy(() => import('./pages/user/ActivityDetail'))
const ParticipantSignup = lazy(() => import('./pages/user/ParticipantSignup'))
const SubmitEvaluation = lazy(() => import('./pages/user/SubmitEvaluation'))
const CompleteProfile = lazy(() => import('./pages/user/CompleteProfile'))
const ParticipantDashboard = lazy(() => import('./pages/user/ParticipantDashboard'))
const MyActivities = lazy(() => import('./pages/user/MyActivities'))
const ParticipantProfile = lazy(() => import('./pages/user/ParticipantProfile'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminParticipants = lazy(() => import('./pages/admin/AdminParticipants'))
const AdminActivities = lazy(() => import('./pages/admin/AdminActivities'))
const AdminFacilitators = lazy(() => import('./pages/admin/AdminFacilitators'))
const AdminBudget = lazy(() => import('./pages/admin/AdminBudget'))
const AdminAttendance = lazy(() => import('./pages/admin/AdminAttendance'))
const AdminEvaluations = lazy(() => import('./pages/admin/AdminEvaluations'))
const AdminReports = lazy(() => import('./pages/admin/AdminReports'))
const FacilitatorDashboard = lazy(() => import('./pages/facilitator/FacilitatorDashboard'))
const FacilitatorAttendance = lazy(() => import('./pages/facilitator/FacilitatorAttendance'))
const FacilitatorParticipants = lazy(() => import('./pages/facilitator/FacilitatorParticipants'))

function App() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500" role="status">Loading page…</div>}>
      <Routes>
        <Route path="/" element={<UserHome />} />
        <Route path="/activities/:id" element={<ActivityDetail />} />
        <Route path="/signup" element={<ParticipantSignup />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/feedback" element={<SubmitEvaluation />} />

        <Route
          path="/participant/complete-profile"
          element={
            <ProtectedRoute>
              <CompleteProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participant"
          element={
            <ProtectedRoute allowedRoles={['participant']}>
              <ParticipantDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participant/my-activities"
          element={
            <ProtectedRoute allowedRoles={['participant']}>
              <MyActivities />
            </ProtectedRoute>
          }
        />

        <Route
          path="/participant/profile"
          element={
            <ProtectedRoute allowedRoles={['participant']}>
              <ParticipantProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="participants" element={<AdminParticipants />} />
          <Route path="activities" element={<AdminActivities />} />
          <Route path="facilitators" element={<AdminFacilitators />} />
          <Route path="budget" element={<AdminBudget />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="evaluations" element={<AdminEvaluations />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        <Route
          path="/admin/facilitator-portal"
          element={
            <ProtectedRoute allowedRoles={['facilitator']}>
              <FacilitatorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<FacilitatorDashboard />} />
          <Route path="attendance" element={<FacilitatorAttendance />} />
          <Route path="participants" element={<FacilitatorParticipants />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App