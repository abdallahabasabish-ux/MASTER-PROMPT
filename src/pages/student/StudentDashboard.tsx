import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function StudentDashboard() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // جلب كل الدروس المنشورة (في الإنتاج سنفلترها حسب صف الطالب)
    const fetchLessons = async () => {
      try {
        // ملاحظة: هذا استعلام مبسط. في الإنتاج الفعلي يجب عمل استعلام يسير عبر الـ Subcollections
        // أو حفظ الدروس في Collection رئيسي يحتوي على gradeId لتسهيل الفلترة.
        const querySnapshot = await getDocs(collection(db, "stages"));
        querySnapshot.forEach(() => {
          // منطق جلب الدروس بناءً على الهيكل
        });
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };
    fetchLessons();
  }, []);

  if (loading) return <div className="text-center mt-10">جاري تحميل الدروس...</div>;

  return (
    <div dir="rtl" className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">الدروس المتاحة</h1>
      <div className="bg-white p-10 rounded-xl shadow text-center text-gray-500">
        لا توجد درروس متاحة حالياً أو يتم تحميل البيانات.
      </div>
    </div>
  );
}
