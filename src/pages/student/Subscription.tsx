import { useState } from "react";
import { db, storage } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../../context/AuthContext";
import { CreditCard, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function Subscription() {
  const { user, userData } = useAuth();
  const [method, setMethod] = useState("vodafone");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;
    setLoading(true);
    setError("");

    try {
      // 1. رفع الصورة إلى Storage
      const storageRef = ref(storage, `payments/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      // 2. إنشاء سجل دفع في Firestore
      await addDoc(collection(db, "payments"), {
        studentId: user.uid,
        studentName: userData?.name,
        method: method,
        amount: 150,
        proofImageUrl: fileUrl,
        status: "PENDING",
        createdAt: serverTimestamp()
      });

      // 3. تحديث حالة الطالب إلى PENDING (بانتظار المراجعة)
      await updateDoc(doc(db, "students", user.uid), {
        subscriptionStatus: "PENDING"
      });

      setSuccess(true);
    } catch (err) {
      setError("حدث خطأ أثناء رفع الإيصال. حاول مرة أخرى.");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">تم استلام إيصالك</h2>
          <p className="text-gray-400 mb-6">سيتم مراجعة الدفع وتفعيل اشتراكك من 1 إلى 24 ساعة.</p>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-black px-6 py-2 rounded font-bold">
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="bg-gray-900 min-h-screen p-4 sm:p-8 text-white">
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg border border-gray-700 p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <CreditCard className="text-orange-500" /> تفعيل الاشتراك الشهري
        </h1>

        <div className="bg-orange-500/10 border border-orange-500/30 text-orange-400 p-4 rounded-lg mb-6 text-sm">
          قيمة الاشتراك: 150 جنيه شهرياً. برجاء تحويل المبلغ إلى أحد الأرقام التالية ثم رفع الإيصال.
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">طريقة الدفع</label>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setMethod("vodafone")} 
                className={`p-4 rounded-lg border ${method === "vodafone" ? "border-orange-500 bg-orange-500/10" : "border-gray-600"}`}>
                فودافون كاش
              </button>
              <button type="button" onClick={() => setMethod("instapay")}
                className={`p-4 rounded-lg border ${method === "instapay" ? "border-orange-500 bg-orange-500/10" : "border-gray-600"}`}>
                إنستا باي
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">صورة الإيصال (Screenshot)</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700/50 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-400">{file ? file.name : "اضغط لاختيار صورة الإيصال"}</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
            </label>
          </div>

          <button type="submit" disabled={loading || !file}
            className="w-full bg-orange-500 text-black py-3 rounded-lg font-bold hover:bg-orange-600 transition flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري الإرسال...</> : "إرسال إيصال الدفع"}
          </button>
        </form>
      </div>
    </div>
  );
}
