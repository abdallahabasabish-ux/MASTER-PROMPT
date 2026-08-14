// App state management
class Store {
  constructor() {
    this.state = {
      user: null,
      userRole: null,
      userStatus: null,
      isAuthenticated: false,
      isLoading: true,
      notifications: [],
      unreadCount: 0,
      theme: 'light',
    };
    this.listeners = [];
  }
  
  // Get state
  getState() {
    return { ...this.state };
  }
  
  // Update state
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }
  
  // Subscribe to changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(listener => {
      listener(this.state);
    });
  }
  
  // Reset state
  reset() {
    this.state = {
      user: null,
      userRole: null,
      userStatus: null,
      isAuthenticated: false,
      isLoading: true,
      notifications: [],
      unreadCount: 0,
      theme: 'light',
    };
    this.notifyListeners();
  }
}

// Create singleton instance
const store = new Store();

export default store;
