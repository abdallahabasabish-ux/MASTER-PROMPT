import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { Card, Badge, Button, Input } from '../../components/ui';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export const Grading: React.FC = () => {
  const { get, post } = useApi();
  const [answers, setAnswers] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [marks, setMarks] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [type, setType] = useState<'assignment' | 'exam'>('assignment');

  useEffect(() => {
    fetchPendingAnswers();
  }, [type]);

  const fetchPendingAnswers = async () => {
    setLoading(true);
    try {
      const res = await get(`/api/teacher/grading/pending?type=${type}`);
      setAnswers(res.data);
      setCurrentIndex(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentAnswer = answers[currentIndex];

  const handleGrade = async () => {
    if (!currentAnswer) return;
    if (marks < 0 || marks > currentAnswer.question.marks) {
      alert(`الدرجة يجب أن تكون بين 0 و ${currentAnswer.question.marks}`);
      return;
    }

    try {
      await post(`/api/teacher/grading/answers/${currentAnswer.id}`, {
        marksAwarded: marks,
        feedback,
      });
      // إزالة الإجابة المصححة من القائمة
      setAnswers(answers.filter((_, i) => i !== currentIndex));
      if (currentIndex >= answers.length - 1) {
        setCurrentIndex(Math.max(0, answers.length - 2));
      }
      setMarks(0);
      setFeedback('');
      alert('تم تصحيح الإجابة بنجاح');
    } catch (err: any) {
      alert(err.response?.data?.error || 'حدث خطأ');
    }
  };

  if (loading) return <div>جاري التحميل...</div>;

  if (answers.length === 0) {
    return (
      <Card className="p-8 text-center" dir="rtl">
        <CheckCircle className="mx-auto text-green-500" size={48} />
        <h2 className="text-xl font-bold mt-2">لا توجد إجابات بحاجة للتصحيح</h2>
        <p className="text-gray-500">جميع الإجابات المقالية تم تصحيحها</p>
        <div className="flex gap-2 justify-center mt-4">
          <Button variant={type === 'assignment' ? 'default' : 'outline'} onClick={() => setType('assignment')}>
            واجبات
          </Button>
          <Button variant={type === 'exam' ? 'default' : 'outline'} onClick={() => setType('exam')}>
            امتحانات
          </Button>
        </div>
      </Card>
    );
  }

  const studentName = currentAnswer.submission
    ? currentAnswer.submission.student.user.fullName
    : currentAnswer.attempt.student.user.fullName;

  const title = currentAnswer.submission
    ? currentAnswer.submission.assignment.title
    : currentAnswer.attempt.exam.title;

  return (
    <div className="max-w-4xl mx-auto p-4" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">تصحيح الإجابات</h1>
        <div className="flex gap-2">
          <Button variant={type === 'assignment' ? 'default' : 'outline'} onClick={() => setType('assignment')}>
            واجبات
          </Button>
          <Button variant={type === 'exam' ? 'default' : 'outline'} onClick={() => setType('exam')}>
            امتحانات
          </Button>
        </div>
      </div>

      {/* التقدم */}
      <div className="flex justify-between text-sm text-gray-500 mb-2">
        <span>السؤال {currentIndex + 1} من {answers.length}</span>
        <span>الطالب: {studentName}</span>
        <span>الواجب: {title}</span>
      </div>

      <Card className="p-6">
        {/* السؤال */}
        <div className="mb-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">نوع السؤال: مقالي</span>
            <span className="text-sm font-bold">الدرجة: {currentAnswer.question.marks}</span>
          </div>
          <h3 className="text-lg font-semibold mt-2">{currentAnswer.question.questionText}</h3>
        </div>

        {/* إجابة الطالب */}
        <div className="bg-gray-50 p-4 rounded border mb-4">
          <h4 className="font-bold text-sm mb-2">إجابة الطالب:</h4>
          <p className="whitespace-pre-wrap">{currentAnswer.answerText || 'لم يقدم إجابة'}</p>
        </div>

        {/* التصحيح */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">الدرجة الممنوحة</label>
            <Input
              type="number"
              value={marks}
              onChange={(e) => setMarks(Number(e.target.value))}
              min={0}
              max={currentAnswer.question.marks}
              className="w-32"
            />
            <span className="text-xs text-gray-500 mr-2">من {currentAnswer.question.marks}</span>
          </div>

          <div>
            <label className="block text-sm font-medium">ملاحظات (اختياري)</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full p-2 border rounded"
              rows={2}
              placeholder="أضف ملاحظات للطالب..."
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
              >
                <ChevronRight /> السابق
              </Button>
              <Button
                variant="outline"
                disabled={currentIndex === answers.length - 1}
                onClick={() => setCurrentIndex(prev => prev + 1)}
              >
                التالي <ChevronLeft />
              </Button>
            </div>
            <Button variant="success" onClick={handleGrade}>
              <CheckCircle size={16} /> حفظ التصحيح
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
