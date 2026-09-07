import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut as fbSignOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AuthUser } from '../types';
import { loadUserSettingsFromCloud, initSettingsSync } from '../lib/settingsSync';

export interface UserProfileData {
  uid?: string;
  phoneNumber?: string | null;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: User | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
  saveUserProfile: (profileOrPhone: string | UserProfileData) => Promise<void>;
  loginWithGoogle: () => Promise<User>;
  loginWithEmail: (email: string, pass: string) => Promise<User>;
  signupWithEmail: (email: string, pass: string) => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  loginWithDemo: (phoneNumber?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('otivo_demo_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(true);
  const currentUserRef = useRef<AuthUser | null>(user);

  useEffect(() => {
    currentUserRef.current = user;
  }, [user]);

  // Set up store automatic settings synchronization to cloud
  useEffect(() => {
    const unsub = initSettingsSync(() => currentUserRef.current?.uid || auth.currentUser?.uid);
    return () => unsub();
  }, []);

  const saveUserProfile = async (profileOrPhone: string | UserProfileData) => {
    const currentUser = auth.currentUser;
    const uid = typeof profileOrPhone === 'object' && profileOrPhone.uid ? profileOrPhone.uid : currentUser?.uid;
    if (!uid) return;

    const data: UserProfileData = typeof profileOrPhone === 'string'
      ? { phoneNumber: profileOrPhone }
      : profileOrPhone;

    const now = new Date().toISOString();
    const resolvedPhone = currentUser?.phoneNumber || data.phoneNumber || null;
    const resolvedEmail = currentUser?.email || data.email || null;
    const resolvedName = currentUser?.displayName || data.displayName || null;
    const resolvedPhoto = currentUser?.photoURL || data.photoURL || null;

    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);

      const payload: Record<string, any> = {
        id: uid,
        lastLoginAt: now
      };
      if (resolvedPhone) payload.phoneNumber = resolvedPhone;
      if (resolvedEmail) payload.email = resolvedEmail;
      if (resolvedName) payload.displayName = resolvedName;
      if (resolvedPhoto) payload.photoURL = resolvedPhoto;

      if (!snap.exists()) {
        payload.createdAt = now;
        await setDoc(userRef, payload);
      } else {
        await updateDoc(userRef, payload);
      }

      const updatedUser: AuthUser = {
        uid,
        phoneNumber: resolvedPhone,
        email: resolvedEmail,
        displayName: resolvedName,
        photoURL: resolvedPhoto,
        createdAt: snap.exists() ? snap.data().createdAt : now,
        lastLoginAt: now
      };
      setUser(updatedUser);

      // Load or initialize cloud settings
      await loadUserSettingsFromCloud(uid);
    } catch (error) {
      console.warn('Firestore profile sync info (offline or initial setup):', error);
      const fallbackUser: AuthUser = {
        uid,
        phoneNumber: resolvedPhone,
        email: resolvedEmail,
        displayName: resolvedName,
        photoURL: resolvedPhoto,
        createdAt: now,
        lastLoginAt: now
      };
      setUser(fallbackUser);
      // Attempt to load cached/cloud settings regardless
      await loadUserSettingsFromCloud(uid);
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Request permission to write to the user's hidden AppData folder
    provider.addScope("https://www.googleapis.com/auth/drive.appdata");
    provider.setCustomParameters({ prompt: 'select_account' });
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    // OAuth access token required for Google Drive API requests
    const accessToken = credential?.accessToken;
    if (accessToken) {
      sessionStorage.setItem("drive_access_token", accessToken);
    }

    const gUser = result.user;

    await saveUserProfile({
      uid: gUser.uid,
      email: gUser.email,
      displayName: gUser.displayName,
      photoURL: gUser.photoURL,
      phoneNumber: gUser.phoneNumber
    });

    return gUser;
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const eUser = credential.user;
    await saveUserProfile({
      uid: eUser.uid,
      email: eUser.email,
      displayName: eUser.displayName,
      photoURL: eUser.photoURL
    });
    return eUser;
  };

  const signupWithEmail = async (email: string, pass: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const eUser = credential.user;
    await saveUserProfile({
      uid: eUser.uid,
      email: eUser.email,
      displayName: eUser.displayName || email.split('@')[0],
      photoURL: eUser.photoURL
    });
    return eUser;
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const loginWithDemo = (phoneNumber = '+1 555-0199') => {
    const demoUser: AuthUser = {
      uid: 'demo-trader-' + Math.random().toString(36).substring(2, 9),
      phoneNumber: phoneNumber,
      displayName: 'Demo Trader',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    try {
      localStorage.setItem('otivo_demo_user', JSON.stringify(demoUser));
    } catch {}
    setUser(demoUser);
    loadUserSettingsFromCloud(demoUser.uid);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          localStorage.removeItem('otivo_demo_user');
          const userRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            const loggedInUser: AuthUser = {
              uid: fbUser.uid,
              phoneNumber: fbUser.phoneNumber || data.phoneNumber || null,
              email: fbUser.email || data.email || null,
              displayName: fbUser.displayName || data.displayName || null,
              photoURL: fbUser.photoURL || data.photoURL || null,
              createdAt: data.createdAt,
              lastLoginAt: data.lastLoginAt
            };
            setUser(loggedInUser);
          } else {
            const loggedInUser: AuthUser = {
              uid: fbUser.uid,
              phoneNumber: fbUser.phoneNumber || null,
              email: fbUser.email || null,
              displayName: fbUser.displayName || null,
              photoURL: fbUser.photoURL || null
            };
            setUser(loggedInUser);
          }
          // Restore user settings across browsers on login
          await loadUserSettingsFromCloud(fbUser.uid);
        } catch {
          setUser({
            uid: fbUser.uid,
            phoneNumber: fbUser.phoneNumber || null,
            email: fbUser.email || null,
            displayName: fbUser.displayName || null,
            photoURL: fbUser.photoURL || null
          });
          await loadUserSettingsFromCloud(fbUser.uid);
        }
      } else {
        const savedDemo = localStorage.getItem('otivo_demo_user');
        if (!savedDemo) {
          setUser(null);
        } else {
          try {
            const parsed = JSON.parse(savedDemo);
            loadUserSettingsFromCloud(parsed.uid);
          } catch {}
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOutUser = async () => {
    try {
      localStorage.removeItem('otivo_demo_user');
      await fbSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
      localStorage.removeItem('otivo_demo_user');
      setUser(null);
      setFirebaseUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser, 
      loading, 
      signOutUser, 
      saveUserProfile, 
      loginWithGoogle, 
      loginWithEmail, 
      signupWithEmail, 
      resetPassword, 
      loginWithDemo 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
