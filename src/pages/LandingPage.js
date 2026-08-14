import router from '../core/router.js';

export default class LandingPage {
  constructor(params) {
    this.params = params;
  }
  
  async render(container) {
    container.innerHTML = `
      <div class="landing-page">
        <!-- Navbar -->
        <nav class="navbar" role="navigation" aria-label="القائمة الرئيسية">
          <div class="container">
            <div class="navbar-content">
              <div class="navbar-brand">
                <span class="brand-logo">🔬</span>
                <div>
                  <span class="brand-name">الدكتور في العلوم</span>
                  <span class="brand-sub">أستاذ وحيد حامد</span>
                </div>
              </div>
              
              <div class="navbar-links" id="navbarLinks">
                <a href="#features">المميزات</a>
                <a href="#how-it-works">كيف يعمل</a>
                <a href="#lessons">الدروس</a>
                <a href="#faq">الأسئلة</a>
              </div>
              
              <div class="navbar-actions">
                <button class="btn btn-secondary btn-sm" onclick="window.location.href='/login'">تسجيل الدخول</button>
                <button class="btn btn-primary btn-sm" onclick="window.location.href='/register'">ابدأ التعلم</button>
                <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="القائمة">
                  <span></span><span></span><span></span>
                </button>
              </div>
            </div>
          </div>
        </nav>
        
        <!-- Hero Section -->
        <section class="hero" aria-label="القسم الرئيسي">
          <div class="container">
            <div class="hero-content">
              <div class="hero-text">
                <div class="hero-badge">
                  <span>📚 منصة تعليمية متكاملة</span>
                </div>
                <h1>تعلم العلوم <span class="text-primary">بطريقة أبسط</span></h1>
                <p class="hero-description">
                  دروس منظمة، فيديوهات تعليمية، ملفات مراجعة واختبارات تساعدك على فهم العلوم خطوة بخطوة.
                </p>
                <div class="hero-actions">
                  <button class="btn btn-primary btn-lg" onclick="window.location.href='/register'">
                    ابدأ التعلم مجاناً
                  </button>
                  <button class="btn btn-secondary btn-lg" onclick="window.location.href='/login'">
                    تسجيل الدخول
                  </button>
                </div>
                <div class="hero-stats">
                  <div class="stat">
                    <span class="stat-number">+500</span>
                    <span class="stat-label">طالب</span>
                  </div>
                  <div class="stat">
                    <span class="stat-number">+50</span>
                    <span class="stat-label">درس</span>
                  </div>
                  <div class="stat">
                    <span class="stat-number">+30</span>
                    <span class="stat-label">اختبار</span>
                  </div>
                </div>
              </div>
              <div class="hero-image">
                <div class="hero-illustration">
                  <div class="floating-icon icon-1">🧪</div>
                  <div class="floating-icon icon-2">🔬</div>
                  <div class="floating-icon icon-3">📖</div>
                  <div class="hero-card">
                    <div class="card-content">
                      <span class="card-icon">🎯</span>
                      <span>الدرس الأول: مقدمة في العلوم</span>
                      <span class="card-progress">80%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <!-- Features Section -->
        <section class="features" id="features" aria-label="المميزات">
          <div class="container">
            <div class="section-header">
              <h2>لماذا <span class="text-primary">الدكتور في العلوم</span>؟</h2>
              <p>نقدم لك تجربة تعليمية متكاملة تجمع بين المتعة والفائدة</p>
            </div>
            <div class="features-grid">
              <div class="feature-card">
                <div class="feature-icon">🎥</div>
                <h3>فيديوهات تعليمية</h3>
                <p>شروحات مرئية مبسطة تغطي جميع المناهج الدراسية</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">📄</div>
                <h3>ملفات مراجعة PDF</h3>
                <p>ملخصات ومراجعات جاهزة للطباعة والمذاكرة</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">📝</div>
                <h3>اختبارات تفاعلية</h3>
                <p>أسئلة متنوعة مع تصحيح فوري وتقييم الأداء</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">📊</div>
                <h3>تتبع التقدم</h3>
                <p>متابعة دقيقة لتقدمك وتحديد نقاط القوة والضعف</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">👨‍🏫</div>
                <h3>إشراف مباشر</h3>
                <p>إشراف الأستاذ وحيد حامد على جميع المحتويات</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">📱</div>
                <h3>متوافق مع الجوال</h3>
                <p>تصميم متجاوب يعمل على جميع الأجهزة</p>
              </div>
            </div>
          </div>
        </section>
        
        <!-- How It Works -->
        <section class="how-it-works" id="how-it-works" aria-label="كيف يعمل">
          <div class="container">
            <div class="section-header">
              <h2>كيف <span class="text-primary">يعمل</span>؟</h2>
              <p>ثلاث خطوات بسيطة لبدء رحلة التعلم</p>
            </div>
            <div class="steps">
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h3>إنشاء حساب</h3>
                  <p>سجل حسابك مجاناً وأدخل بياناتك وبيانات ولي الأمر</p>
                </div>
              </div>
              <div class="step-arrow">➜</div>
              <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h3>اختر دروسك</h3>
                  <p>تصفح الدروس المتنوعة واختر ما يناسب مرحلتك الدراسية</p>
                </div>
              </div>
              <div class="step-arrow">➜</div>
              <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h3>تعلم وتقدم</h3>
                  <p>شاهد الفيديوهات، حل الاختبارات وتابع تقدمك</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <!-- CTA Section -->
        <section class="cta-section" aria-label="دعوة للانضمام">
          <div class="container">
            <div class="cta-content">
              <h2>جاهز لبدء رحلة التعلم؟</h2>
              <p>انضم إلى آلاف الطلاب الذين يثقون في الدكتور في العلوم</p>
              <button class="btn btn-primary btn-lg" onclick="window.location.href='/register'">
                ابدأ الآن مجاناً
              </button>
            </div>
          </div>
        </section>
        
        <!-- Footer -->
        <footer class="footer" role="contentinfo">
          <div class="container">
            <div class="footer-content">
              <div class="footer-brand">
                <span class="brand-logo">🔬</span>
                <div>
                  <span class="brand-name">الدكتور في العلوم</span>
                  <span class="brand-sub">أستاذ وحيد حامد</span>
                </div>
                <p class="footer-description">منصة تعليمية متكاملة لمادة العلوم</p>
              </div>
              <div class="footer-links">
                <div class="footer-col">
                  <h4>روابط سريعة</h4>
                  <a href="#features">المميزات</a>
                  <a href="#how-it-works">كيف يعمل</a>
                  <a href="#faq">الأسئلة</a>
                </div>
                <div class="footer-col">
                  <h4>الحساب</h4>
                  <a href="/login">تسجيل الدخول</a>
                  <a href="/register">إنشاء حساب</a>
                </div>
              </div>
            </div>
            <div class="footer-bottom">
              <p>© ${new Date().getFullYear()} الدكتور في العلوم. جميع الحقوق محفوظة</p>
              <p class="font-english text-muted">Dr. Science — Ustaz Waheed Hamed</p>
            </div>
          </div>
        </footer>
      </div>
    `;
    
    // Load styles
    this.loadStyles();
    
    // Mobile menu
    this.setupMobileMenu();
  }
  
  loadStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Landing Page Styles */
      .landing-page {
        min-height: 100vh;
        background: var(--background);
      }
      
      /* Navbar */
      .navbar {
        position: sticky;
        top: 0;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--border);
        z-index: var(--z-sticky);
        padding: var(--space-3) 0;
      }
      
      .navbar-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-4);
      }
      
      .navbar-brand {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      
      .brand-logo {
        font-size: var(--text-2xl);
      }
      
      .brand-name {
        font-size: var(--text-lg);
        font-weight: 700;
        color: var(--text);
        display: block;
        line-height: 1.2;
      }
      
      .brand-sub {
        font-size: var(--text-xs);
        color: var(--text-muted);
        display: block;
        line-height: 1.2;
      }
      
      .navbar-links {
        display: flex;
        gap: var(--space-6);
        align-items: center;
      }
      
      .navbar-links a {
        color: var(--text-secondary);
        font-weight: 500;
        transition: color var(--transition-fast);
        font-size: var(--text-sm);
      }
      
      .navbar-links a:hover {
        color: var(--primary);
      }
      
      .navbar-actions {
        display: flex;
        gap: var(--space-3);
        align-items: center;
      }
      
      .mobile-menu-btn {
        display: none;
        flex-direction: column;
        gap: 4px;
        background: none;
        border: none;
        cursor: pointer;
        padding: var(--space-2);
      }
      
      .mobile-menu-btn span {
        display: block;
        width: 24px;
        height: 2px;
        background: var(--text);
        transition: all var(--transition-fast);
        border-radius: 2px;
      }
      
      .mobile-menu-btn.active span:nth-child(1) {
        transform: rotate(45deg) translate(4px, 4px);
      }
      
      .mobile-menu-btn.active span:nth-child(2) {
        opacity: 0;
      }
      
      .mobile-menu-btn.active span:nth-child(3) {
        transform: rotate(-45deg) translate(4px, -4px);
      }
      
      /* Hero */
      .hero {
        padding: var(--space-16) 0 var(--space-12);
        background: linear-gradient(180deg, var(--primary-bg) 0%, var(--background) 100%);
      }
      
      .hero-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-12);
        align-items: center;
      }
      
      .hero-badge {
        display: inline-block;
        background: var(--primary-bg);
        color: var(--primary);
        padding: var(--space-1) var(--space-4);
        border-radius: var(--radius-full);
        font-size: var(--text-sm);
        font-weight: 600;
        margin-bottom: var(--space-4);
      }
      
      .hero-text h1 {
        font-size: var(--text-5xl);
        line-height: 1.1;
        margin-bottom: var(--space-4);
      }
      
      .hero-description {
        font-size: var(--text-xl);
        color: var(--text-secondary);
        margin-bottom: var(--space-6);
        max-width: 500px;
      }
      
      .hero-actions {
        display: flex;
        gap: var(--space-4);
        flex-wrap: wrap;
        margin-bottom: var(--space-8);
      }
      
      .hero-stats {
        display: flex;
        gap: var(--space-8);
      }
      
      .stat {
        display: flex;
        flex-direction: column;
      }
      
      .stat-number {
        font-size: var(--text-2xl);
        font-weight: 700;
        color: var(--text);
      }
      
      .stat-label {
        font-size: var(--text-sm);
        color: var(--text-muted);
      }
      
      .hero-image {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .hero-illustration {
        position: relative;
        width: 100%;
        max-width: 400px;
        aspect-ratio: 1;
        background: var(--surface);
        border-radius: var(--radius-2xl);
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .floating-icon {
        position: absolute;
        font-size: var(--text-4xl);
        animation: float 3s ease-in-out infinite;
      }
      
      .floating-icon.icon-1 {
        top: 10%;
        left: 10%;
        animation-delay: 0s;
      }
      
      .floating-icon.icon-2 {
        bottom: 15%;
        right: 10%;
        animation-delay: 1s;
      }
      
      .floating-icon.icon-3 {
        top: 15%;
        right: 15%;
        animation-delay: 2s;
      }
      
      .hero-card {
        background: var(--surface);
        border-radius: var(--radius-lg);
        padding: var(--space-4) var(--space-6);
        box-shadow: var(--shadow-md);
        border: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: var(--space-4);
        position: relative;
        z-index: 1;
      }
      
      .card-content {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      
      .card-icon {
        font-size: var(--text-2xl);
      }
      
      .card-progress {
        background: var(--success);
        color: white;
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-full);
        font-size: var(--text-xs);
        font-weight: 600;
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      
      /* Features */
      .features {
        padding: var(--space-16) 0;
      }
      
      .section-header {
        text-align: center;
        margin-bottom: var(--space-12);
      }
      
      .section-header h2 {
        font-size: var(--text-4xl);
        margin-bottom: var(--space-3);
      }
      
      .section-header p {
        font-size: var(--text-lg);
        color: var(--text-muted);
      }
      
      .features-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-6);
      }
      
      .feature-card {
        background: var(--surface);
        padding: var(--space-6);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border);
        text-align: center;
        transition: all var(--transition-base);
      }
      
      .feature-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
        border-color: var(--primary-light);
      }
      
      .feature-icon {
        font-size: var(--text-4xl);
        margin-bottom: var(--space-4);
      }
      
      .feature-card h3 {
        font-size: var(--text-xl);
        margin-bottom: var(--space-2);
      }
      
      .feature-card p {
        color: var(--text-muted);
        font-size: var(--text-sm);
        margin-bottom: 0;
      }
      
      /* How It Works */
      .how-it-works {
        padding: var(--space-16) 0;
        background: var(--surface-secondary);
      }
      
      .steps {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-4);
        max-width: 900px;
        margin: 0 auto;
      }
      
      .step {
        flex: 1;
        text-align: center;
        padding: var(--space-6);
        background: var(--surface);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border);
      }
      
      .step-number {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--text-xl);
        font-weight: 700;
        margin: 0 auto var(--space-4);
      }
      
      .step-content h3 {
        font-size: var(--text-lg);
        margin-bottom: var(--space-2);
      }
      
      .step-content p {
        font-size: var(--text-sm);
        color: var(--text-muted);
        margin-bottom: 0;
      }
      
      .step-arrow {
        font-size: var(--text-2xl);
        color: var(--primary-light);
      }
      
      /* CTA */
      .cta-section {
        padding: var(--space-16) 0;
        background: var(--primary);
        color: white;
      }
      
      .cta-content {
        text-align: center;
      }
      
      .cta-content h2 {
        font-size: var(--text-4xl);
        color: white;
        margin-bottom: var(--space-3);
      }
      
      .cta-content p {
        color: rgba(255, 255, 255, 0.8);
        font-size: var(--text-lg);
        margin-bottom: var(--space-6);
      }
      
      .cta-content .btn {
        background: white;
        color: var(--primary);
      }
      
      .cta-content .btn:hover {
        background: var(--primary-bg);
        transform: translateY(-2px);
      }
      
      /* Footer */
      .footer {
        padding: var(--space-12) 0 var(--space-6);
        background: var(--text);
        color: rgba(255, 255, 255, 0.8);
      }
      
      .footer-content {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: var(--space-8);
        margin-bottom: var(--space-8);
      }
      
      .footer-brand .brand-name {
        color: white;
      }
      
      .footer-brand .brand-sub {
        color: rgba(255, 255, 255, 0.6);
      }
      
      .footer-description {
        color: rgba(255, 255, 255, 0.6);
        font-size: var(--text-sm);
        margin-top: var(--space-3);
      }
      
      .footer-col h4 {
        color: white;
        font-size: var(--text-base);
        margin-bottom: var(--space-3);
      }
      
      .footer-col a {
        display: block;
        color: rgba(255, 255, 255, 0.6);
        font-size: var(--text-sm);
        padding: var(--space-1) 0;
        transition: color var(--transition-fast);
      }
      
      .footer-col a:hover {
        color: white;
      }
      
      .footer-bottom {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: var(--space-6);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: var(--text-sm);
      }
      
      /* Loading State */
      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        gap: var(--space-4);
      }
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--border);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      /* Error State */
      .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        gap: var(--space-4);
        text-align: center;
        padding: var(--space-6);
      }
      
      /* Responsive */
      @media (max-width: 1024px) {
        .hero-content {
          grid-template-columns: 1fr;
          text-align: center;
        }
        
        .hero-description {
          margin-left: auto;
          margin-right: auto;
        }
        
        .hero-actions {
          justify-content: center;
        }
        
        .hero-stats {
          justify-content: center;
        }
        
        .features-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      @media (max-width: 768px) {
        .navbar-links {
          display: none;
        }
        
        .mobile-menu-btn {
          display: flex;
        }
        
        .navbar-links.open {
          display: flex;
          flex-direction: column;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--surface);
          padding: var(--space-4);
          border-bottom: 1px solid var(--border);
          gap: var(--space-3);
        }
        
        .hero-text h1 {
          font-size: var(--text-4xl);
        }
        
        .hero-actions {
          flex-direction: column;
          align-items: center;
        }
        
        .hero-actions .btn {
          width: 100%;
          max-width: 300px;
        }
        
        .hero-stats {
          gap: var(--space-4);
          flex-wrap: wrap;
        }
        
        .features-grid {
          grid-template-columns: 1fr;
        }
        
        .steps {
          flex-direction: column;
        }
        
        .step-arrow {
          transform: rotate(90deg);
        }
        
        .footer-content {
          grid-template-columns: 1fr;
          text-align: center;
        }
        
        .footer-bottom {
          flex-direction: column;
          gap: var(--space-2);
          text-align: center;
        }
      }
      
      @media (max-width: 480px) {
        .hero-text h1 {
          font-size: var(--text-3xl);
        }
        
        .hero-description {
          font-size: var(--text-base);
        }
        
        .stat-number {
          font-size: var(--text-xl);
        }
        
        .hero-illustration {
          max-width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  setupMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const links = document.getElementById('navbarLinks');
    
    if (menuBtn && links) {
      menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        links.classList.toggle('open');
      });
    }
  }
}
