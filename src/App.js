import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import { AuthProvider, useAuth } from "./context/AuthContext";
import DashboardLayout from "./Pages/DashboardLayout";
import LecturerCoursesPage from "./Pages/lecturer/LecturerCoursesPage";
import ViewEnrolledStudents from "./Pages/lecturer/ViewEnrolled Students";
import ViewAttendance from "./Pages/lecturer/ViewAttendance";
import LecturerDashboardOverview from "./Pages/lecturer/LecturerDashboardStats";
import MarkAttendance from "./Pages/Students/MarkAttendance";
import StudentAttendanceHistory from "./Pages/Students/AttendanceHistory";
import StudentStats from "./Pages/Students/StudentStats";

function ProtectedRoute({ children, allowed }) {
  const { loading, user, role } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user || (allowed && !allowed.includes(role))) return <Navigate to="/login" />;
  return children;
}

function DashboardRouter() {
  const { role } = useAuth();
  if (role === "student") return <DashboardLayout role="student" />;
  if (role === "lecturer") return <DashboardLayout role="lecturer" />;
  return <div>No dashboard found for your role</div>;
}

export default function App() {
  return (
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowed={["student", "lecturer"]}>
                    <DashboardRouter />
                  </ProtectedRoute>
                }
            />

              <Route
                  path="/student/*"
                  element={
                      <ProtectedRoute allowed={["student"]}>
                          <DashboardLayout role="student" />
                      </ProtectedRoute>
                  }
              >
                  <Route path="dashboard" element={<StudentStats />} />
                  <Route path="mark-attendance" element={<MarkAttendance />} />
                  <Route path="attendance-history" element={<StudentAttendanceHistory />} />

              </Route>
              <Route
                  path="/lecturer/*"
                  element={
                      <ProtectedRoute allowed={["lecturer"]}>
                          <DashboardLayout role="lecturer" />
                      </ProtectedRoute>
                  }
              >
                  <Route path="dashboard" element={<LecturerDashboardOverview />} />
                  <Route path="courses" element={<LecturerCoursesPage />} />
                  <Route path="enrollments" element={<ViewEnrolledStudents />}/>
                  <Route path="attendance" element={<ViewAttendance />} />
              </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
  );
}
