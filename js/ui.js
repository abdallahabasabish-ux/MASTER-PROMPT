// أداة آمنة لعرض النصوص دون استخدام innerHTML
export function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message; // Secure against XSS
    el.style.display = 'block';
  }
}

export function setLoading(buttonId, isLoading) {
  const btn = document.getElementById(buttonId);
  if (btn) {
    btn.disabled = isLoading;
    btn.textContent = isLoading ? "جاري المعالجة..." : "دخول";
  }
}
