import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { Input, Textarea, Button, Select, RichTextEditor } from '../../components/ui';

const lessonSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  unitId: z.string().min(1),
  order: z.number().min(0),
  content: z.string().optional(),
  videos: z.array(z.object({ provider: z.string(), url: z.string(), isMain: z.boolean() })).optional(),
  files: z.array(z.object({ fileName: z.string(), fileSize: z.number(), filePath: z.string(), allowDownload: z.boolean() })).optional(),
});

export const LessonCreate: React.FC = () => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(lessonSchema) });
  const { post } = useApi();

  const onSubmit = async (data: any) => {
    try {
      const response = await post('/api/teacher/lessons', { ...data, content });
      // توجيه إلى صفحة الدرس أو عرض رسالة نجاح
    } catch (err) {
      // عرض خطأ
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" dir="rtl">
      <Input label="عنوان الدرس" {...register('title')} error={errors.title?.message} />
      <Textarea label="وصف مختصر" {...register('description')} />
      <Select label="الوحدة" {...register('unitId')} options={/* جلب الوحدات من API */} />
      <Input label="ترتيب الدرس" type="number" {...register('order', { valueAsNumber: true })} />
      <RichTextEditor value={content} onChange={setContent} />
      {/* إضافة فيديوهات وملفات (يمكن استخدام حقول ديناميكية) */}
      <Button type="submit">حفظ كمسودة</Button>
    </form>
  );
};
