import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase';
import { Chat } from './components/Chat';
import { FileManager } from './components/FileManager';
import { AdminDashboard } from './components/AdminDashboard';
import { APIKeyModal } from './components/APIKeyModal';
import { ToastContainer } from './components/ToastContainer';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { useToast } from './hooks/useToast';
import { storage } from './utils/localStorage';
import { Provider } from './utils/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

function AppContent({ user, setUser, loading, onLogin, onLogout, justLoggedIn, setJustLoggedIn }: {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  onLogin: (userData: User) => void;
  onLogout: () => void;
  justLoggedIn: boolean;
  setJustLoggedIn: (value: boolean) => void;
}) {
  const navigate = useNavigate();

  // Redirect admin to dashboard after login (only once after login)
  useEffect(() => {
    if (user && user.role === 'admin' && justLoggedIn && window.location.hash !== '#/admin') {
      console.log('Admin detected, redirecting to dashboard...', user);
      navigate('/admin', { replace: true });
      setJustLoggedIn(false);
    }
  }, [user, navigate, justLoggedIn, setJustLoggedIn]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Chat user={user} onLogout={onLogout} onLogin={onLogin} />} />
      <Route 
        path="/files" 
        element={
          user ? (
            <FileManager user={user} onLogout={onLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      <Route 
        path="/admin" 
        element={
          user && user.role === 'admin' ? (
            <AdminDashboard user={user} onLogout={onLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>(storage.getProvider());
  const { toasts, removeToast } = useToast();

  useEffect(() => {
    // Listen to auth state changes
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user data from Firestore
        try {
          if (db) {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUser({
                id: firebaseUser.uid,
                name: userData.displayName || userData.name || firebaseUser.displayName || 'User',
                email: firebaseUser.email || '',
                role: userData.role || 'user',
              });
            } else {
              // Create user document if it doesn't exist
              setUser({
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'User',
                email: firebaseUser.email || '',
                role: 'user',
              });
            }
          } else {
            setUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              role: 'user',
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            role: 'user',
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Check for API key on mount
  useEffect(() => {
    const savedKey = storage.getApiKey();
    const savedProvider = storage.getProvider();
    
    // Check if proxy is available (no API key needed)
    const proxyUrl = import.meta.env.VITE_PROXY_URL;
    
    if (savedKey) {
      setApiKey(savedKey);
      setProvider(savedProvider);
    } else if (proxyUrl) {
      // Proxy available, no API key needed
      setApiKey(null);
      setProvider(savedProvider);
    } else {
      // No proxy and no API key, show modal
      setShowApiKeyModal(true);
    }
  }, []);

  const handleLogin = (userData: User) => {
    console.log('Login handler called with userData:', userData);
    setUser(userData);
    // Set flag to trigger redirect for admin (only after login, not on page refresh)
    if (userData.role === 'admin') {
      setJustLoggedIn(true);
    }
  };

  const handleLogout = async () => {
    try {
      if (auth) {
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
      }
      setUser(null);
      setToast({ type: 'success', message: 'Logged out successfully!' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Logout error:', error);
      setToast({ type: 'error', message: 'Error logging out. Please try again.' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleSaveApiKey = (key: string, selectedProvider: Provider) => {
    storage.setApiKey(key);
    storage.setProvider(selectedProvider);
    setApiKey(key);
    setProvider(selectedProvider);
    setShowApiKeyModal(false);
  };

  return (
    <HashRouter>
      <AppContent 
        user={user} 
        setUser={setUser} 
        loading={loading} 
        onLogin={handleLogin} 
        onLogout={handleLogout}
        justLoggedIn={justLoggedIn}
        setJustLoggedIn={setJustLoggedIn}
      />
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] max-w-md ${
            toast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showApiKeyModal && (
        <APIKeyModal
          onSave={handleSaveApiKey}
          onClose={apiKey ? () => setShowApiKeyModal(false) : undefined}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </HashRouter>
  );
}

export default App;
