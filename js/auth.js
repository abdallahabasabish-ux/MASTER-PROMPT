import { auth, db } from "./firebase-init.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { handleAuthError } from "./error-handler.js";
import { showError, setLoading } from "./ui.js";

export async function login(email, password) {
  setLoading('loginBtn', true);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // إجبار تحديث الـ Token للحصول على أحدث Custom Claims
    const idTokenResult = await user.getIdTokenResult(true);
    
    if (idTokenResult.claims.admin === true) {
      window.location.href = "/admin/admin.html";
    } else {
      // طالب عادي
      window.location.href = "/student.html";
    }
  } catch (error) {
    const safeMsg = handleAuthError(error);
    showError('error-box', safeMsg);
  } finally {
    setLoading('loginBtn', false);
  }
}
