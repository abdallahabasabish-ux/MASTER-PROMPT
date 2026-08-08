import { PrismaClient, User, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

export class AuthService {
  static async register(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: Role;
    studentData?: {
      stageId?: string;
      gradeId?: string;
      termId?: string;
      parentPhone?: string;
    };
    teacherData?: {
      bio?: string;
      experience?: string;
    };
  }) {
    // التحقق من وجود البريد
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('البريد الإلكتروني مستخدم بالفعل');

    // تشفير كلمة المرور
    const hash = await bcrypt.hash(data.password, 10);

    // إنشاء المستخدم
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hash,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role || 'STUDENT',
      },
    });

    // إنشاء السجلات المرتبطة
    if (user.role === 'STUDENT' && data.studentData) {
      await prisma.student.create({
        data: {
          userId: user.id,
          stageId: data.studentData.stageId,
          gradeId: data.studentData.gradeId,
          termId: data.studentData.termId,
          parentPhone: data.studentData.parentPhone,
          subscriptionStatus: 'PENDING',
        },
      });
    }

    if (user.role === 'TEACHER' && data.teacherData) {
      await prisma.teacher.create({
        data: {
          userId: user.id,
          bio: data.teacherData.bio,
          experience: data.teacherData.experience,
          status: 'PENDING',
        },
      });
    }

    // إنشاء توكنات
    return this.generateTokens(user);
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');

    return this.generateTokens(user);
  }

  static async refreshToken(refreshToken: string) {
    // التحقق من التوكن
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new Error('المستخدم غير موجود');

    // يمكن التحقق من وجود التوكن في قاعدة البيانات (مخزن)
    // نكتفي بالتحقق من صحة التوقيع
    return this.generateTokens(user);
  }

  static generateTokens(user: User) {
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );
    return { accessToken, refreshToken };
  }

  static async forgotPassword(email: string) {
    // توليد رمز إعادة تعيين (يمكن تخزينه في جدول مؤقت)
    // لكن سنقوم بإرسال رابط مع JWT قصير الأجل
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('المستخدم غير موجود');

    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '1h' }
    );
    // إرسال البريد (نفترض وجود خدمة)
    // return resetToken;
  }

  static async resetPassword(token: string, newPassword: string) {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new Error('المستخدم غير موجود');

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash },
    });
  }
}
