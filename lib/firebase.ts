import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, getFirestore, persistentLocalCache, persistentSingleTabManager, disableNetwork, enableNetwork } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};


const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 直近取得したデータをブラウザにキャッシュし、再訪時や電波が弱い時の体感速度を改善する
// （同じappに対してinitializeFirestoreを二重に呼ぶと例外になるため、既に初期化済みの場合はgetFirestoreにフォールバックする）
export const db = (() => {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) }),
    });
  } catch {
    return getFirestore(app);
  }
})();

// 「再読み込み」ボタン用: Wi-Fi⇔モバイル回線の切り替えやスリープ復帰などで
// Firestoreの内部通信チャンネルが壊れたまま固まっているケースに備えて、
// クエリをやり直す前に一度接続を切って繋ぎ直す（ページ全体のリロードに近い効果）
export async function reconnectFirestore() {
  try {
    await disableNetwork(db);
    await enableNetwork(db);
  } catch (err) {
    console.warn("Firestoreの再接続に失敗しました:", err);
  }
}


