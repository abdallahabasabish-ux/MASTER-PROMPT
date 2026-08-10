import { useState } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Trash2, Loader2, Save } from "lucide-react";

export default function ExamBuilder() {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", type: "MULTIPLE_CHOICE", options: ["", "", "", ""], correctAnswer: 0 }
    ]);
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const handleSaveExam = async () => {
    if (!title || questions.length === 0) return alert("أدخل عنوان الامتحان وسؤالاً واحداً على الأقل");
    setLoading(true);
    try {
      await addDoc(collection(db, "exams"), {
        title,
        duration,
        questions,
        createdAt: serverTimestamp(),
        status: "PUBLISHED"
      });
      alert("تم نشر الامتحان بنجاح!");
      navigate("/admin"); // العودة للوحة الإدارة
    } catch (error) {
      alert("حدث خطأ أثناء الحفظ.");
    }
    setLoading(false);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#FAFAFA] p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#1E293B]">إنشاء امتحان جديد</h1>
          <button onClick={addQuestion} className="flex items-center gap-2 bg-[#F5F3FF] text-[#6D28D9] px-4 py-2 rounded-lg font-bold hover:bg-[#EDE9FE] transition">
            <PlusCircle className="w-5 h-5" /> إضافة سؤال
          </button>
        </div>

        {/* Exam Details */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0] mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#64748B] mb-1">عنوان الامتحان</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#6D28D9] outline-none transition" placeholder="مثال: امتحان الوحدة الأولى" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#64748B] mb-1">المدة (بالدقائق)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full p-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#6D28D9] outline-none transition" />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0] relative">
              <button onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}
                className="absolute top-4 left-4 text-red-500 hover:bg-red-50 p-2 rounded-lg transition">
                <Trash2 className="w-5 h-5" />
              </button>
              
              <h3 className="font-bold text-[#6D28D9] mb-4">السؤال {qIndex + 1}</h3>
              <textarea value={q.text} onChange={(e) => handleQuestionChange(qIndex, "text", e.target.value)}
                className="w-full p-3 border border-[#E2E8F0] rounded-lg mb-4 focus:ring-2 focus:ring-[#6D28D9] outline-none transition" placeholder="نص السؤال..." rows={2} />

              <div className="space-y-2">
                {q.options.map((opt: string, optIndex: number) => (
                  <div key={optIndex} className="flex items-center gap-2">
                    <input type="radio" name={`correct-${qIndex}`} checked={q.correctAnswer === optIndex}
                      onChange={() => handleQuestionChange(qIndex, "correctAnswer", optIndex)}
                      className="w-5 h-5 accent-[#6D28D9]" />
                    <input type="text" value={opt} onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                      className="flex-1 p-2 border border-[#E2E8F0] rounded-lg focus:ring-1 focus:ring-[#6D28D9] outline-none transition" placeholder={`الخيار ${optIndex + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {questions.length > 0 && (
          <button onClick={handleSaveExam} disabled={loading}
            className="w-full mt-6 bg-[#6D28D9] text-white py-4 rounded-xl font-bold hover:bg-[#5B21B6] transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            حفظ ونشر الامتحان
          </button>
        )}
      </div>
    </div>
  );
}
