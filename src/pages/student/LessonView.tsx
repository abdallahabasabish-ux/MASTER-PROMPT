import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { Lesson } from '../../types';
import ReactPlayer from 'react-player';
import { PDFViewer } from '../../components/PDFViewer';

export const LessonView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { get } = useApi();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get(`/api/student/lessons/${id}`).then(res => {
      setLesson(res.data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div>جاري التحميل...</div>;
  if (!lesson) return <div>الدرس غير موجود</div>;

  return (
    <div className="max-w-4xl mx-auto p-4" dir="rtl">
      <h1 className="text-2xl font-bold">{lesson.title}</h1>
      {lesson.coverImage && <img src={lesson.coverImage} alt="غلاف الدرس" className="my-4" />}
      <p>{lesson.description}</p>

      {/* الفيديوهات */}
      {lesson.videos.map(video => (
        <div key={video.id} className="my-4">
          <ReactPlayer url={video.url} controls width="100%" />
        </div>
      ))}

      {/* المحتوى النصي */}
      {lesson.content && (
        <div className="prose prose-lg" dangerouslySetInnerHTML={{ __html: lesson.content.content }} />
      )}

      {/* الملفات */}
      {lesson.files.map(file => (
        <div key={file.id} className="my-2 flex items-center">
          <span>{file.fileName}</span>
          {file.allowDownload ? (
            <a href={file.filePath} download className="btn btn-sm">تحميل</a>
          ) : (
            <button onClick={() => {/* عرض PDF في النافذة */}}>عرض</button>
          )}
        </div>
      ))}
    </div>
  );
};
