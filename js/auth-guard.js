import { auth } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export function requireAdmin() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/index.html";
      return;
    }
    try {
      const token = await user.getIdTokenResult(true);
      if (token.claims.admin !== true) {
        document.body.innerHTML = '<h1 style="color:red; text-align:center; margin-top:20%;">403 - Access Denied</h1>';
        setTimeout(() => window.location.href = "/index.html", 2000);
        return;
      }
      // إطلاق حدث بأن الأدمن جاهز
      document.dispatchEvent(new CustomEvent('adminReady'));
    } catch (error) {
      console.error("Auth Guard Error", error);
      window.location.href = "/index.html";
    }
  });
}
