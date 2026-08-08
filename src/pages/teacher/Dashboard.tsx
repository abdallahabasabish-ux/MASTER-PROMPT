import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { Card, Badge, Button } from '../../components/ui';
import { Link } from 'react-router-dom';
import {
  BookOpen, Users, ClipboardCheck, FileText, TrendingUp,
  Clock, CheckCircle, AlertCircle
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { get } = useApi();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/api/teacher/dashboard').then(res => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8">جاري تحميل لوحة التحكم...</div>;
  if (!data) return <div>حدث خطأ في تحميل البيانات</div>;

  const { stats, recentLessons, recentSubmissions, gradeSubjects } = data;

  return (
    <div className="max-w-7xl mx-auto p-4" dir="rtl">
      {/* الترحيب */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">مرحباً، {data.teacher.user.fullName}</h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="success">✅ معتمد</Badge>
          <span className="text-sm text-gray-500">
            الصفوف: {gradeSubjects.map((gs: any) => gs.grade.name).join('، ')}
          </span>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 text-center">
          <BookOpen className="mx-auto text-blue-500" size={32} />
          <p className="text-2xl font-bold">{stats.totalLessons}</p>
          <p className="text-sm text-gray-600">الدروس ({stats.publishedLessons} منشور)</p>
        </Card>
        <Card className="p-4 text-center">
          <ClipboardCheck className="mx-auto text-green-500" size={32} />
          <p className="text-2xl font-bold">{stats.totalAssignments}</p>
          <p className="text-sm text-gray-600">الواجبات ({stats.publishedAssignments} منشور)</p>
        </Card>
        <Card className="p-4 text-center">
          <FileText className="mx-auto text-purple-500" size={32} />
          <p className="text-2xl font-bold">{stats.totalExams}</p>
          <p className="text-sm text-gray-600">الامتحانات ({stats.publishedExams} منشور)</p>
        </Card>
        <Card className="p-4 text-center">
          <Users className="mx-auto text-orange-500" size={32} />
          <p className="text-2xl font-bold">{stats.totalStudents}</p>
          <p className="text-sm text-gray-600">الطلاب النشطاء</p>
        </Card>
      </div>

      {/* بطاقات إضافية */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={20} />
            <span>إجمالي التسليمات: {stats.totalSubmissions}</span>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={20} />
            <span>محاولات الامتحانات: {stats.totalAttempts}</span>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-yellow-500" size={20} />
            <span>مسودات: {stats.draftLessons}</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* آخر الدروس */}
        <Card className="p-4">
          <h3 className="font-bold text-lg mb-3">آخر الدروس</h3>
          {recentLessons.length === 0 ? (
            <p className="text-gray-500">لم تقم بإنشاء أي درس بعد</p>
          ) : (
            <div className="space-y-2">
              {recentLessons.map((lesson: any) => (
                <Link to={`/teacher/lessons/${lesson.id}`} key={lesson.id}>
                  <div className="flex justify-between items-center p-2 border-b hover:bg-gray-50">
                    <div>
                      <p className="font-medium">{lesson.title}</p>
                      <p className="text-xs text-gray-500">{lesson.unit.subject.name}</p>
                    </div>
                    <Badge variant={
                      lesson.status === 'PUBLISHED' ? 'success' :
                      lesson.status === 'DRAFT' ? 'warning' : 'secondary'
                    }>
                      {lesson.status === 'PUBLISHED' ? 'منشور' :
                       lesson.status === 'DRAFT' ? 'مسودة' : 'مؤرشف'}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link to="/teacher/lessons" className="text-blue-500 text-sm mt-2 block">
            عرض جميع الدروس →
          </Link>
        </Card>

        {/* آخر التسليمات */}
        <Card className="p-4">
          <h3 className="font-bold text-lg mb-3">آخر تسليمات الطلاب</h3>
          {recentSubmissions.length === 0 ? (
            <p className="text-gray-500">لا توجد تسليمات جديدة</p>
          ) : (
            <div className="space-y-2">
              {recentSubmissions.map((sub: any) => (
                <div key={sub.id} className="flex justify-between items-center p-2 border-b">
                  <div>
                    <p className="font-medium">{sub.student.user.fullName}</p>
                    <p className="text-xs text-gray-500">{sub.assignment.title}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(sub.submittedAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link to="/teacher/grading" className="text-blue-500 text-sm mt-2 block">
            الذهاب للتصحيح →
          </Link>
        </Card>
      </div>

      {/* روابط سريعة */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/teacher/lessons/create">
          <Button className="w-full">📝 درس جديد</Button>
        </Link>
        <Link to="/teacher/assignments/create">
          <Button variant="outline" className="w-full">📋 واجب جديد</Button>
        </Link>
        <Link to="/teacher/exams/create">
          <Button variant="outline" className="w-full">📊 امتحان جديد</Button>
        </Link>
        <Link to="/teacher/questions">
          <Button variant="outline" className="w-full">📚 بنك الأسئلة</Button>
        </Link>
      </div>
    </div>
  );
};
