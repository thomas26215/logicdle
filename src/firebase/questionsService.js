import { db } from '@/firebase.js'
import { collection, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, increment } from 'firebase/firestore'

const QUESTIONS_COLLECTION = 'questions'

// Cache pour les questions
let questionsCache = null
let cacheTimestamp = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes en ms

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
 * Charge toutes les questions depuis Firebase (avec cache)
 */
export async function loadAllQuestions() {
  try {
    // Vérifier si le cache est valide
    if (questionsCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_TTL) {
      console.log('📦 Questions récupérées du cache')
      return { success: true, data: questionsCache }
    }

    console.log('🔄 Chargement des questions depuis Firebase...')
    const querySnapshot = await getDocs(collection(db, QUESTIONS_COLLECTION))
    const questions = []
    querySnapshot.forEach((docSnap) => {
      questions.push(enrichQuestion({ id: docSnap.id, ...docSnap.data() }))
    })
    
    // Mettre en cache
    questionsCache = questions
    cacheTimestamp = Date.now()
    
    return { success: true, data: questions }
  } catch (error) {
    console.error('Erreur lors du chargement des questions:', error)
    return { success: false, error: error.message, data: [] }
  }
}

/**
 * Charge une question spécifique par ID
 */
export async function getQuestionById(questionId) {
  try {
    const docRef = doc(db, QUESTIONS_COLLECTION, String(questionId))
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return { success: true, data: enrichQuestion({ id: docSnap.id, ...docSnap.data() }) }
    } else {
      return { success: false, error: 'Question non trouvée' }
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la question:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Shuffle un array avec Fisher-Yates
 */
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Charge des questions aléatoires depuis Firebase
 * @param {number} count - Nombre de questions à charger
 */
export async function getRandomQuestionsFromFirebase(count) {
  try {
    const allResult = await loadAllQuestions()
    if (!allResult.success) {
      return allResult
    }
    
    // Shuffle avec Fisher-Yates
    const shuffled = shuffleArray(allResult.data)
    const limited = shuffled.slice(0, Math.min(count, shuffled.length))
    
    return { success: true, data: limited }
  } catch (error) {
    console.error('Erreur lors du chargement des questions aléatoires:', error)
    return { success: false, error: error.message, data: [] }
  }
}

/**
 * Charge les questions difficiles (expert mode) depuis Firebase
 * Retourne UNIQUEMENT les questions les plus difficiles (percent < 20%)
 */
export async function getExpertQuestionsFromFirebase() {
  try {
    const allResult = await loadAllQuestions()
    if (!allResult.success) {
      return allResult
    }
    
    // Filtrer les questions difficiles (percent < 20%) - STRICTEMENT
    const expert = allResult.data.filter(q => q.percent < 20)
    
    // Shuffle
    const shuffled = shuffleArray(expert)
    
    return { success: true, data: shuffled }
  } catch (error) {
    console.error('Erreur lors du chargement des questions expert:', error)
    return { success: false, error: error.message, data: [] }
  }
}

/**
 * Crée ou met à jour une question
 */
export async function upsertQuestion(questionId, questionData) {
  try {
    const docRef = doc(db, QUESTIONS_COLLECTION, String(questionId))
    
    // Récupérer les données existantes pour conserver les statistiques
    const existingDoc = await getDoc(docRef)
    const existingData = existingDoc.exists() ? existingDoc.data() : {}
    
    // Fusionner avec les nouvelles données
    let mergedData = {
      ...existingData,
      ...questionData,
      // Initialiser les statistiques si absent
      correctCount: questionData.correctCount ?? existingData.correctCount ?? 0,
      wrongCount: questionData.wrongCount ?? existingData.wrongCount ?? 0,
      lastUpdated: new Date().toISOString()
    }
    
    // Supprimer l'attribut percent (calculé à la demande)
    delete mergedData.percent
    
    await setDoc(docRef, mergedData, { merge: true })
    return { success: true, data: enrichQuestion(mergedData) }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la question:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Met à jour les statistiques d'une question
 * @param {string} questionId - ID de la question
 * @param {boolean} isCorrect - Si la réponse était correcte
 */
export async function updateQuestionStats(questionId, isCorrect) {
  try {
    const docRef = doc(db, QUESTIONS_COLLECTION, String(questionId))
    
    if (isCorrect) {
      await updateDoc(docRef, {
        correctCount: increment(1)
      })
    } else {
      await updateDoc(docRef, {
        wrongCount: increment(1)
      })
    }
    
    // Invalider le cache après la mise à jour
    questionsCache = null
    cacheTimestamp = null
    
    return { success: true }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des statistiques:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Recalcule le pourcentage d'une question
 */
export async function recalculateQuestionPercent(questionId) {
  try {
    const docRef = doc(db, QUESTIONS_COLLECTION, String(questionId))
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Question non trouvée' }
    }
    
    const data = docSnap.data()
    const total = (data.correctCount || 0) + (data.wrongCount || 0)
    const newPercent = total > 0 ? Math.round((data.correctCount / total) * 100) : 0
    
    await updateDoc(docRef, {
      percent: newPercent
    })
    
    return { success: true, data: { percent: newPercent } }
  } catch (error) {
    console.error('Erreur lors du recalcul du pourcentage:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Obtient les statistiques globales des questions
 */
export async function getQuestionsStats() {
  try {
    const querySnapshot = await getDocs(collection(db, QUESTIONS_COLLECTION))
    
    let totalQuestions = 0
    let totalCorrect = 0
    let totalWrong = 0
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data()
      totalQuestions++
      totalCorrect += data.correctCount || 0
      totalWrong += data.wrongCount || 0
    })
    
    const globalCorrectPercent = totalCorrect + totalWrong > 0 
      ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100)
      : 0
    
    return {
      success: true,
      data: {
        totalQuestions,
        totalCorrect,
        totalWrong,
        globalCorrectPercent,
        totalResponses: totalCorrect + totalWrong
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Supprime une question
 */
export async function deleteQuestion(questionId) {
  try {
    const docRef = doc(db, QUESTIONS_COLLECTION, String(questionId))
    await deleteDoc(docRef)
    return { success: true }
  } catch (error) {
    console.error('Erreur lors de la suppression de la question:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Invalide le cache des questions
 */
export function clearQuestionsCache() {
  questionsCache = null
  cacheTimestamp = null
  console.log('🗑️ Cache des questions invalidé')
}
