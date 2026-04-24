import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          const data = snap.exists() ? snap.data() : {};
          setUserProfile({
            nickname: data.nickname || null,
            isAdmin: data.isAdmin === true,
          });
        } catch {
          setUserProfile({ nickname: null, isAdmin: false });
        }
      } else {
        setUserProfile(null);
      }
    });
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const signup = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);
  const sendVerificationEmail = () => sendEmailVerification(auth.currentUser);

  return (
    <AuthContext.Provider value={{ user, userProfile, login, signup, logout, resetPassword, sendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}