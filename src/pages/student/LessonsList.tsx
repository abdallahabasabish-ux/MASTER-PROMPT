import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { BookOpen, Loader2, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function LessonsList() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const snapshot = await getDocs(collection(db, "lessons"));
        setLessons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };
    fetchLessons();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
    </div>
  );

  const isSubscribed = userData?.subscriptionStatus === "ACTIVE";

  return (
    <div dir="rtl" className="bg-gray-900 min-h-screen text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">قائمة الدروس</h1>
        
        {!isSubscribed && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6 text-center">
            اشتراكك غير مفعل، الدروس مقفلة. <Link to="/student/subscription" className="font-bold underline">اشترك الآن</Link>
          </div>
        )}

        <div className="space-y-3">
          {lessons.map(lesson => (
            <div key={lesson.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold">{lesson.title}</h3>
              </div>
              
              {isSubscribed ? (
                <Link to={`/student/lessons/${lesson.id}`} className="bg-orange-500 text-black px-4 py-2 rounded text-sm font-bold hover:bg-orange-600">
                  عرض الدرس
                </Link>
              ) : (
                <div className="bg-gray-700 text-gray-500 px-4 py-2 rounded text-sm font-bold flex items-center gap-1">
                  <Lock className="w-4 h-4" /> مقفل
                </div>
              )}
            </div>
          ))}
          
          {lessons.length === 0 && <p className="text-gray-400 text-center">لا توجد دروس متاحة حالياً.</p>}
        </div>
      </div>
    </div>
  );
}
