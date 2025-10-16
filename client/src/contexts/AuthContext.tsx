import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';

interface AppUser {
  id: string;
  username: string | null;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  photoURL: string | null;
  authProvider: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<any>;
  signInWithCredentials: (username: string, password: string) => Promise<void>;
  signUp: (data: { username?: string; email?: string; phoneNumber?: string; password?: string; authProvider: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing user
    const storedUser = localStorage.getItem('sarthi_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Handle Firebase redirect result on page load
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          // Register/login with backend using Firebase data
          await handleFirebaseUser(result.user, 'google');
        }
      })
      .catch((error) => {
        console.error('Redirect sign-in error:', error);
      });

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !user) {
        // Sync with backend if we have Firebase user but no app user
        await handleFirebaseUser(firebaseUser, 'google');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleFirebaseUser = async (firebaseUser: FirebaseUser, provider: string) => {
    try {
      // Try to register the user first
      const response = await apiRequest('POST', '/api/auth/signup', {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        authProvider: provider,
      });

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('sarthi_user', JSON.stringify(data.user));
    } catch (error: any) {
      // If user already exists (409 conflict), login with email
      if (error.message && error.message.includes('409')) {
        try {
          const loginResponse = await apiRequest('POST', '/api/auth/login', {
            email: firebaseUser.email,
          });
          const data = await loginResponse.json();
          setUser(data.user);
          localStorage.setItem('sarthi_user', JSON.stringify(data.user));
        } catch (loginError) {
          console.error('Login error after conflict:', loginError);
        }
      } else {
        console.error('Backend sync error:', error);
        setLoading(false);
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user) {
          await handleFirebaseUser(result.user, 'google');
        }
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signInWithPhone = async (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      return confirmationResult;
    } catch (error) {
      console.error('Phone sign-in error:', error);
      throw error;
    }
  };

  const signInWithCredentials = async (username: string, password: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('sarthi_user', JSON.stringify(data.user));
    } catch (error) {
      console.error('Credentials sign-in error:', error);
      throw error;
    }
  };

  const signUp = async (data: { username?: string; email?: string; phoneNumber?: string; password?: string; authProvider: string }) => {
    try {
      const response = await apiRequest('POST', '/api/auth/signup', data);
      const result = await response.json();
      setUser(result.user);
      localStorage.setItem('sarthi_user', JSON.stringify(result.user));
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem('sarthi_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithPhone, signInWithCredentials, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
