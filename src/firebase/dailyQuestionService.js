import { db } from '@/firebase.js'
import { getDoc, doc, setDoc } from 'firebase/firestore'

/**
 * Calcule le pourcentage basé sur correctCount et wrongCount
 */
function calculatePercent(correctCount = 0, wrongCount = 0) {
  const total = correctCount + wrongCount
  if (total === 0) return 0
  return Math.round((correctCount / total) * 100)
}

/**
 * Enrichit une question avec le pourcentage calculé
 */
function enrichQuestion(questionData) {
  return {
    ...questionData,
    percent: calculatePercent(questionData.correctCount, questionData.wrongCount)
  }
}

/**
 * Obtient la date au format YYYY-MM-DD
 */
function getTodayDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Récupère la question du jour
 * @returns {Promise<{success: boolean, data: {questionId: number}, error?: string}>}
 */
export async function getDailyQuestion() {
  try {
    const today = getTodayDate()
    const docRef = doc(db, 'dailyQuestions', today)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return {
        success: false,
        data: null,
        error: `Aucune question du jour pour ${today}`
      }
    }

    return {
      success: true,
      data: docSnap.data()
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la question du jour:', error)
    return {
      success: false,
      data: null,
      error: error.message
    }
  }
}

/**
 * Crée/met à jour la question du jour
 * @param {number} questionId - L'ID de la question à définir comme question du jour
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function setDailyQuestion(questionId) {
  try {
    const today = getTodayDate()
    const docRef = doc(db, 'dailyQuestions', today)

    await setDoc(docRef, {
      questionId: questionId
    })

    return {
      success: true,
      data: { date: today, questionId }
    }
  } catch (error) {
    console.error('Erreur lors de la création de la question du jour:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Récupère la question du jour pour une date spécifique
 * @param {string} date - Date au format YYYY-MM-DD
 * @returns {Promise<{success: boolean, data: {questionId: number}, error?: string}>}
 */
export async function getDailyQuestionByDate(date) {
  try {
    const docRef = doc(db, 'dailyQuestions', date)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return {
        success: false,
        data: null,
        error: `Aucune question du jour pour ${date}`
      }
    }

    return {
      success: true,
      data: docSnap.data()
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la question du jour:', error)
    return {
      success: false,
      data: null,
      error: error.message
    }
  }
}

/**
 * Vérifie si une question du jour existe pour aujourd'hui
 * @returns {Promise<boolean>}
 */
export async function hasDailyQuestion() {
  try {
    const result = await getDailyQuestion()
    return result.success
  } catch (error) {
    console.error('Erreur lors de la vérification de la question du jour:', error)
    return false
  }
}
