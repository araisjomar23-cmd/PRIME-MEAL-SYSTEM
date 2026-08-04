import { Routes, Route } from 'react-router-dom'
import UserHome from './pages/user/UserHome'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminParticipants from './pages/admin/AdminParticipants'
import AdminActivities from './pages/admin/AdminActivities'
import AdminLogin from './pages/admin/AdminLogin'
import ProtectedRoute from './routes/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import AdminFacilitators from './pages/admin/AdminFacilitators'
import AdminBudget from './pages/admin/AdminBudget'
import AdminAttendance from './pages/admin/AdminAttendance'
import ActivityDetail from './pages/user/ActivityDetail'
import AdminEvaluations from './pages/admin/AdminEvaluations'
import SubmitEvaluation from './pages/user/SubmitEvaluation'
import AdminReports from './pages/admin/AdminReports'
import FacilitatorLayout from './components/FacilitatorLayout'
import FacilitatorDashboard from './pages/facilitator/FacilitatorDashboard'
import FacilitatorAttendance from './pages/facilitator/FacilitatorAttendance'
import FacilitatorParticipants from './pages/facilitator/FacilitatorParticipants'

function App() {
  return (
    <Routes>
      <Route path="/" element={<UserHome />} />
      <Route path="/activities/:id" element={<ActivityDetail />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/feedback" element={<SubmitEvaluation />} />

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
  )
}

export default App