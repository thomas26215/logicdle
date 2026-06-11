import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { 
  createRoom, 
  joinRoom, 
  getRoom, 
  onRoomChange, 
  submitAnswer,
  markPlayerFinished,
  finishRoom, 
  deleteRoom
} from '@/firebase/index.js'

export const useVersusStore = defineStore('versus', () => {
  // État
  const currentRoom = ref(null)
  const roomId = ref(null)
  const isCreator = ref(false)
  const gameQuestions = ref([])
  const gameStartTime = ref(null)
  const currentQuestionIndex = ref(0)
  const gameFinished = ref(false)
  const unsubscribe = ref(null)

  // Computed
  const currentQuestion = computed(() => {
    return gameQuestions.value[currentQuestionIndex.value] || null
  })

  const progress = computed(() => {
    return {
      current: currentQuestionIndex.value + 1,
      total: gameQuestions.value.length
    }
  })

  const isLastQuestion = computed(() => {
    return currentQuestionIndex.value === gameQuestions.value.length - 1
  })

  // Méthodes
  
  /**
   * Crée une nouvelle room
   */
  async function createNewRoom(userId, userName) {
    try {
      const result = await createRoom(userId, userName)
      if (result.success) {
        roomId.value = result.data.roomId
        isCreator.value = true
        
        // Charger la room
        await loadRoom(result.data.roomId)
        
        // Mettre en place l'écoute temps réel
        setupRealtimeListener()
        
        return { success: true, roomId: result.data.roomId }
      }
      return result
    } catch (error) {
      console.error('Erreur createNewRoom:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Rejoint une room existante
   */
  async function joinExistingRoom(roomCode, userId, userName) {
    try {
      const result = await joinRoom(roomCode, userId, userName)
      if (result.success) {
        roomId.value = roomCode
        isCreator.value = false
        currentRoom.value = result.data
        
        // Charger les questions et écouter les changements
        await initializeGame()
        
        return { success: true }
      }
      return result
    } catch (error) {
      console.error('Erreur joinExistingRoom:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Charge une room
   */
  async function loadRoom(rid) {
    try {
      const result = await getRoom(rid)
      if (result.success) {
        currentRoom.value = result.data
        return result
      }
      return result
    } catch (error) {
      console.error('Erreur loadRoom:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Initialise le jeu (charge les questions depuis la room)
   */
  async function initializeGame() {
    try {
      // Les questions sont déjà chargées depuis createRoom
      // Il suffit de les récupérer depuis currentRoom
      if (!currentRoom.value?.questions || currentRoom.value.questions.length === 0) {
        return { success: false, error: 'Pas de questions disponibles' }
      }
      
      gameQuestions.value = currentRoom.value.questions
      console.log('📋 Questions chargées depuis la room:', gameQuestions.value.length)
      gameStartTime.value = Date.now()
      currentQuestionIndex.value = 0
      
      // Écouter les changements de la room
      setupRealtimeListener()
      
      return { success: true }
    } catch (error) {
      console.error('Erreur initializeGame:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Écoute les changements de la room en temps réel
   */
  function setupRealtimeListener() {
    if (unsubscribe.value) {
      unsubscribe.value()
    }
    
    console.log('🎧 Setup listener pour room:', roomId.value)
    unsubscribe.value = onRoomChange(roomId.value, (result) => {
      console.log('👂 Listener callback reçu:', result)
      if (result.success) {
        console.log('📋 Room mise à jour:', result.data)
        currentRoom.value = result.data
        
        // Vérifier si les deux joueurs ont terminé
        if (result.data.creatorFinished && result.data.opponentFinished && !gameFinished.value) {
          console.log('🏁 Les deux joueurs ont terminé!')
          finishGame()
        }
      } else {
        console.error('❌ Erreur listener:', result.error)
      }
    })
  }

  /**
   * Soumet une réponse
   */
  async function submitAnswerToQuestion(answer, isCorrect) {
    try {
      const timeMs = Date.now() - gameStartTime.value
      
      const result = await submitAnswer(
        roomId.value,
        isCreator.value,
        currentQuestionIndex.value,
        answer,
        timeMs,
        isCorrect
      )
      
      if (result.success) {
        // Passer à la prochaine question
        if (!isLastQuestion.value) {
          currentQuestionIndex.value++
          gameStartTime.value = Date.now()
        } else {
          // Dernière question, marquer comme fini et attendre l'autre joueur
          console.log('✅ Vous avez terminé vos 5 questions')
          await markPlayerFinished(roomId.value, isCreator.value)
        }
        
        return { success: true, points: result.points }
      }
      return result
    } catch (error) {
      console.error('Erreur submitAnswerToQuestion:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Termine le jeu
   */
  async function finishGame() {
    try {
      const result = await finishRoom(roomId.value)
      if (result.success) {
        gameFinished.value = true
      }
      return result
    } catch (error) {
      console.error('Erreur finishGame:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Quitte la room
   */
  async function leaveRoom() {
    try {
      // Arrêter l'écoute
      if (unsubscribe.value) {
        unsubscribe.value()
      }
      
      // Réinitialiser l'état
      currentRoom.value = null
      roomId.value = null
      isCreator.value = false
      gameQuestions.value = []
      gameStartTime.value = null
      currentQuestionIndex.value = 0
      gameFinished.value = false
      
      return { success: true }
    } catch (error) {
      console.error('Erreur leaveRoom:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Supprime la room
   */
  async function destroyRoom() {
    try {
      await deleteRoom(roomId.value)
      return await leaveRoom()
    } catch (error) {
      console.error('Erreur destroyRoom:', error)
      return { success: false, error: error.message }
    }
  }

  return {
    // État
    currentRoom,
    roomId,
    isCreator,
    gameQuestions,
    currentQuestionIndex,
    gameFinished,
    
    // Computed
    currentQuestion,
    progress,
    isLastQuestion,
    
    // Méthodes
    createNewRoom,
    joinExistingRoom,
    loadRoom,
    initializeGame,
    submitAnswerToQuestion,
    finishGame,
    leaveRoom,
    destroyRoom
  }
})
