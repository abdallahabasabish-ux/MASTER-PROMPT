import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { Card, Badge, Button, Input, Select, Modal } from '../../components/ui';
import { Eye, CheckCircle, XCircle, UserX, UserCheck, Search, Trash2 } from 'lucide-react';

export const TeachersManagement: React.FC = () => {
  const { get, put, del } = useApi();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, [filters, pagination.page]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      params.append('page', pagination.page.toString());
      const res = await get(`/api/admin/teachers?${params.toString()}`);
      setTeachers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (teacherId: string, status: string) => {
    try {
      await put(`/api/admin/teachers/${teacherId}/status`, { status, reason });
      fetchTeachers();
      setModalOpen(false);
      setReason('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'حدث خطأ');
    }
  };

  const handleDelete = async (teacherId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المدرس وجميع محتوياته؟')) return;
    try {
      await del(`/api/admin/teachers/${teacherId}`);
      fetchTeachers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'حدث خطأ');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
      SUSPENDED: 'secondary',
    };
    const labels: any = {
      PENDING: '⏳ قيد الانتظار',
      APPROVED: '✅ معتمد',
      REJECTED: '❌ مرفوض',
      SUSPENDED: '⛔ معلق',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">إدارة المدرسين</h1>

      {/* الفلترة */}
      <div className="flex flex-wrap gap-2 mb-4 bg-gray-50 p-3 rounded">
        <Select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="w-40"
        >
          <option value="">جميع الحالات</option>
          <option value="PENDING">قيد الانتظار</option>
          <option value="APPROVED">معتمد</option>
          <option value="REJECTED">مرفوض</option>
          <option value="SUSPENDED">معلق</option>
        </Select>
        <Input
          placeholder="بحث بالاسم أو البريد..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="w-64"
        />
        <Button variant="outline" onClick={fetchTeachers}><Search size={16} /> بحث</Button>
      </div>

      {/* قائمة المدرسين */}
      {loading ? (
        <div>جاري التحميل...</div>
      ) : (
        <div className="space-y-3">
          {teachers.map(teacher => (
            <Card key={teacher.id} className="p-4">
              <div className="flex flex-wrap justify-between items-center">
                <div>
                  <p className="font-bold">{teacher.user.fullName}</p>
                  <p className="text-sm text-gray-500">{teacher.user.email}</p>
                  <p className="text-sm">
                    الصفوف: {teacher.gradeSubjects.map((gs: any) => gs.grade.name).join('، ')}
                  </p>
                  <p className="text-sm">
                    المواد: {teacher.gradeSubjects.map((gs: any) => gs.subject.name).join('، ')}
                  </p>
                  <div className="flex gap-2 mt-1">
                    {getStatusBadge(teacher.status)}
                    <span className="text-xs text-gray-400">
                      الدروس: {teacher.lessons.length} | واجبات: {teacher.assignments.length} | امتحانات: {teacher.exams.length}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedTeacher(teacher); setModalOpen(true); }}>
                    <Eye size={14} /> عرض
                  </Button>
                  {teacher.status === 'PENDING' && (
                    <>
                      <Button size="sm" variant="success" onClick={() => handleStatusChange(teacher.id, 'APPROVED')}>
                        <CheckCircle size={14} /> قبول
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleStatusChange(teacher.id, 'REJECTED')}>
                        <XCircle size={14} /> رفض
                      </Button>
                    </>
                  )}
                  {teacher.status === 'APPROVED' && (
                    <Button size="sm" variant="warning" onClick={() => handleStatusChange(teacher.id, 'SUSPENDED')}>
                      <UserX size={14} /> تعليق
                    </Button>
                  )}
                  {teacher.status === 'SUSPENDED' && (
                    <Button size="sm" variant="success" onClick={() => handleStatusChange(teacher.id, 'APPROVED')}>
                      <UserCheck size={14} /> تفعيل
                    </Button>
                  )}
                  <Button size="sm" variant="danger" onClick={() => handleDelete(teacher.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {teachers.length === 0 && <p className="text-gray-500">لا يوجد مدرسين</p>}
        </div>
      )}

      {/* الترقيم */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
            <Button
              key={page}
              size="sm"
              variant={page === pagination.page ? 'default' : 'outline'}
              onClick={() => setPagination({ ...pagination, page })}
            >
              {page}
            </Button>
          ))}
        </div>
      )}

      {/* مودال عرض تفاصيل المدرس */}
      {selectedTeacher && (
        <Modal open={modalOpen} onClose={() => { setModalOpen(false); setSelectedTeacher(null); }} title="تفاصيل المدرس">
          <div className="space-y-3">
            <p><strong>الاسم:</strong> {selectedTeacher.user.fullName}</p>
            <p><strong>البريد:</strong> {selectedTeacher.user.email}</p>
            <p><strong>الهاتف:</strong> {selectedTeacher.user.phone || 'غير متوفر'}</p>
            <p><strong>الخبرة:</strong> {selectedTeacher.experience || 'غير محددة'}</p>
            <p><strong>نبذة:</strong> {selectedTeacher.bio || 'لا توجد نبذة'}</p>
            <p><strong>الحالة:</strong> {getStatusBadge(selectedTeacher.status)}</p>
            <p><strong>تاريخ التسجيل:</strong> {new Date(selectedTeacher.createdAt).toLocaleDateString('ar-EG')}</p>
            {selectedTeacher.approvedAt && (
              <p><strong>تاريخ الاعتماد:</strong> {new Date(selectedTeacher.approvedAt).toLocaleDateString('ar-EG')}</p>
            )}
            <div className="border-t pt-2">
              <p className="font-bold">محتوى المدرس</p>
              <p>الدروس: {selectedTeacher.lessons.length}</p>
              <p>الواجبات: {selectedTeacher.assignments.length}</p>
              <p>الامتحانات: {selectedTeacher.exams.length}</p>
              <p>الأسئلة: {selectedTeacher.questions.length}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
