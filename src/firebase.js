import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyCDYZ0AhSApffbtwAS0gTi2u0-VNS1wmxw",
  authDomain: "smacportal45.firebaseapp.com",
  databaseURL: "https://smacportal45-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smacportal45",
  storageBucket: "smacportal45.firebasestorage.app",
  messagingSenderId: "898549325508",
  appId: "1:898549325508:web:c6d3528f226e3e2367f391",
  measurementId: "G-3TY4E2LV68"
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

export const firebaseApp = firebaseConfigured
  ? getApps().length ? getApp() : initializeApp(firebaseConfig)
  : null;

export const firestore = firebaseApp ? getFirestore(firebaseApp) : null;
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

export async function authenticatePortalAdmin(username, password) {
  if (!firebaseAuth || !firestore) {
    throw new Error("Firebase configuration is missing from src/firebase.js.");
  }
  const email = `${String(username).trim().toLowerCase()}@${firebaseConfig.projectId}.firebaseapp.com`;
  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  const account = await getDoc(doc(firestore, "accounts", credential.user.uid));
  if (!account.exists() || account.data().role !== "admin") {
    await firebaseAuth.signOut();
    throw new Error("This Firebase account is not registered as the SMAC Portal admin.");
  }
  return credential.user;
}
