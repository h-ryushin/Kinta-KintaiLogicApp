import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 先ほどの画面でコピーした config をここに貼り付け！
const firebaseConfig = {
  apiKey: "AIzaSyDlCM4_4Iw3oqsK_dsIQCbk__N3NyTylF8",
  authDomain: "kintai-app-98723.firebaseapp.com",
  projectId: "kintai-app-98723",
  storageBucket: "kintai-app-98723.firebasestorage.app",
  messagingSenderId: "376665760461",
  appId: "1:376665760461:web:1614c853c88ea7e38a7f84",
  measurementId: "G-17WD5RMMY2"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);