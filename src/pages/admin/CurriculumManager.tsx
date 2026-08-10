import { useState, useEffect } from "react";
import { addStage, getStages, addGrade, getGrades, addLessonWithPdf } from "../../lib/curriculumService";

export default function CurriculumManager() {
  const [stages, setStages] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  
  // حقول النماذج
  const [stageName, setStageName] = useState("");
  const [gradeName, setGradeName] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonVideo, setLessonVideo] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [allowDownload, setAllowDownload] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    const data = await getStages();
    setStages(data);
  };

  const handleStageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stageId = e.target.value;
    setSelectedStage(stageId);
    const data = await getGrades(stageId);
    setGrades(data);
  };

  const handleAddStage = async () => {
    if (!stageName) return alert("أدخل اسم المرحلة");
    await addStage(stageName);
    setStageName("");
    fetchStages();
    alert("تمت إضافة المرحلة");
  };

  const handleAddGrade = async () => {
    if (!selectedStage || !gradeName) return alert("اختر المرحلة وأدخل اسم الصف");
    await addGrade(selectedStage, gradeName);
    setGradeName("");
    const data = await getGrades(selectedStage);
    setGrades(data);
    alert("تمت إضافة الصف");
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrade || !lessonTitle) return alert("اختر الصف وأدخل عنوان الدرس");
    setLoading(true);
    
    try {
      // مسار الوحدة (مبسط للتجربة - نفترض أنه يتم الإضافة مباشرة تحت الصف كوحدة افتراضية)
      const unitPath = `stages/${selectedStage}/grades/${selectedGrade}/terms/term1/units/unit1`;
      
      await addLessonWithPdf(unitPath, {
        title: lessonTitle,
        content: lessonContent,
        videoUrl: lessonVideo,
        allowDownload: allowDownload
      }, pdfFile);

      alert("تم نشر الدرس بنجاح!");
      setLessonTitle(""); setLessonVideo(""); setLessonContent(""); setPdfFile(null);
      setAllowDownload(false);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء رفع الدرس");
    }
    setLoading(false);
  };

  return (
    <div dir="rtl" className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">إدارة المناهج والدروس</h1>

      {/* قسم إضافة المرحلة */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">1. إضافة مرحلة دراسية</h2>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            placeholder="مثال: المرحلة الإعدادية"
            className="flex-1 p-2 border rounded"
          />
          <button onClick={handleAddStage} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">إضافة</button>
        </div>
      </div>

      {/* قسم إضافة الصف */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">2. إضافة صف دراسي</h2>
        <select 
          value={selectedStage}
          onChange={handleStageChange}
          className="w-full p-2 border rounded mb-2"
        >
          <option value="">اختر المرحلة</option>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={gradeName}
            onChange={(e) => setGradeName(e.target.value)}
            placeholder="مثال: الصف الأول الإعدادي"
            className="flex-1 p-2 border rounded"
            disabled={!selectedStage}
          />
          <button onClick={handleAddGrade} disabled={!selectedStage} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50">إضافة</button>
        </div>
      </div>

      {/* قسم إضافة الدرس */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">3. إضافة درس جديد (فيديو/PDF)</h2>
        <form onSubmit={handleAddLesson} className="space-y-4">
          <select 
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={!selectedStage}
          >
            <option value="">اختر الصف</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>

          <input 
            type="text" 
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
            placeholder="عنوان الدرس"
            className="w-full p-2 border rounded"
            required
          />
          
          <input 
            type="url" 
            value={lessonVideo}
            onChange={(e) => setLessonVideo(e.target.value)}
            placeholder="رابط فيديو YouTube أو رابط خارجي"
            className="w-full p-2 border rounded"
          />

          <textarea 
            value={lessonContent}
            onChange={(e) => setLessonContent(e.target.value)}
            placeholder="الشرح النصي للدرس"
            className="w-full p-2 border rounded h-24"
          />

          <div className="border-2 border-dashed p-4 rounded text-center">
            <label className="cursor-pointer text-blue-600 hover:underline">
              {pdfFile ? `تم اختيار: ${pdfFile.name}` : "رفع ملف PDF للدرس"}
              <input 
                type="file" 
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>

          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={allowDownload}
              onChange={(e) => setAllowDownload(e.target.checked)}
            />
            السماح للطالب بتحميل ملف PDF
          </label>

          <button 
            type="submit" 
            disabled={loading || !selectedGrade}
            className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "جاري النشر..." : "نشر الدرس"}
          </button>
        </form>
      </div>
    </div>
  );
}
