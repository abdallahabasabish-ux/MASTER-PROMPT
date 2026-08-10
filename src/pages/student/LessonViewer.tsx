import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { ArrowRight, Download, AlertCircle, Loader2 } from "lucide-react";

export default function LessonViewer() {
  const { lessonId } = useParams();
  const { userData } = useAuth();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) return;
      try {
        const docRef = doc(db, "lessons", lessonId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLesson({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };
    fetchLesson();
  }, [lessonId]);

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
    </div>
  );

  // التحقق من الاشتراك قبل عرض المحتوى المدفوع
  if (userData?.subscriptionStatus !== "ACTIVE") {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-white text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">المحتوى محمي</h2>
        <p className="text-gray-400 mb-6">يجب تفعيل اشتراكك الشهري للوصول إلى هذا الدرس.</p>
        <Link to="/student/subscription" className="bg-orange-500 text-black px-6 py-2 rounded font-bold">
          تفعيل الاشتراك
        </Link>
      </div>
    );
  }

  if (!lesson) return <div className="bg-gray-900 min-h-screen text-white p-8">الدرس غير موجود.</div>;

  return (
    <div dir="rtl" className="bg-gray-900 min-h-screen text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/student" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
            <ArrowRight className="w-4 h-4" /> العودة للوحة التحكم
          </Link>
          <div className="font-bold text-orange-500">الدكتور في العلوم</div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">{lesson.title}</h1>

        {/* Video Player */}
        {lesson.videoUrl && (
          <div className="mb-8 aspect-video w-full bg-black rounded-lg overflow-hidden">
            <iframe 
              src={lesson.videoUrl} 
              className="w-full h-full"
              allowFullScreen
              title={lesson.title}
            ></iframe>
          </div>
        )}

        {/* PDF Viewer / Download */}
        {lesson.pdfUrl && (
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-bold mb-4">مرفقات الدرس (PDF)</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href={lesson.pdfUrl} target="_blank" rel="noreferrer" 
                 className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-center py-3 rounded font-bold transition">
                قراءة الملف داخل المتصفح
              </a>
              
              {lesson.allowDownload ? (
                <a href={lesson.pdfUrl} download 
                   className="flex-1 bg-orange-500 hover:bg-orange-600 text-black text-center py-3 rounded font-bold transition flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" /> تحميل الملف
                </a>
              ) : (
                <div className="flex-1 bg-gray-700/50 text-gray-500 text-center py-3 rounded font-bold cursor-not-allowed flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5" /> التحميل غير مسموح لهذا الدرس
                </div>
              )}
            </div>
          </div>
        )}

        {/* Text Content */}
        {lesson.content && (
          <div className="mt-8 bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-bold mb-4">الشرح النصي</h3>
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {lesson.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
