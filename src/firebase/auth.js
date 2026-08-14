import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  reload,
  verifyBeforeUpdateEmail,
} from 'firebase/auth';
import { auth } from './init.js';
import { db } from './init.js';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Register new user
export async function registerUser(email, password, userData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile
    await updateProfile(user, {
      displayName: `${userData.firstName} ${userData.lastName}`,
    });

    // Create user document
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: `${userData.firstName} ${userData.lastName}`,
      role: 'student',
      status: 'pending',
      verified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create student document
    await setDoc(doc(db, 'students', user.uid), {
      uid: user.uid,
      firstName: userData.firstName,
      lastName: userData.lastName,
      grade: userData.grade,
      stage: userData.stage,
      governorate: userData.governorate,
      guardian: {
        name: userData.guardianName,
        phone: userData.guardianPhone,
        phoneVerified: false,
      },
      status: 'pending',
      enrolledAt: serverTimestamp(),
    });

    // Send verification email
    await sendEmailVerification(user);

    return { success: true, user };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
}

// Login user
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if email is verified
    if (!user.emailVerified) {
      // Re-send verification email
      await sendEmailVerification(user);
      return {
        success: false,
        error: 'email_not_verified',
        message: 'يرجى تفعيل حسابك عبر البريد الإلكتروني. تم إعادة إرسال رابط التفعيل.',
      };
    }

    // Check user status
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.status === 'suspended') {
        await signOut(auth);
        return {
          success: false,
          error: 'account_suspended',
          message: 'تم تعليق حسابك. يرجى التواصل مع الإدارة.',
        };
      }

      // Update last login
      await updateDoc(doc(db, 'users', user.uid), {
        lastLogin: serverTimestamp(),
      });
    }

    return { success: true, user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

// Logout user
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

// Reset password
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: error.message };
  }
}

// Resend verification email
export async function resendVerificationEmail() {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'no_user', message: 'الرجاء تسجيل الدخول أولاً' };
    }
    await sendEmailVerification(user);
    return { success: true };
  } catch (error) {
    console.error('Resend verification error:', error);
    return { success: false, error: error.message };
  }
}

// Get current user
export function getCurrentUser() {
  return auth.currentUser;
}

// Auth state observer
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// Check user role
export async function getUserRole(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().role;
    }
    return null;
  } catch (error) {
    console.error('Get user role error:', error);
    return null;
  }
}

// Check user status
export async function getUserStatus(uid) {
  try {
    const studentDoc = await getDoc(doc(db, 'students', uid));
    if (studentDoc.exists()) {
      return studentDoc.data().status;
    }
    return null;
  } catch (error) {
    console.error('Get user status error:', error);
    return null;
  }
}
