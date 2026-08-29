import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  updateProfile as firebaseUpdateProfile,
  FirebaseUser,
  db 
} from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { fetchD1User, upsertD1User } from "@/lib/d1Api";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phone?: string | null;
  address?: string | null;
  favoriteBranch?: string | null;
  dietaryPreferences?: string | null;
  role: "admin" | "customer";
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = [
  "info.thegrillspot@gmail.com",
  "admin@thegrillspot.pk",
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        try {
          // 1. Check Cloudflare D1 first, then Firestore
          const [d1Data, userDoc] = await Promise.all([
            fetchD1User(currentUser.uid),
            getDoc(doc(db, "users", currentUser.uid)).catch(() => null),
          ]);

          const fsData = userDoc && userDoc.exists() ? userDoc.data() : {};
          
          const isAdminUser = 
            ADMIN_EMAILS.includes(currentUser.email || "") ||
            d1Data?.role === "admin" ||
            fsData?.role === "admin";

          const profile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: d1Data?.displayName || fsData?.displayName || currentUser.displayName,
            photoURL: d1Data?.photoURL || fsData?.photoURL || currentUser.photoURL,
            phone: d1Data?.phone || fsData?.phone || null,
            address: d1Data?.address || fsData?.address || null,
            favoriteBranch: d1Data?.favoriteBranch || fsData?.favoriteBranch || "Gulberg III (Main Boulevard)",
            dietaryPreferences: d1Data?.dietaryPreferences || fsData?.dietaryPreferences || null,
            role: isAdminUser ? "admin" : "customer",
          };

          // Save/Update in Cloudflare D1 SQL
          upsertD1User({
            id: profile.uid,
            email: profile.email,
            displayName: profile.displayName,
            photoURL: profile.photoURL,
            phone: profile.phone,
            address: profile.address,
            favoriteBranch: profile.favoriteBranch,
            dietaryPreferences: profile.dietaryPreferences,
            role: profile.role,
          }).catch((e) => console.warn("D1 sync warning:", e));

          // Save/Update user profile in Firestore
          const userDocRef = doc(db, "users", currentUser.uid);
          await setDoc(
            userDocRef,
            {
              email: currentUser.email,
              displayName: profile.displayName,
              photoURL: profile.photoURL,
              role: profile.role,
              lastLogin: serverTimestamp(),
              createdAt: userDoc && userDoc.exists() ? fsData?.createdAt : serverTimestamp(),
            },
            { merge: true }
          );

          setUser(profile);
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            role: ADMIN_EMAILS.includes(currentUser.email || "") ? "admin" : "customer",
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<UserProfile | null> => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const loggedUser = result.user;
      const isAdminUser = ADMIN_EMAILS.includes(loggedUser.email || "");

      let existingData: Record<string, unknown> = {};
      try {
        const userDocRef = doc(db, "users", loggedUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          existingData = docSnap.data();
        }
      } catch (e) {
        console.warn("Could not read existing profile doc:", e);
      }

      const profile: UserProfile = {
        uid: loggedUser.uid,
        email: loggedUser.email,
        displayName: (existingData.displayName as string) || loggedUser.displayName,
        photoURL: (existingData.photoURL as string) || loggedUser.photoURL,
        phone: (existingData.phone as string) || null,
        address: (existingData.address as string) || null,
        favoriteBranch: (existingData.favoriteBranch as string) || "Gulberg III (Main Boulevard)",
        dietaryPreferences: (existingData.dietaryPreferences as string) || null,
        role: isAdminUser ? "admin" : "customer",
      };

      try {
        const userDocRef = doc(db, "users", loggedUser.uid);
        await setDoc(
          userDocRef,
          {
            email: loggedUser.email,
            displayName: profile.displayName,
            photoURL: profile.photoURL,
            role: profile.role,
            lastLogin: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn("Could not write user to firestore:", e);
      }

      setUser(profile);
      toast.success(`Welcome, ${profile.displayName || "Valued Guest"}!`, {
        description: "Signed in with Google successfully.",
      });
      return profile;
    } catch (error: unknown) {
      console.error("Google sign in error:", error);
      const errorMessage = error instanceof Error ? error.message : "Please check popup permissions and try again.";
      toast.error("Google Sign-In failed", {
        description: errorMessage,
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return false;
    }

    try {
      // 1. Update Firebase Auth if displayName or photoURL changed
      if (auth.currentUser && (updates.displayName !== undefined || updates.photoURL !== undefined)) {
        await firebaseUpdateProfile(auth.currentUser, {
          displayName: updates.displayName !== undefined ? updates.displayName : auth.currentUser.displayName,
          photoURL: updates.photoURL !== undefined ? updates.photoURL : auth.currentUser.photoURL,
        });
      }

      // 2. Update Firestore
      const userDocRef = doc(db, "users", user.uid);
      const firestoreData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };
      if (updates.displayName !== undefined) firestoreData.displayName = updates.displayName;
      if (updates.photoURL !== undefined) firestoreData.photoURL = updates.photoURL;
      if (updates.phone !== undefined) firestoreData.phone = updates.phone;
      if (updates.address !== undefined) firestoreData.address = updates.address;
      if (updates.favoriteBranch !== undefined) firestoreData.favoriteBranch = updates.favoriteBranch;
      if (updates.dietaryPreferences !== undefined) firestoreData.dietaryPreferences = updates.dietaryPreferences;

      await setDoc(userDocRef, firestoreData, { merge: true });

      // 3. Update Cloudflare D1 SQL
      await upsertD1User({
        id: user.uid,
        email: user.email,
        displayName: updates.displayName !== undefined ? updates.displayName : user.displayName,
        photoURL: updates.photoURL !== undefined ? updates.photoURL : user.photoURL,
        phone: updates.phone !== undefined ? updates.phone : user.phone,
        address: updates.address !== undefined ? updates.address : user.address,
        favoriteBranch: updates.favoriteBranch !== undefined ? updates.favoriteBranch : user.favoriteBranch,
        dietaryPreferences: updates.dietaryPreferences !== undefined ? updates.dietaryPreferences : user.dietaryPreferences,
        role: user.role,
      });

      // 4. Update local state
      setUser((prev) => (prev ? { ...prev, ...updates } : null));
      toast.success("Profile updated successfully!");
      return true;
    } catch (err: unknown) {
      console.error("Error updating profile:", err);
      const msg = err instanceof Error ? err.message : "Could not save profile changes.";
      toast.error("Update failed", { description: msg });
      return false;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
      toast.success("Signed out successfully");
    } catch (error: unknown) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  const isAdmin = user?.role === "admin" || ADMIN_EMAILS.includes(user?.email || "");

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        signInWithGoogle,
        signOut,
        updateUserProfile,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
