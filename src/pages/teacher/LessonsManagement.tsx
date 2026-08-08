import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { Card, Badge, Button, Input, Select } from '../../components/ui';
import { Link } from 'react-router-dom';
import { Plus, Edit, Eye, Trash2, CheckCircle, Archive } from 'lucide-react';

export const LessonsManagement: React.FC = () => {
  const { get, del, put } = useApi();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', gradeId: '' });
  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lessonsRes, gradesRes] = await Promise.all([
          get('/api/teacher/lessons'),
          get('/api/teacher/grades'), // نفترض وجود هذا الـ endpoint
        ]);
        setLessons(lessonsRes.data);
        setGrades(gradesRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFilter = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.gradeId) params.append('gradeId', filter.gradeId);
      const res = await get(`/api/teacher/lessons?${params.toString()}`);
      setLessons(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;
    try {
      await del(`/api/teacher/lessons/${id}`);
      setLessons(lessons.filter(l => l.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'حدث خطأ');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await post(`/api/teacher/lessons/${id}/publish`);
      setLessons(lessons.map(l =>
        l.id === id ? { ...l, status: 'PUBLISHED' } : l
      ));
    } catch (err: any) {
      alert(err.response?.data?.error || 'حدث خطأ');
    }
  };

  return (
    <div className="p-4" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">إدارة الدروس</h1>
        <Link to="/teacher/lessons/create">
          <Button><Plus size={16} /> درس جديد</Button>
        </Link>
      </div>

      {/* الفلترة */}
      <div className="flex flex-wrap gap-2 mb-4 bg-gray-50 p-3 rounded">
        <Select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          placeholder="الحالة"
          className="w-32"
        >
          <option value="">جميع الحالات</option>
          <option value="DRAFT">مسودة</option>
          <option value="PUBLISHED">منشور</option>
          <option value="ARCHIVED">مؤرشف</option>
        </Select>
        <Select
          value={filter.gradeId}
          onChange={(e) => setFilter({ ...filter, gradeId: e.target.value })}
          placeholder="الصف"
          className="w-40"
        >
          <option value="">جميع الصفوف</option>
          {grades.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </Select>
        <Button variant="outline" onClick={handleFilter}>بحث</Button>
      </div>

      {/* قائمة الدروس */}
      {loading ? (
        <div>جاري التحميل...</div>
      ) : lessons.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">لا توجد دروس</p>
          <Link to="/teacher/lessons/create">
            <Button variant="outline" className="mt-2">إنشاء أول درس</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map(lesson => (
            <Card key={lesson.id} className="p-4 hover:shadow-lg transition">
              {lesson.coverImage && (
                <img
                  src={lesson.coverImage}
                  alt={lesson.title}
                  className="w-full h-32 object-cover rounded mb-2"
                />
              )}
              <h3 className="font-bold text-lg">{lesson.title}</h3>
              <p className="text-sm text-gray-500">{lesson.unit.subject.name} - {lesson.unit.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={
                  lesson.status === 'PUBLISHED' ? 'success' :
                  lesson.status === 'DRAFT' ? 'warning' : 'secondary'
                }>
                  {lesson.status === 'PUBLISHED' ? 'منشور' :
                   lesson.status === 'DRAFT' ? 'مسودة' : 'مؤرشف'}
                </Badge>
                <span className="text-xs text-gray-400">
                  {lesson.assignments?.length || 0} واجب
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <Link to={`/teacher/lessons/${lesson.id}`}>
                  <Button size="sm" variant="outline"><Eye size={14} /> عرض</Button>
                </Link>
                <Link to={`/teacher/lessons/${lesson.id}/edit`}>
                  <Button size="sm" variant="outline"><Edit size={14} /> تعديل</Button>
                </Link>
                {lesson.status === 'DRAFT' && (
                  <Button size="sm" variant="success" onClick={() => handlePublish(lesson.id)}>
                    <CheckCircle size={14} /> نشر
                  </Button>
                )}
                {lesson.status !== 'ARCHIVED' && (
                  <Button size="sm" variant="warning" onClick={() => handleArchive(lesson.id)}>
                    <Archive size={14} /> أرشيف
                  </Button>
                )}
                <Button size="sm" variant="danger" onClick={() => handleDelete(lesson.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
