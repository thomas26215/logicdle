import { ref } from 'vue'
import { db } from '@/firebase.js'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'

export function useGameDB(userId) {
  const syncLoading = ref(false)
  const syncError = ref(null)

  async function saveGameData(gameData) {
    if (!userId) return { success: false, error: 'Not authenticated' }
    
    syncLoading.value = true
    syncError.value = null
    
    try {
      const gameDocRef = doc(db, 'users', userId, 'gameData', 'stats')
      await setDoc(gameDocRef, {
        totalScore: gameData.totalScore,
        streak: gameData.streak,
        lastPlayedDay: gameData.lastPlayedDay,
        dailyDone: gameData.dailyDone,
        dailyScore: gameData.dailyScore,
        history: gameData.history,
        updatedAt: new Date().toISOString(),
      }, { merge: true })
      
      return { success: true }
    } catch (error) {
      syncError.value = error.message
      return { success: false, error: error.message }
    } finally {
      syncLoading.value = false
    }
  }

  async function loadGameData() {
    if (!userId) return { success: false, error: 'Not authenticated', data: null }
    
    syncLoading.value = true
    syncError.value = null
    
    try {
      const gameDocRef = doc(db, 'users', userId, 'gameData', 'stats')
      const docSnap = await getDoc(gameDocRef)
      
      if (docSnap.exists()) {
        return { success: true, data: docSnap.data() }
      } else {
        return { success: true, data: null } // Premier accès
      }
    } catch (error) {
      syncError.value = error.message
      return { success: false, error: error.message, data: null }
    } finally {
      syncLoading.value = false
    }
  }

  async function updateGameData(updates) {
    if (!userId) return { success: false, error: 'Not authenticated' }
    
    try {
      const gameDocRef = doc(db, 'users', userId, 'gameData', 'stats')
      await updateDoc(gameDocRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return {
    syncLoading,
    syncError,
    saveGameData,
    loadGameData,
    updateGameData,
  }
}
