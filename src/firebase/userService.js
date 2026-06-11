import { db } from '@/firebase.js'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

const USERS_COLLECTION = 'users'

/**
 * Crée ou met à jour le profil utilisateur
 * @param {string} userId - ID de l'utilisateur Firebase
 * @param {Object} userData - Données utilisateur
 */
export async function upsertUserProfile(userId, userData) {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      // Créer un nouveau profil
      await setDoc(userRef, {
        email: userData.email,
        displayName: userData.displayName || 'Logicien',
        totalScore: userData.totalScore || 0,
        streak: userData.streak || 0,
        lastPlayedDay: userData.lastPlayedDay || null,
        dailyDone: userData.dailyDone || false,
        dailyScore: userData.dailyScore || 0,
        history: userData.history || [],
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      })
    } else {
      // Mettre à jour
      await updateDoc(userRef, {
        totalScore: userData.totalScore,
        streak: userData.streak,
        lastPlayedDay: userData.lastPlayedDay,
        dailyDone: userData.dailyDone,
        dailyScore: userData.dailyScore,
        history: userData.history,
        lastUpdated: serverTimestamp()
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du profil utilisateur:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Récupère le profil utilisateur
 * @param {string} userId - ID de l'utilisateur Firebase
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function getUserProfile(userId) {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return {
        success: false,
        error: 'Profil utilisateur non trouvé'
      }
    }

    return {
      success: true,
      data: {
        id: userSnap.id,
        ...userSnap.data()
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du profil utilisateur:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Met à jour les statistiques de jeu pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} stats - Les statistiques à mettre à jour
 */
export async function updateUserGameStats(userId, stats) {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId)
    await updateDoc(userRef, {
      ...stats,
      lastUpdated: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des statistiques:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Réinitialise la question du jour pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 */
export async function resetDailyForUser(userId) {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId)
    await updateDoc(userRef, {
      dailyDone: false,
      dailyScore: 0,
      lastUpdated: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du daily:', error)
    return { success: false, error: error.message }
  }
}
