
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { UserRole } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyDN7FeLVnNT8DklMzzzJe3XhGn5WHCoty4",
  authDomain: "lave-auto-d45ba.firebaseapp.com",
  projectId: "lave-auto-d45ba",
  storageBucket: "lave-auto-d45ba.firebasestorage.app",
  messagingSenderId: "298010654222",
  appId: "1:298010654222:web:36c9ac5218558c910cae5f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// --- Auth Helpers ---

export const loginUser = (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const registerUser = async (email: string, pass: string, role: UserRole, name: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;
  
  // Create User Profile in Firestore
  try {
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      role: role,
      displayName: name,
      createdAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error creating user profile:", error);
    if (error.code === 'permission-denied') {
      console.warn("🚨 ÉCHEC ÉCRITURE PROFIL : Permissions insuffisantes. Vérifiez firestore.rules.");
    }
  }

  return user;
};

// Fonction pour forcer la mise à jour du rôle (utile si le compte existe déjà avec le mauvais rôle)
export const updateUserRole = async (uid: string, role: UserRole) => {
  try {
    const userRef = doc(db, "users", uid);
    // On utilise setDoc avec merge: true pour créer le document s'il n'existe pas
    await setDoc(userRef, { role: role }, { merge: true });
  } catch (error: any) {
    console.error("Error updating user role:", error);
    if (error.code === 'permission-denied') {
       console.warn("🚨 ÉCHEC MISE À JOUR RÔLE : Permissions insuffisantes. Vérifiez firestore.rules.");
    }
  }
};

export const logoutUser = () => {
  return signOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Nouvelle fonction pour écouter les changements de profil en temps réel
export const subscribeToUserProfile = (uid: string, callback: (profile: {role: UserRole, name: string} | null) => void) => {
  return onSnapshot(doc(db, "users", uid), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({ role: data.role as UserRole, name: data.displayName || 'Utilisateur' });
    } else {
      callback(null);
    }
  }, (error) => {
    console.warn("Profile subscription access denied or error:", error.message);
    if (error.code === 'permission-denied') {
        // En cas d'erreur de permission, cela signifie que les règles DB ne sont pas à jour.
        // On renvoie null pour éviter de bloquer l'UI, mais l'utilisateur sera en lecture seule / invité.
    }
    callback(null);
  });
};

export const getUserProfile = async (uid: string): Promise<{role: UserRole, name: string} | null> => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { role: data.role as UserRole, name: data.displayName || 'Utilisateur' };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
};
