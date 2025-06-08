import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyDrAM6g3tqoBJ3vaubDAefLIJZbvKcUyB4",
  authDomain: "rapiditos-app-hender-bytecore.firebaseapp.com",
  databaseURL: "https://rapiditos-app-hender-bytecore-default-rtdb.firebaseio.com",
  projectId: "rapiditos-app-hender-bytecore",
  storageBucket: "rapiditos-app-hender-bytecore.appspot.com",
  messagingSenderId: "387576708423",
  appId: "1:387576708423:web:e949967e70de26b92c2062",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)
