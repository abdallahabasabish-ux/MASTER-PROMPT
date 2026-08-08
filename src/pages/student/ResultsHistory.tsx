import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { Card, Badge } from '../../components/ui';

export const ResultsHistory: React.FC = () => {
  const { get } = useApi();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/api/student/results').then(res => {
      setResults(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>جاري تحميل النتائج...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">سجل النتائج</h1>
      <Card className="p-4">
        {results.length === 0 ? (
          <p className="text-gray-500 text-center py-8">لا توجد نتائج مسجلة حتى الآن</p>
        ) : (
          <div className="space-y-4">
            {results.map((r) => (
              <div key={r.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-bold">{r.title}</p>
                  <div className="flex gap-2 text-sm text-gray-500">
                    <span>{r.type}</span>
                    <span>•</span>
                    <span>{new Date(r.createdAt).toLocaleDateString('ar-EG')}</span>
                    <Badge variant={r.status === 'COMPLETED' ? 'success' : 'warning'}>
                      {r.status === 'COMPLETED' ? 'مكتمل' : 'قيد التصحيح'}
                    </Badge>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold">
                    {r.obtainedMarks} / {r.totalMarks}
                  </p>
                  <p className={`text-sm ${
                    r.percentage >= 80 ? 'text-green-600' : r.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {r.percentage}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
