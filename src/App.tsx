import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CurriculumManager from "./pages/admin/CurriculumManager";
import StudentDashboard from "./pages/student/StudentDashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* مسارات الإدارة */}
        <Route path="/admin/curriculum" element={<CurriculumManager />} />
        
        {/* مسارات الطالب */}
        <Route path="/student" element={<StudentDashboard />} />
        
        {/* الصفحة الرئيسية */}
        <Route path="/" element={
          <div dir="rtl" className="text-center mt-20 text-2xl font-bold">
            منصة الدكتور في العلوم
          </div>
        } />
      </Routes>
    </Router>
  );
}
