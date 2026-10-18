import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyD5R2N1Q84FFgaLzndDLG36P8jPLaGVywM',
  authDomain: 'analisisa-e3229.firebaseapp.com',
  projectId: 'analisisa-e3229',
  storageBucket: 'analisisa-e3229.firebasestorage.app',
  messagingSenderId: '433396133473',
  appId: '1:433396133473:web:32e75c6dcc58fcfa298420',
  measurementId: 'G-GQMT1JS2TP',
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)

export default app