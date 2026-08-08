import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { Card, Badge, Button, Modal, Input } from '../../components/ui';
import { Eye, CheckCircle, XCircle } from 'lucide-react';

export const PaymentsManagement: React.FC = () => {
  const { get, put } = useApi();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [filterStatus]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const url = filterStatus ? `/api/admin/payments?status=${filterStatus}` : '/api/admin/payments';
      const res = await get(url);
      setPayments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (paymentId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await put(`/api/admin/payments/${paymentId}/review`, {
        action,
        rejectionReason: action === 'REJECT' ? rejectionReason : undefined,
      });
      alert('تمت المراجعة بنجاح');
      setSelectedPayment(null);
      fetchPayments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'حدث خطأ');
    }
  };

  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">إدارة المدفوعات</h1>

      {/* فلترة */}
      <div className="flex gap-2 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">جميع الحالات</option>
          <option value="PENDING">قيد المراجعة</option>
          <option value="APPROVED">مقبولة</option>
          <option value="REJECTED">مرفوضة</option>
        </select>
        <Button variant="outline" onClick={fetchPayments}>تحديث</Button>
      </div>

      {/* قائمة المدفوعات */}
      {loading ? (
        <div>جاري التحميل...</div>
      ) : (
        <div className="space-y-3">
          {payments.map(p => (
            <Card key={p.id} className="p-4">
              <div className="flex flex-wrap justify-between items-center">
                <div>
                  <p className="font-bold">{p.student.user.fullName}</p>
                  <p className="text-sm text-gray-500">{p.student.user.email}</p>
                  <p className="text-sm">{p.plan.name} - {p.amount} ج.م</p>
                  <p className="text-sm text-gray-500">طريقة الدفع: {p.paymentMethod}</p>
                </div>
                <div className="text-left">
                  <Badge variant={
                    p.status === 'APPROVED' ? 'success' :
                    p.status === 'PENDING' ? 'warning' :
                    'danger'
                  }>
                    {p.status === 'APPROVED' && '✅ مقبول'}
                    {p.status === 'PENDING' && '⏳ قيد المراجعة'}
                    {p.status === 'REJECTED' && '❌ مرفوض'}
                  </Badge>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedPayment(p)}
                    >
                      <Eye size={16} /> عرض
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {payments.length === 0 && <p>لا توجد مدفوعات</p>}
        </div>
      )}

      {/* مودال عرض التفاصيل والمراجعة */}
      {selectedPayment && (
        <Modal
          open={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title="تفاصيل الدفع"
        >
          <div className="space-y-3">
            <p><strong>الطالب:</strong> {selectedPayment.student.user.fullName}</p>
            <p><strong>البريد:</strong> {selectedPayment.student.user.email}</p>
            <p><strong>الخطة:</strong> {selectedPayment.plan.name}</p>
            <p><strong>المبلغ:</strong> {selectedPayment.amount} ج.م</p>
            <p><strong>طريقة الدفع:</strong> {selectedPayment.paymentMethod}</p>
            <p><strong>الحالة:</strong> {selectedPayment.status}</p>
            {selectedPayment.notes && <p><strong>ملاحظات:</strong> {selectedPayment.notes}</p>}
            
            <div>
              <strong>إثبات الدفع:</strong>
              {selectedPayment.proofImage ? (
                <a
                  href={selectedPayment.proofImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline block"
                >
                  عرض الصورة
                </a>
              ) : (
                <span className="text-red-500">لم يتم رفع إثبات</span>
              )}
            </div>

            {selectedPayment.status === 'PENDING' && (
              <div className="border-t pt-4 mt-4">
                {selectedPayment.rejectionReason && (
                  <div className="mb-2">
                    <p className="text-sm text-red-500">سبب الرفض السابق: {selectedPayment.rejectionReason}</p>
                  </div>
                )}
                <Input
                  placeholder="سبب الرفض (في حالة الرفض)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    onClick={() => handleReview(selectedPayment.id, 'APPROVE')}
                  >
                    <CheckCircle size={16} /> قبول
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleReview(selectedPayment.id, 'REJECT')}
                  >
                    <XCircle size={16} /> رفض
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
