import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    // جلب المدفوعات المعلقة فقط
    const q = query(collection(db, "payments"), where("status", "==", "PENDING"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (paymentId: string, studentId: string) => {
    setProcessingId(paymentId);
    try {
      // 1. تحديث حالة الدفع إلى APPROVED
      await updateDoc(doc(db, "payments", paymentId), { status: "APPROVED" });
      
      // 2. تفعيل اشتراك الطالب
      await updateDoc(doc(db, "students", studentId), {
        subscriptionStatus: "ACTIVE"
      });
      
      alert("تم تفعيل اشتراك الطالب بنجاح!");
    } catch (error) {
      alert("حدث خطأ أثناء الموافقة على الدفع.");
    }
    setProcessingId(null);
  };

  const handleReject = async (paymentId: string, studentId: string) => {
    setProcessingId(paymentId);
    try {
      await updateDoc(doc(db, "payments", paymentId), { status: "REJECTED" });
      await updateDoc(doc(db, "students", studentId), {
        subscriptionStatus: "REJECTED"
      });
      alert("تم رفض الإيصال.");
    } catch (error) {
      alert("حدث خطأ أثناء الرفض.");
    }
    setProcessingId(null);
  };

  if (loading) return <div className="text-white p-8 text-center">جاري تحميل المدفوعات...</div>;

  return (
    <div dir="rtl" className="bg-gray-900 min-h-screen p-4 sm:p-8 text-white">
      <h1 className="text-2xl font-bold mb-6">إدارة المدفوعات المعلقة</h1>
      
      {payments.length === 0 ? (
        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center text-gray-400">
          لا توجد مدفوعات معلقة حالياً.
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((pay) => (
            <div key={pay.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg">{pay.studentName}</h3>
                <p className="text-gray-400 text-sm">طريقة الدفع: {pay.method === "vodafone" ? "فودافون كاش" : "إنستا باي"}</p>
                <p className="text-gray-400 text-sm">المبلغ: {pay.amount} جنيه</p>
              </div>
              
              <a href={pay.proofImageUrl} target="_blank" rel="noreferrer" 
                 className="text-orange-500 hover:underline flex items-center gap-1 text-sm mb-2 md:mb-0">
                <ExternalLink className="w-4 h-4" /> عرض الإيصال
              </a>

              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => handleApprove(pay.id, pay.studentId)} 
                  disabled={processingId === pay.id}
                  className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center justify-center gap-1 text-sm font-bold disabled:opacity-50">
                  {processingId === pay.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  موافقة
                </button>
                <button 
                  onClick={() => handleReject(pay.id, pay.studentId)} 
                  disabled={processingId === pay.id}
                  className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 px-4 py-2 rounded flex items-center justify-center gap-1 text-sm font-bold disabled:opacity-50">
                  <XCircle className="w-4 h-4" /> رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
