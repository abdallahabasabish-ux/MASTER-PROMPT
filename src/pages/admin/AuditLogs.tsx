import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { Card, Badge, Button, Input, Select } from '../../components/ui';
import { Search, Filter } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const { get } = useApi();
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    targetType: '',
    userId: '',
    fromDate: '',
    toDate: '',
  });
  const [actions, setActions] = useState<string[]>([]);
  const [targetTypes, setTargetTypes] = useState<string[]>([]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [actionsRes, typesRes] = await Promise.all([
          get('/api/admin/audit-logs/actions'),
          get('/api/admin/audit-logs/target-types'),
        ]);
        setActions(actionsRes.data);
        setTargetTypes(typesRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.targetType) params.append('targetType', filters.targetType);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      params.append('page', pagination.page.toString());
      const res = await get(`/api/admin/audit-logs?${params.toString()}`);
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">سجلات التدقيق</h1>

      {/* الفلترة */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4 bg-gray-50 p-3 rounded">
        <Select
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          placeholder="الإجراء"
        >
          <option value="">جميع الإجراءات</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </Select>
        <Select
          value={filters.targetType}
          onChange={(e) => setFilters({ ...filters, targetType: e.target.value })}
          placeholder="النوع"
        >
          <option value="">جميع الأنواع</option>
          {targetTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Input
          type="date"
          value={filters.fromDate}
          onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
          placeholder="من تاريخ"
        />
        <Input
          type="date"
          value={filters.toDate}
          onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
          placeholder="إلى تاريخ"
        />
        <Button variant="outline" onClick={fetchLogs}><Search size={16} /> بحث</Button>
      </div>

      {/* جدول السجلات */}
      {loading ? (
        <div>جاري التحميل...</div>
      ) : (
        <Card className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-right p-2">المستخدم</th>
                <th className="text-right p-2">الإجراء</th>
                <th className="text-right p-2">النوع</th>
                <th className="text-right p-2">المعرف</th>
                <th className="text-right p-2">التفاصيل</th>
                <th className="text-right p-2">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <div className="font-medium">{log.user.fullName}</div>
                    <div className="text-xs text-gray-500">{log.user.email}</div>
                  </td>
                  <td className="p-2"><Badge variant="secondary">{log.action}</Badge></td>
                  <td className="p-2">{log.targetType}</td>
                  <td className="p-2 text-xs">{log.targetId || '—'}</td>
                  <td className="p-2 text-xs max-w-xs truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : '—'}
                  </td>
                  <td className="p-2 text-xs">
                    {new Date(log.timestamp).toLocaleString('ar-EG')}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} className="text-center p-4 text-gray-500">لا توجد سجلات</td></tr>
              )}
            </tbody>
          </table>
        </Card>
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
    </div>
  );
};
