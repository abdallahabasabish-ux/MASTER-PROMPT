import { db, storage } from "./firebase";
import { 
  collection, addDoc, getDocs, query, where, doc, setDoc, getDoc 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// 1. إضافة مرحلة دراسية
export const addStage = async (name: string) => {
  await addDoc(collection(db, "stages"), { name });
};

// 2. إضافة صف لمرحلة معينة
export const addGrade = async (stageId: string, name: string) => {
  await addDoc(collection(db, `stages/${stageId}/grades`), { name });
};

// 3. إضافة وحدة لصف معين
export const addUnit = async (stageId: string, gradeId: string, termId: string, name: string) => {
  await addDoc(collection(db, `stages/${stageId}/grades/${gradeId}/terms/${termId}/units`), { name });
};

// 4. إضافة درس مع رفع PDF
export const addLessonWithPdf = async (
  unitPath: string, 
  lessonData: { title: string; content: string; videoUrl: string; allowDownload: boolean },
  pdfFile: File | null
) => {
  let pdfUrl = "";

  // رفع ملف PDF إلى Firebase Storage
  if (pdfFile) {
    const storageRef = ref(storage, `lessons/${Date.now()}_${pdfFile.name}`);
    await uploadBytes(storageRef, pdfFile);
    pdfUrl = await getDownloadURL(storageRef);
  }

  // حفظ الدرس في Firestore
  await addDoc(collection(db, `${unitPath}/lessons`), {
    ...lessonData,
    pdfUrl,
    status: "PUBLISHED", // يمكن جعله DRAFT
    createdAt: new Date()
  });
};

// جلب المراحل
export const getStages = async () => {
  const q = query(collection(db, "stages"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// جلب الصفوف لمرحلة معينة
export const getGrades = async (stageId: string) => {
  const q = query(collection(db, `stages/${stageId}/grades`));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
