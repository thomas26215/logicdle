import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '@/firebase.js'
import { upsertUserProfile } from '@/firebase/userService.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)

  // Initialiser l'observer une seule fois
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
    loading.value = false
  })

  async function register(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      
      // Créer le profil utilisateur dans Firebase
      await upsertUserProfile(userCredential.user.uid, {
        email: email,
        displayName: 'Logicien',
        totalScore: 0,
        streak: 0,
        dailyDone: false,
        dailyScore: 0,
        history: []
      })
      
      return { success: true, user: userCredential.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      
      // Créer le profil utilisateur s'il n'existe pas
      await upsertUserProfile(userCredential.user.uid, {
        email: email,
        displayName: 'Logicien',
        totalScore: 0,
        streak: 0,
        dailyDone: false,
        dailyScore: 0,
        history: []
      })
      
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
})
