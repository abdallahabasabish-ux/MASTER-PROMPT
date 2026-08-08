import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { Card, Progress, Button } from '../../components/ui';
import { BookOpen, ClipboardCheck, FileText, Award, Clock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { get } = useApi();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/api/student/dashboard').then(res => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8">جاري تحميل لوحة التحكم...</div>;
  if (!data) return <div>حدث خطأ في تحميل البيانات</div>;

  const { student, stats, recentLessons, recentResults, upcomingAssignments, upcomingExams } = data;

  // حساب نسبة الإنجاز
  const completionRate = stats?.totalLessons > 0 
    ? Math.round((stats.completedLessons / stats.totalLessons) * 100) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto p-4" dir="rtl">
      {/* الترحيب */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">مرحباً، {student.user.fullName}</h1>
        <p className="text-gray-600">
          {student.grade?.stage?.name} - {student.grade?.name} - {student.term?.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`px-2 py-1 rounded text-sm ${
            student.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {student.subscriptionStatus === 'ACTIVE' ? '✅ اشتراك نشط' : '⛔ الاشتراك غير نشط'}
          </span>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 text-center">
          <BookOpen className="mx-auto text-blue-500" size={32} />
          <p className="text-2xl font-bold">{stats?.completedLessons || 0}/{stats?.totalLessons || 0}</p>
          <p className="text-sm text-gray-600">الدروس المكتملة</p>
        </Card>
        <Card className="p-4 text-center">
          <ClipboardCheck className="mx-auto text-green-500" size={32} />
          <p className="text-2xl font-bold">{stats?.completedAssignments || 0}/{stats?.totalAssignments || 0}</p>
          <p className="text-sm text-gray-600">الواجبات المنجزة</p>
        </Card>
        <Card className="p-4 text-center">
          <FileText className="mx-auto text-purple-500" size={32} />
          <p className="text-2xl font-bold">{stats?.completedExams || 0}/{stats?.totalExams || 0}</p>
          <p className="text-sm text-gray-600">الامتحانات المنجزة</p>
        </Card>
        <Card className="p-4 text-center">
          <Award className="mx-auto text-yellow-500" size={32} />
          <p className="text-2xl font-bold">{stats?.averageScore || 0}%</p>
          <p className="text-sm text-gray-600">متوسط الدرجات</p>
        </Card>
      </div>

      {/* شريط التقدم الكلي */}
      <Card className="p-4 mb-6">
        <div className="flex justify-between mb-2">
          <span className="font-semibold">نسبة الإنجاز الكلية</span>
          <span>{completionRate}%</span>
        </div>
        <Progress value={completionRate} className="h-3" />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* الدروس الأخيرة */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <h3 className="font-bold text-lg mb-3">آخر الدروس التي درستها</h3>
            {recentLessons.length === 0 ? (
              <p className="text-gray-500">لم تدرس أي درس بعد. ابدأ رحلتك التعليمية الآن!</p>
            ) : (
              <div className="space-y-3">
                {recentLessons.map((lp: any) => (
                  <Link to={`/student/lessons/${lp.lessonId}`} key={lp.id}>
                    <div className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 transition">
                      <div>
                        <p className="font-medium">{lp.lesson.title}</p>
                        <p className="text-sm text-gray-500">{lp.lesson.unit.subject.name}</p>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded ${
                        lp.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {lp.status === 'COMPLETED' ? '✅ مكتمل' : '🔄 قيد التقدم'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* النتائج الأخيرة */}
        <div>
          <Card className="p-4">
            <h3 className="font-bold text-lg mb-3">آخر النتائج</h3>
            {recentResults.length === 0 ? (
              <p className="text-gray-500">لا توجد نتائج حتى الآن</p>
            ) : (
              <div className="space-y-3">
                {recentResults.map((r: any) => {
                  const title = r.submission?.assignment?.title || r.examAttempt?.exam?.title || 'بدون عنوان';
                  const type = r.submission ? 'واجب' : 'امتحان';
                  return (
                    <div key={r.id} className="flex justify-between items-center p-2 border-b">
                      <div>
                        <p className="text-sm font-medium">{title}</p>
                        <p className="text-xs text-gray-500">{type}</p>
                      </div>
                      <span className={`font-bold ${
                        r.percentage >= 80 ? 'text-green-600' : r.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {r.obtainedMarks}/{r.totalMarks}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* العناصر القادمة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card className="p-4">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Clock className="text-blue-500" /> الواجبات القادمة
          </h3>
          {upcomingAssignments.length === 0 ? (
            <p className="text-gray-500">لا توجد واجبات قادمة</p>
          ) : (
            upcomingAssignments.map((a: any) => (
              <div key={a.id} className="p-2 border-b">
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-gray-500">يبدأ: {new Date(a.startDate).toLocaleDateString('ar-EG')}</p>
              </div>
            ))
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Clock className="text-purple-500" /> الامتحانات القادمة
          </h3>
          {upcomingExams.length === 0 ? (
            <p className="text-gray-500">لا توجد امتحانات قادمة</p>
          ) : (
            upcomingExams.map((e: any) => (
              <div key={e.id} className="p-2 border-b">
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-gray-500">يبدأ: {new Date(e.startDate).toLocaleDateString('ar-EG')}</p>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* روابط سريعة */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <Link to="/student/lessons">
          <Button className="w-full">📚 الذهاب إلى الدروس</Button>
        </Link>
        <Link to="/student/assignments">
          <Button variant="outline" className="w-full">📝 الواجبات</Button>
        </Link>
        <Link to="/student/exams">
          <Button variant="outline" className="w-full">📋 الامتحانات</Button>
        </Link>
      </div>
    </div>
  );
};
