import { db } from '@/firebase.js'
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot, arrayUnion, increment } from 'firebase/firestore'
import { getRandomQuestionsFromFirebase } from './questionsService.js'

const ROOMS_COLLECTION = 'versus_rooms'

/**
 * Crée une nouvelle room versus
 */
export async function createRoom(creatorId, creatorName) {
  try {
    const roomId = generateRoomCode()
    const roomRef = doc(db, ROOMS_COLLECTION, roomId)
    
    // Générer les 5 questions une seule fois
    console.log('🎲 Génération des 5 questions...')
    const questionsResult = await getRandomQuestionsFromFirebase(5)
    if (!questionsResult.success) {
      return { success: false, error: 'Impossible de charger les questions' }
    }
    
    const questions = questionsResult.data.map(q => ({
      id: q.id,
      text: q.text,
      options: q.options,
      answer: q.answer,
      category: q.category
    }))
    
    const roomData = {
      roomId,
      creatorId,
      creatorName,
      opponentId: null,
      opponentName: null,
      status: 'waiting', // waiting, playing, finished
      questions, // Sauvegarde les questions dans la room
      creatorAnswers: [],
      opponentAnswers: [],
      creatorScore: 0,
      opponentScore: 0,
      creatorFinished: false,
      opponentFinished: false,
      winner: null,
      createdAt: serverTimestamp(),
      startedAt: null,
      finishedAt: null
    }
    
    await setDoc(roomRef, roomData)
    return { success: true, data: { roomId, questions } }
  } catch (error) {
    console.error('Erreur création room:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Génère un code de room aléatoire (6 caractères)
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Rejoint une room existante
 */
export async function joinRoom(roomId, opponentId, opponentName) {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId)
    const roomSnap = await getDoc(roomRef)
    
    if (!roomSnap.exists()) {
      return { success: false, error: 'Room non trouvée' }
    }
    
    const room = roomSnap.data()
    
    if (room.status !== 'waiting') {
      return { success: false, error: 'Cette room a déjà commencé ou est terminée' }
    }
    
    if (room.opponentId !== null) {
      return { success: false, error: 'Cette room est complète' }
    }
    
    // Rejoindre la room
    await updateDoc(roomRef, {
      opponentId,
      opponentName,
      status: 'playing',
      startedAt: serverTimestamp()
    })
    
    return { success: true, data: room }
  } catch (error) {
    console.error('Erreur rejoindre room:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Récupère une room par ID
 */
export async function getRoom(roomId) {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId)
    const roomSnap = await getDoc(roomRef)
    
    if (!roomSnap.exists()) {
      return { success: false, error: 'Room non trouvée' }
    }
    
    return { success: true, data: roomSnap.data() }
  } catch (error) {
    console.error('Erreur getRoom:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Écoute les changements en temps réel d'une room
 */
export function onRoomChange(roomId, callback) {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId)
  console.log('🔄 Mise en place de l\'écoute pour room:', roomId)
  
  return onSnapshot(roomRef, (doc) => {
    console.log('📡 Mise à jour reçue:', doc.data())
    if (doc.exists()) {
      callback({ success: true, data: doc.data() })
    } else {
      console.log('⚠️ Room supprimée')
      callback({ success: false, error: 'Room supprimée' })
    }
  }, (error) => {
    console.error('❌ Erreur onSnapshot:', error)
    callback({ success: false, error: error.message })
  })
}

/**
 * Soumet la réponse d'un joueur
 */
export async function submitAnswer(roomId, isCreator, questionIndex, answer, timeMs, isCorrect) {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId)
    
    // Calculer les points en fonction du temps et de la correction
    const points = isCorrect ? calculatePoints(timeMs) : 0
    
    const answerData = {
      questionIndex,
      answer,
      timeMs,
      isCorrect,
      points
    }
    
    if (isCreator) {
      await updateDoc(roomRef, {
        creatorAnswers: arrayUnion(answerData),
        creatorScore: increment(points)
      })
    } else {
      await updateDoc(roomRef, {
        opponentAnswers: arrayUnion(answerData),
        opponentScore: increment(points)
      })
    }
    
    return { success: true, points }
  } catch (error) {
    console.error('Erreur submitAnswer:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Calcule les points en fonction du temps de réponse
 * Base 1000 points - 1 point par 10ms (max 10s = 0 points)
 */
function calculatePoints(timeMs) {
  const maxTime = 10000 // 10 secondes
  if (timeMs > maxTime) return 0
  const points = Math.max(0, 1000 - Math.floor(timeMs / 10))
  return Math.round(points)
}

/**
 * Marque un joueur comme ayant terminé
 */
export async function markPlayerFinished(roomId, isCreator) {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId)
    
    const updateData = isCreator 
      ? { creatorFinished: true }
      : { opponentFinished: true }
    
    await updateDoc(roomRef, updateData)
    return { success: true }
  } catch (error) {
    console.error('Erreur markPlayerFinished:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Termine une room et détermine le gagnant
 */
export async function finishRoom(roomId) {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId)
    const roomSnap = await getDoc(roomRef)
    
    if (!roomSnap.exists()) {
      return { success: false, error: 'Room non trouvée' }
    }
    
    const room = roomSnap.data()
    const creatorScore = room.creatorScore || 0
    const opponentScore = room.opponentScore || 0
    
    let winner = null
    if (creatorScore > opponentScore) {
      winner = room.creatorId
    } else if (opponentScore > creatorScore) {
      winner = room.opponentId
    }
    // Si égalité, winner reste null
    
    await updateDoc(roomRef, {
      status: 'finished',
      finishedAt: serverTimestamp(),
      winner
    })
    
    return { 
      success: true, 
      data: { 
        winner, 
        creatorScore, 
        opponentScore,
        isDraw: creatorScore === opponentScore
      } 
    }
  } catch (error) {
    console.error('Erreur finishRoom:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Supprime une room
 */
export async function deleteRoom(roomId) {
  try {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId)
    await deleteDoc(roomRef)
    return { success: true }
  } catch (error) {
    console.error('Erreur deleteRoom:', error)
    return { success: false, error: error.message }
  }
}
