export function handleAuthError(error) {
  let safeMessage = "حدث خطأ غير متوقع. حاول مرة أخرى.";
  
  // User Enumeration Prevention
  if (error.code === 'auth/wrong-password' || 
      error.code === 'auth/user-not-found' || 
      error.code === 'auth/invalid-credential') {
    safeMessage = "بيانات الدخول غير صحيحة.";
  } 
  else if (error.code === 'auth/too-many-requests') {
    safeMessage = "تم حظر الوصول مؤقتاً بسبب محاولات كثيرة. حاول لاحقاً.";
  }
  else if (error.code === 'auth/network-request-failed') {
    safeMessage = "تحقق من اتصالك بالإنترنت.";
  }

  // Log internal error securely (in real prod, send to monitoring backend)
  console.error("Internal Auth Error:", error.code);
  
  return safeMessage;
}
