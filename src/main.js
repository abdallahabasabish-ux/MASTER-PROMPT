import './assets/styles/main.css';
import router from './core/router.js';
import store from './core/store.js';
import { onAuthChange, getCurrentUser, getUserRole, getUserStatus } from './firebase/auth.js';
import { readDocument } from './firebase/firestore.js';

// App state
let isInitialized = false;

// Initialize app
async function initApp() {
  if (isInitialized) return;
  isInitialized = true;
  
  console.log('🚀 Dr. Science Platform Initializing...');
  
  // Setup auth listener
  onAuthChange(async (user) => {
    store.setState({ isLoading: true });
    
    if (user) {
      // User logged in
      const userData = await getUserData(user.uid);
      const role = await getUserRole(user.uid);
      const status = await getUserStatus(user.uid);
      
      store.setState({
        user: { ...user, ...userData },
        userRole: role,
        userStatus: status,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Check if email is verified
      if (!user.emailVerified) {
        // Show verification banner
        showVerificationBanner();
      }
      
      // Route based on role
      handleRoleRouting(role, status);
    } else {
      // User logged out
      store.reset();
      store.setState({ isLoading: false });
      
      // Check if current route requires auth
      const currentRoute = router.getRoute();
      if (currentRoute && currentRoute.requiresAuth) {
        router.navigate('/login');
      }
    }
  });
  
  // Setup router hooks
  router.setBeforeNavigate(async (route, params) => {
    const state = store.getState();
    
    // Check authentication
    if (route.
