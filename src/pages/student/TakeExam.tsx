import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { Clock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function TakeExam() {
  const { examId } = useParams();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    const fetchExam = async () => {
      if (!examId) return;
      const docRef = doc(db, "exams", examId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setExam(data);
        setTimeLeft(data.duration * 60);
      }
      setLoading(false);
    };
    fetchExam();
  }, [examId]);

  // Timer Logic
  useEffect(() => {
    if (timeLeft > 0 && result === null) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit(true); // Auto submit
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, result]);

  const handleSelectAnswer = (qIndex: number, optionIndex: number) => {
    setAnswers({ ...answers, [qIndex]: optionIndex });
  };

  const handleSubmit = async (isAuto = false) => {
    if (!exam || !user) return;
    if (!isAuto && Object.keys(answers).length < exam.questions.length) {
      if (!confirm("لقد تركت بعض الأسئلة بدون إجابة. هل تريد التسليم؟")) return;
    }

    setSubmitting(true);
    
    // Auto Grading
    let score = 0;
    exam.questions.forEach((q: any, index: number) => {
      if (answers[index] === q.correctAnswer) {
        score += 1;
      }
    });

    const totalQuestions = exam.questions.length;
    const percentage = (score / totalQuestions) * 100;

    try {
      // حفظ النتيجة في قاعدة البيانات
      await addDoc(collection(db, "submissions"), {
        studentId: user.uid,
        studentName: userData?.name,
        examId: examId,
        examTitle: exam.title,
        answers: answers,
        score: score,
        totalQuestions: totalQuestions,
        percentage: percentage,
        status: "GRADED",
        createdAt: serverTimestamp()
      });

      setResult(percentage);
    } catch (error) {
      alert("حدث خطأ أثناء التسليم.");
    }
    setSubmitting(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="min-h-screen flex justify-center items-center bg-[#FAFAFA]">
      <Loader2 className="w-8 h-8 animate-spin text-[#6D28D9]" />
    </div>
  );

  // Result Screen
  if (result !== null) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-[#E2E8F0] text-center max-w-md w-full">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${result >= 50 ? 'bg-green-100' : 'bg-red-100'}`}>
            <CheckCircle2 className={`w-12 h-12 ${result >= 50 ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <h2 className="text-2xl font-bold text-[#1E293B] mb-2">انتهى الامتحان!</h2>
          <p className="text-[#64748B] mb-6">نتيجتك النهائية:</p>
          <div className="text-5xl font-extrabold text-[#6D28D9] mb-8">{result.toFixed(0)}%</div>
          <button onClick={() => navigate("/student")} className="bg-[#6D28D9] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#5B21B6] transition">
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  if (!exam) return <div>الامتحان غير موجود.</div>;

  return (
    <div dir="rtl" className="min-h-screen bg-[#FAFAFA] pb-20">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-[#1E293B]">{exam.title}</h1>
          <div className="flex items-center gap-2 bg-[#F5F3FF] text-[#6D28D9] px-4 py-2 rounded-lg font-bold">
            <Clock className="w-5 h-5" />
            <span className="tabular-nums">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* Questions */}
      <div className="max-w-3xl mx-auto p-4 sm:p-8 space-y-6">
        {exam.questions.map((q: any, qIndex: number) => (
          <div key={qIndex} className="bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0]">
            <h3 className="text-lg font-bold text-[#1E293B] mb-4">{qIndex + 1}. {q.text}</h3>
            <div className="grid grid-cols-1 gap-3">
              {q.options.map((opt: string, optIndex: number) => (
                <button 
                  key={optIndex} 
                  onClick={() => handleSelectAnswer(qIndex, optIndex)}
                  className={`text-right p-4 rounded-xl border-2 transition flex items-center gap-3 ${
                    answers[qIndex] === optIndex 
                      ? 'border-[#6D28D9] bg-[#F5F3FF]' 
                      : 'border-[#E2E8F0] hover:border-[#8B5CF6] hover:bg-[#FAFAFA]'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    answers[qIndex] === optIndex ? 'border-[#6D28D9] bg-[#6D28D9]' : 'border-[#CBD5E1]'
                  }`}>
                    {answers[qIndex] === optIndex && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className="font-medium text-[#1E293B]">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button (Fixed Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] p-4">
        <div className="max-w-3xl mx-auto">
          <button 
            onClick={() => handleSubmit(false)} 
            disabled={submitting}
            className="w-full bg-[#6D28D9] text-white py-4 rounded-xl font-bold hover:bg-[#5B21B6] transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            تسليم الامتحان
          </button>
        </div>
      </div>
    </div>
  );
}
