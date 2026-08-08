import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Badge } from '../../components/ui';
import { CreditCard, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SubscriptionPage: React.FC = () => {
  const { get, post, upload } = useApi();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('VODAFONE_CASH');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, statusRes, paymentsRes] = await Promise.all([
          get('/api/student/plans'),
          get('/api/student/status'),
          get('/api/student/payments'),
        ]);
        setPlans(plansRes.data);
        setStatus(statusRes.data);
        setPayments(paymentsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreatePayment = async () => {
    if (!selectedPlan) return alert('يرجى اختيار خطة أولاً');
    setSubmitting(true);
    try {
      const res = await post('/api/student/payments', {
        planId: selectedPlan,
        paymentMethod,
        notes,
      });
      const payment = res.data;
      // إذا كان هناك ملف مرفق، نرفعه
      if (proofFile) {
        const formData = new FormData();
        formData.append('proofImage', proofFile);
        await upload(`/api/student/payments/${payment.id}/proof`, formData);
      }
      alert('تم إنشاء طلب الدفع بنجاح. سيتم مراجعته من قبل الإدارة.');
      navigate('/student/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.error || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">الاشتراك والدفع</h1>

      {/* حالة الاشتراك الحالية */}
      <Card className="p-4 mb-6">
        <h3 className="font-bold">حالة اشتراكك الحالية</h3>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={
            status?.subscriptionStatus === 'ACTIVE' ? 'success' :
            status?.subscriptionStatus === 'PENDING' ? 'warning' :
            status?.subscriptionStatus === 'EXPIRED' ? 'danger' : 'secondary'
          }>
            {status?.subscriptionStatus === 'ACTIVE' && '✅ نشط'}
            {status?.subscriptionStatus === 'PENDING' && '⏳ معلق (بانتظار الدفع)'}
            {status?.subscriptionStatus === 'EXPIRED' && '❌ منتهي'}
            {status?.subscriptionStatus === 'SUSPENDED' && '⛔ معلق'}
          </Badge>
          {status?.subscriptionEnd && (
            <span className="text-sm text-gray-600">
              ينتهي في: {new Date(status.subscriptionEnd).toLocaleDateString('ar-EG')}
            </span>
          )}
        </div>
      </Card>

      {/* خطط الاشتراك */}
      <h3 className="text-xl font-bold mb-3">خطط الاشتراك</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {plans.map(plan => (
          <Card
            key={plan.id}
            className={`p-4 cursor-pointer transition border-2 ${
              selectedPlan === plan.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <h4 className="font-bold text-lg">{plan.name}</h4>
            <p className="text-2xl font-bold text-blue-600">{plan.price} ج.م</p>
            <p className="text-sm text-gray-500">لمدة {plan.durationDays} يوم</p>
            <p className="text-sm">{plan.description}</p>
            {selectedPlan === plan.id && (
              <Badge variant="success" className="mt-2">✓ مختار</Badge>
            )}
          </Card>
        ))}
      </div>

      {/* تفاصيل الدفع */}
      {selectedPlan && (
        <Card className="p-4 mb-6">
          <h3 className="font-bold mb-3">تفاصيل الدفع</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium">طريقة الدفع</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border rounded mt-1"
              >
                <option value="VODAFONE_CASH">فودافون كاش</option>
                <option value="ORANGE_CASH">أورنج كاش</option>
                <option value="INSTAPAY">إنستا باي</option>
              </select>
            </div>

            {/* تعليمات الدفع (يمكن جلبها من API) */}
            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <p className="text-sm font-semibold">📌 تعليمات الدفع</p>
              <p className="text-sm">
                قم بتحويل المبلغ إلى الرقم التالي: <strong>0123456789</strong> (فودافون كاش).
                ثم قم برفع صورة الإيصال أدناه.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium">ملاحظات (اختياري)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border rounded mt-1"
                rows={2}
                placeholder="أي معلومات إضافية ..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium">إثبات الدفع (صورة الإيصال)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
              {proofFile && <p className="text-sm text-green-600 mt-1">✓ {proofFile.name}</p>}
            </div>

            <Button
              onClick={handleCreatePayment}
              disabled={submitting || !proofFile}
              className="w-full"
            >
              {submitting ? 'جاري الإرسال...' : 'إرسال طلب الدفع'}
            </Button>
          </div>
        </Card>
      )}

      {/* سجل المدفوعات */}
      <h3 className="text-xl font-bold mb-3">سجل المدفوعات</h3>
      <div className="space-y-2">
        {payments.length === 0 ? (
          <p className="text-gray-500">لا توجد مدفوعات سابقة</p>
        ) : (
          payments.map(p => (
            <div key={p.id} className="flex justify-between items-center p-3 border rounded">
              <div>
                <p className="font-bold">{p.plan.name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(p.createdAt).toLocaleDateString('ar-EG')}
                </p>
              </div>
              <div className="text-left">
                <p className="font-bold">{p.amount} ج.م</p>
                <Badge variant={
                  p.status === 'APPROVED' ? 'success' :
                  p.status === 'PENDING' ? 'warning' :
                  p.status === 'REJECTED' ? 'danger' : 'secondary'
                }>
                  {p.status === 'APPROVED' && '✅ مقبول'}
                  {p.status === 'PENDING' && '⏳ قيد المراجعة'}
                  {p.status === 'REJECTED' && '❌ مرفوض'}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
