import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { BookOpen, Award, CreditCard, AlertCircle } from "lucide-react";

export default function StudentDashboard() {
  const { user, userData, logout } = useAuth();

  // افتراض أن بيانات الطالب مخزنة في userData
  const isSubscribed = userData?.subscriptionStatus === "ACTIVE";

  return (
    <div dir="rtl" className="bg-gray-900 min-h-screen text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center font-bold text-black">د</div>
          <span className="font-bold">الدكتور في العلوم</span>
        </div>
        <button onClick={logout} className="text-sm text-gray-400 hover:text-white border border-gray-600 px-3 py-1 rounded">
          خروج
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        <h1 className="text-2xl font-bold mb-2">أهلاً، {userData?.name || "طالب"}</h1>
        <p className="text-gray-400 mb-8">المرحلة: {userData?.stage || "غير محدد"}</p>

        {/* Subscription Alert */}
        {!isSubscribed && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>اشتراكك غير مفعل حالياً. لا يمكنك الوصول للمحتوى.</span>
            </div>
            <Link to="/student/subscription" className="bg-red-500 text-white px-4 py-2 rounded font-bold text-sm whitespace-nowrap">
              تفعيل الاشتراك الآن
            </Link>
          </div>
        )}

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <BookOpen className="w-8 h-8 text-orange-500 mb-4" />
            <h3 className="text-lg font-bold mb-1">الدروس</h3>
            <p className="text-gray-400 text-sm">تصفح دروس مادة العلوم</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <Award className="w-8 h-8 text-orange-500 mb-4" />
            <h3 className="text-lg font-bold mb-1">الامتحانات</h3>
            <p className="text-gray-400 text-sm">اختبارات أسبوعية وشهرية</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <CreditCard className="w-8 h-8 text-orange-500 mb-4" />
            <h3 className="text-lg font-bold mb-1">الاشتراك</h3>
            <p className="text-gray-400 text-sm">حالة: <span className={isSubscribed ? "text-green-500" : "text-red-500"}>{isSubscribed ? "مفعل" : "معلق"}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
