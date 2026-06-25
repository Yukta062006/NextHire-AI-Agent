import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  User,
  AuthError
} from "firebase/auth";
import { auth } from "./firebase";

/**
 * Custom wrapper for Firebase Authentication helpers.
 * Can be used by UI components to easily sign-in, sign-up or sign-out.
 */

export async function signInWithFirebase(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    return {
      success: true,
      user: userCredential.user,
      token,
      error: null
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      user: null,
      token: null,
      error: getFriendlyErrorMessage(authError.code)
    };
  }
}

export async function signUpWithFirebase(name: string, email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Set the user's display name
    await updateProfile(userCredential.user, {
      displayName: name
    });

    const token = await userCredential.user.getIdToken();
    return {
      success: true,
      user: userCredential.user,
      token,
      error: null
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      user: null,
      token: null,
      error: getFriendlyErrorMessage(authError.code)
    };
  }
}

export async function signOutFromFirebase() {
  try {
    await firebaseSignOut(auth);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: "Failed to sign out from Firebase." };
  }
}

function getFriendlyErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "auth/invalid-email":
      return "The email address is invalid.";
    case "auth/user-disabled":
      return "This user account has been disabled.";
    case "auth/user-not-found":
      return "No user found with this email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/email-already-in-use":
      return "An account already exists with this email address.";
    case "auth/weak-password":
      return "The password is too weak. Please use at least 6 characters.";
    case "auth/operation-not-allowed":
      return "Email/Password sign in is not enabled in Firebase Auth.";
    default:
      return "Authentication failed. Please try again.";
  }
}
