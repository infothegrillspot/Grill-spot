import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, updateProfile, User as FirebaseUser } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Initialize Firestore
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection test
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, "_health", "connection"));
  } catch (error) {
    // Expected to fail if doc doesn't exist, but tests network connection
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firebase client is offline. Check connection.");
    }
  }
}

// Trigger initial connection test asynchronously
testFirestoreConnection();

export { signInWithPopup, signOut, onAuthStateChanged, updateProfile };
export type { FirebaseUser };
export default app;
