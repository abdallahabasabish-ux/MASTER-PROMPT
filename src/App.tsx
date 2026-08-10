import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Student Pages
import StudentRoute from "./components/StudentRoute";
import StudentDashboard from "./pages/student/Dashboard";
import Subscription from "./pages/student/Subscription";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Student Protected */}
          <Route path="/student" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
          <Route path="/student/subscription" element={<StudentRoute><Subscription /></StudentRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
