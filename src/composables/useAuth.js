import { ref } from 'vue'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '@/firebase.js'

// État global (singleton)
const user = ref(null)
const loading = ref(true)
let unsubscribe = null

// Initialiser l'observer une seule fois
if (!unsubscribe) {
  unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
    loading.value = false
  })
}

export function useAuth() {
  async function register(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      return { success: true, user: userCredential.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      return { success: true, user: userCredential.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async function logout() {
    try {
      await signOut(auth)
      user.value = null
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return {
    user,
    loading,
    register,
    login,
    logout,
  }
}
