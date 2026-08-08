import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { ExamAttempt, ExamQuestion } from '../../types';
import { Button, Card, Progress } from '../../components/ui';
import { Clock, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck } from 'lucide-react';

export const ExamTaking: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { get, post, put } = useApi();
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [questionStates, setQuestionStates] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // تحميل بيانات الامتحان وبدء المحاولة
  useEffect(() => {
    const init = async () => {
      try {
        // 1. جلب بيانات الامتحان
        const examRes = await get(`/api/student/exams/${examId}`);
        const examData = examRes.data;

        // 2. بدء محاولة جديدة أو استئناف
        let attemptRes;
        if (examData.inProgress) {
          attemptRes = { data: examData.inProgress };
        } else {
          attemptRes = await post(`/api/student/exams/${examId}/start`);
        }
        const attemptData = attemptRes.data;
        setAttempt(attemptData);

        // 3. تحميل الإجابات المحفوظة (إن وجدت)
        const savedAnswers: Record<string, any> = {};
        attemptData.answers?.forEach((ans: any) => {
          savedAnswers[ans.questionId] = ans;
        });
        setAnswers(savedAnswers);

        // 4. تحميل حالة الأسئلة
        setQuestionStates(attemptData.questionsState || {});

        // 5. حساب الوقت المتبقي
        const started = new Date(attemptData.startedAt);
        const duration = attemptData.exam.durationMinutes * 60;
        const elapsed = Math.floor((Date.now() - started.getTime()) / 1000);
        const remaining = Math.max(0, duration - elapsed);
        setTimeLeft(remaining);

        setLoading(false);
      } catch (err) {
        console.error(err);
        navigate('/student/exams');
      }
    };
    init();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examId]);

  // مؤقت العد التنازلي
  useEffect(() => {
    if (loading || !attempt) return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(async () => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Auto Submit
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [loading, attempt]);

  // حفظ الإجابة مؤقتاً (عند تغيير السؤال)
  const saveCurrentAnswer = async () => {
    if (!attempt) return;
    const currentQ = getCurrentQuestion();
    if (!currentQ) return;
    const answer = answers[currentQ.questionId];
    if (!answer) return;

    try {
      await put(
        `/api/student/attempts/${attempt.id}/questions/${currentQ.questionId}/save`,
        { answer }
      );
    } catch (err) {
      console.error('Failed to save answer', err);
    }
  };

  // تحديث حالة السؤال (Answered/Marked)
  const updateQuestionState = async (questionId: string, state: string) => {
    if (!attempt) return;
    try {
      await put(
        `/api/student/attempts/${attempt.id}/questions/${questionId}/state`,
        { state }
      );
      setQuestionStates(prev => ({ ...prev, [questionId]: state }));
    } catch (err) {
      console.error(err);
    }
  };

  const getCurrentQuestion = () => {
    if (!attempt) return null;
    const questions = attempt.exam.questions;
    return questions[currentQuestionIndex] || null;
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    // تحديث الحالة إلى answered إذا كانت unanswered
    if (questionStates[questionId] === 'unanswered' || !questionStates[questionId]) {
      updateQuestionState(questionId, 'answered');
    }
  };

  const handleNext = async () => {
    await saveCurrentAnswer();
    if (currentQuestionIndex < attempt!.exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = async () => {
    await saveCurrentAnswer();
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleMarkForReview = async () => {
    const q = getCurrentQuestion();
    if (!q) return;
    const currentState = questionStates[q.questionId] || 'unanswered';
    const newState = currentState === 'marked' ? 'answered' : 'marked';
    await updateQuestionState(q.questionId, newState);
  };

  const handleSubmit = async () => {
    if (!attempt) return;
    const confirmSubmit = window.confirm('هل أنت متأكد من رغبتك في تسليم الامتحان؟');
    if (!confirmSubmit) return;

    setSubmitting(true);
    try {
      // تجميع الإجابات النهائية
      const finalAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        ...answer,
      }));

      await post(`/api/student/attempts/${attempt.id}/submit`, { answers: finalAnswers });
      navigate(`/student/results/exam/${attempt.id}`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تسليم الامتحان');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    try {
      const finalAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        ...answer,
      }));
      await post(`/api/student/attempts/${attempt.id}/submit`, { answers: finalAnswers });
      alert('تم تسليم الامتحان تلقائياً لانتهاء الوقت');
      navigate(`/student/results/exam/${attempt.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // عرض التحميل أو رسالة الخطأ
  if (loading) return <div className="flex justify-center items-center h-screen">جاري تحميل الامتحان...</div>;
  if (!attempt) return <div>الامتحان غير متاح</div>;

  const questions = attempt.exam.questions;
  const currentQ = getCurrentQuestion();
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // تنسيق الوقت
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-4" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 bg-white shadow p-4 rounded-lg">
        <h1 className="text-xl font-bold">{attempt.exam.title}</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center text-red-600 font-bold">
            <Clock className="ml-2" />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <span className="text-sm">
            السؤال {currentQuestionIndex + 1} من {totalQuestions}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar: لوحة الأسئلة */}
        <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow h-fit">
          <h3 className="font-bold mb-2">الأسئلة</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const state = questionStates[q.questionId] || 'unanswered';
              let bgColor = 'bg-gray-200';
              if (state === 'answered') bgColor = 'bg-green-500';
              else if (state === 'marked') bgColor = 'bg-yellow-500';
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-10 h-10 rounded-lg text-white font-bold ${bgColor} hover:opacity-80 transition`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex gap-2 text-xs">
            <span className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full ml-1"></span> مجاب</span>
            <span className="flex items-center"><span className="w-3 h-3 bg-yellow-500 rounded-full ml-1"></span> للمراجعة</span>
            <span className="flex items-center"><span className="w-3 h-3 bg-gray-200 rounded-full ml-1"></span> لم يُجب</span>
          </div>
        </div>

        {/* Area عرض السؤال */}
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <span className="text-sm text-gray-500">السؤال {currentQuestionIndex + 1} من {totalQuestions}</span>
            <Progress value={progress} className="mt-2" />
          </div>

          {currentQ && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{currentQ.question.questionText}</h3>
                <span className="text-sm text-gray-500">الدرجة: {currentQ.question.marks}</span>
              </div>

              {/* عرض خيارات حسب نوع السؤال */}
              <QuestionRenderer
                question={currentQ.question}
                value={answers[currentQ.questionId] || null}
                onChange={(val) => handleAnswerChange(currentQ.questionId, val)}
              />

              <div className="flex justify-between items-center mt-6">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                    <ChevronRight /> السابق
                  </Button>
                  <Button variant="outline" onClick={handleNext} disabled={currentQuestionIndex === totalQuestions - 1}>
                    التالي <ChevronLeft />
                  </Button>
                </div>
                <Button
                  variant={questionStates[currentQ.questionId] === 'marked' ? 'default' : 'outline'}
                  onClick={handleMarkForReview}
                  className="gap-2"
                >
                  {questionStates[currentQ.questionId] === 'marked' ? (
                    <><BookmarkCheck /> إزالة المراجعة</>
                  ) : (
                    <><Bookmark /> للمراجعة</>
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 border-t pt-4 text-center">
            <Button
              className="w-full md:w-auto bg-red-600 hover:bg-red-700"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'جاري التسليم...' : 'تسليم الامتحان'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// مكون عرض السؤال حسب النوع (مبسط)
const QuestionRenderer: React.FC<{ question: any; value: any; onChange: (val: any) => void }> = ({
  question,
  value,
  onChange,
}) => {
  if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
    return (
      <div className="space-y-2">
        {question.options.map((opt: any) => (
          <label key={opt.id} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
            <input
              type="radio"
              name={question.id}
              checked={value?.selectedOptionId === opt.id}
              onChange={() => onChange({ selectedOptionId: opt.id })}
            />
            {opt.optionText}
          </label>
        ))}
      </div>
    );
  }
  if (question.type === 'MULTIPLE_SELECT') {
    const selectedIds = value?.selectedOptionIds || [];
    return (
      <div className="space-y-2">
        {question.options.map((opt: any) => (
          <label key={opt.id} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
            <input
              type="checkbox"
              checked={selectedIds.includes(opt.id)}
              onChange={(e) => {
                const newSelected = e.target.checked
                  ? [...selectedIds, opt.id]
                  : selectedIds.filter((id: string) => id !== opt.id);
                onChange({ selectedOptionIds: newSelected });
              }}
            />
            {opt.optionText}
          </label>
        ))}
      </div>
    );
  }
  if (question.type === 'FILL_BLANK') {
    return (
      <input
        type="text"
        className="w-full p-2 border rounded"
        placeholder="اكتب إجابتك..."
        value={value?.answerText || ''}
        onChange={(e) => onChange({ answerText: e.target.value })}
      />
    );
  }
  if (question.type === 'ESSAY') {
    return (
      <textarea
        className="w-full p-2 border rounded h-40"
        placeholder="اكتب إجابتك هنا..."
        value={value?.answerText || ''}
        onChange={(e) => onChange({ answerText: e.target.value })}
      />
    );
  }
  return <div>نوع السؤال غير مدعوم</div>;
};
