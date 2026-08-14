// Route definitions
export const routes = {
  // Public routes
  '/': { component: 'LandingPage', requiresAuth: false },
  '/login': { component: 'LoginPage', requiresAuth: false, guestOnly: true },
  '/register': { component: 'RegisterPage', requiresAuth: false, guestOnly: true },
  '/forgot-password': { component: 'ForgotPasswordPage', requiresAuth: false, guestOnly: true },
  '/verify-email': { component: 'VerifyEmailPage', requiresAuth: true },
  
  // Student routes
  '/dashboard': { component: 'DashboardPage', requiresAuth: true, role: 'student' },
  '/profile': { component: 'ProfilePage', requiresAuth: true, role: 'student' },
  '/lessons': { component: 'LessonsPage', requiresAuth: true, role: 'student' },
  '/lesson/:id': { component: 'LessonDetailPage', requiresAuth: true, role: 'student' },
  '/exams': { component: 'ExamsPage', requiresAuth: true, role: 'student' },
  '/exam/:id': { component: 'ExamPage', requiresAuth: true, role: 'student' },
  '/results/:id': { component: 'ResultsPage', requiresAuth: true, role: 'student' },
  '/notifications': { component: 'NotificationsPage', requiresAuth: true, role: 'student' },
  
  // Teacher routes
  '/teacher': { component: 'TeacherDashboardPage', requiresAuth: true, role: 'teacher' },
  '/teacher/students': { component: 'TeacherStudentsPage', requiresAuth: true, role: 'teacher' },
  '/teacher/submissions': { component: 'TeacherSubmissionsPage', requiresAuth: true, role: 'teacher' },
  '/teacher/grading/:id': { component: 'TeacherGradingPage', requiresAuth: true, role: 'teacher' },
  '/teacher/reports': { component: 'TeacherReportsPage', requiresAuth: true, role: 'teacher' },
  
  // Admin routes
  '/admin': { component: 'AdminDashboardPage', requiresAuth: true, role: 'admin' },
  '/admin/users': { component: 'AdminUsersPage', requiresAuth: true, role: 'admin' },
  '/admin/lessons': { component: 'AdminLessonsPage', requiresAuth: true, role: 'admin' },
  '/admin/exams': { component: 'AdminExamsPage', requiresAuth: true, role: 'admin' },
  '/admin/payments': { component: 'AdminPaymentsPage', requiresAuth: true, role: 'admin' },
  '/admin/subscriptions': { component: 'AdminSubscriptionsPage', requiresAuth: true, role: 'admin' },
  '/admin/settings': { component: 'AdminSettingsPage', requiresAuth: true, role: 'admin' },
};

// Match route with params
export function matchRoute(path) {
  // Exact match first
  if (routes[path]) {
    return { route: routes[path], params: {} };
  }
  
  // Param match
  for (const routePath of Object.keys(routes)) {
    const pattern = routePath.replace(/:[^\s/]+/g, '([^/]+)');
    const regex = new RegExp(`^${pattern}$`);
    const match = path.match(regex);
    if (match) {
      const paramNames = (routePath.match(/:[^\s/]+/g) || []).map(p => p.slice(1));
      const params = {};
      paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });
      return { route: routes[routePath], params };
    }
  }
  
  return { route: null, params: {} };
}

// Router class
class Router {
  constructor() {
    this.currentPath = window.location.pathname;
    this.currentPage = null;
    this.pageContainer = document.getElementById('app');
    this.beforeNavigate = null;
    this.afterNavigate = null;
    this.listeners = [];
    
    // Handle popstate
    window.addEventListener('popstate', (event) => {
      this.navigate(window.location.pathname, false);
    });
  }
  
  // Navigate to path
  async navigate(path, pushState = true) {
    // Remove base path if needed
    const base = import.meta.env.BASE_URL || '/';
    let cleanPath = path;
    if (base !== '/' && path.startsWith(base)) {
      cleanPath = path.slice(base.length - 1) || '/';
    }
    
    // Ensure path starts with /
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }
    
    // Match route
    const { route, params } = matchRoute(cleanPath);
    
    if (!route) {
      this.notFound();
      return;
    }
    
    // Before navigation hook
    if (this.beforeNavigate) {
      const canNavigate = await this.beforeNavigate(route, params);
      if (!canNavigate) {
        return;
      }
    }
    
    // Update URL
    if (pushState && cleanPath !== this.currentPath) {
      window.history.pushState({}, '', cleanPath);
    }
    
    this.currentPath = cleanPath;
    this.currentRoute = route;
    this.currentParams = params;
    
    // Render page
    await this.renderPage(route.component, params);
    
    // After navigation hook
    if (this.afterNavigate) {
      this.afterNavigate(route, params);
    }
    
    // Notify listeners
    this.notifyListeners(route, params);
    
    // Scroll to top
    window.scrollTo(0, 0);
  }
  
  // Render page
  async renderPage(componentName, params) {
    // Clear container
    this.pageContainer.innerHTML = '';
    
    // Show loading
    this.pageContainer.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>جاري التحميل...</p>
      </div>
    `;
    
    try {
      // Load component dynamically
      const component = await this.loadComponent(componentName);
      if (component) {
        const page = new component(params);
        await page.render(this.pageContainer);
        this.currentPage = page;
        
        // Page mounted
        if (page.onMount) {
          page.onMount();
        }
      } else {
        this.notFound();
      }
    } catch (error) {
      console.error('Page render error:', error);
      this.pageContainer.innerHTML = `
        <div class="error-state">
          <h2>عذراً، حدث خطأ</h2>
          <p>لم نتمكن من تحميل الصفحة المطلوبة.</p>
          <button class="btn btn-primary" onclick="window.location.reload()">إعادة المحاولة</button>
        </div>
      `;
    }
  }
  
  // Load component
  async loadComponent(componentName) {
    try {
      const module = await import(`/src/pages/${componentName}.js`);
      return module.default || module[componentName];
    } catch (error) {
      console.error(`Component ${componentName} not found:`, error);
      return null;
    }
  }
  
  // Not found
  notFound() {
    this.pageContainer.innerHTML = `
      <div class="not-found-state">
        <h2>الصفحة غير موجودة</h2>
        <p>عذراً، الصفحة التي تبحث عنها غير موجودة.</p>
        <button class="btn btn-primary" onclick="window.location.href='/'">العودة للرئيسية</button>
      </div>
    `;
  }
  
  // Navigation hooks
  setBeforeNavigate(callback) {
    this.beforeNavigate = callback;
  }
  
  setAfterNavigate(callback) {
    this.afterNavigate = callback;
  }
  
  // Listeners
  addListener(callback) {
    this.listeners.push(callback);
  }
  
  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }
  
  notifyListeners(route, params) {
    this.listeners.forEach(callback => {
      callback(route, params);
    });
  }
  
  // Get current path
  getPath() {
    return this.currentPath;
  }
  
  // Get current route
  getRoute() {
    return this.currentRoute;
  }
  
  // Get current params
  getParams() {
    return this.currentParams;
  }
}

// Create singleton instance
const router = new Router();

export default router;
