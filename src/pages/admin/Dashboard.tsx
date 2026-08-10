import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { Card, Badge } from '../../components/ui';
import {
  Users, UserPlus, BookOpen, ClipboardCheck, FileText,
  DollarSign, CreditCard, Clock, TrendingUp, Activity
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { get } = useApi();
  const [stats, setStats] = useState<any>(null);
  const [revenueData, setRevenueData] = useState([]);
  const [registrationsData, setRegistrationsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, revenueRes, registrationsRes] = await Promise.all([
          get('/api/admin/stats'),
          get('/api/admin/stats/revenue'),
          get('/api/admin/stats/registrations'),
        ]);
        setStats(statsRes.data);
        setRevenueData(revenueRes.data);
        setRegistrationsData(registrationsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>جاري تحميل لوحة التحكم...</div>;
  if (!stats) return <div>حدث خطأ في تحميل البيانات</div>;

  const statCards = [
    { label: 'الطلاب', value: stats.totalStudents, icon: Users, color: 'blue' },
    { label: 'المدرسين', value: stats.totalTeachers, icon: UserPlus, color: 'green' },
    { label: 'مدرسين بانتظار الموافقة', value: stats.pendingTeachers, icon: Clock, color: 'yellow' },
    { label: 'الدروس المنشورة', value: stats.publishedLessons, icon: BookOpen, color: 'indigo' },
    { label: 'الواجبات المنشورة', value: stats.publishedAssignments, icon: ClipboardCheck, color: 'purple' },
    { label: 'الامتحانات المنشورة', value: stats.publishedExams, icon: FileText, color: 'pink' },
    { label: 'اشتراكات نشطة', value: stats.activeSubscriptions, icon: CreditCard, color: 'green' },
    { label: 'اشتراكات منتهية', value: stats.expiredSubscriptions, icon: CreditCard, color: 'red' },
    { label: 'مدفوعات معلقة', value: stats.pendingPayments, icon: Clock, color: 'yellow' },
    { label: 'إجمالي الإيرادات', value: `${stats.totalRevenue} ج.م`, icon: DollarSign, color: 'green' },
  ];

  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">لوحة التحكم</h1>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {statCards.map((card, index) => (
          <Card key={index} className="p-4 text-center">
            <card.icon className={`mx-auto text-${card.color}-500`} size={28} />
            <p className="text-xl font-bold mt-1">{card.value}</p>
            <p className="text-sm text-gray-600">{card.label}</p>
          </Card>
        ))}
      </div>

      {/* النشاطات الأخيرة */}
      <div className="mb-6">
        <Card className="p-4">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Activity size={20} /> آخر النشاطات
          </h3>
          {stats.recentActivities.length === 0 ? (
            <p className="text-gray-500">لا توجد نشاطات</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.recentActivities.map((log: any) => (
                <div key={log.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <span className="font-medium">{log.user.fullName}</span>
                    <span className="text-sm text-gray-500 mr-2">{log.action}</span>
                    <span className="text-xs text-gray-400">{log.targetType}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(log.timestamp).toLocaleString('ar-EG')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-bold mb-3">الإيرادات الشهرية</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" name="الإيرادات (ج.م)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4">
          <h3 className="font-bold mb-3">التسجيلات الشهرية</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={registrationsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#10b981" name="عدد المسجلين" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
