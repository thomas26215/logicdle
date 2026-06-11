import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getRandomQuestions, getExpertQuestions } from '@/data/questions.js'
import { 
  getDailyQuestion as getFirebaseDailyQuestion, 
  getQuestionById,
  getRandomQuestionsFromFirebase,
  getExpertQuestionsFromFirebase,
  updateQuestionStats 
} from '@/firebase/index.js'
import { upsertUserProfile, updateUserGameStats } from '@/firebase/userService.js'
import { useGameDB } from '@/composables/useGameDB.js'

const STORAGE_KEY = 'logicdle_v2'
function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} } }
function save(obj) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)) } catch {} }

export const useGameStore = defineStore('game', () => {
  const s = load()
  const totalScore    = ref(s.totalScore    ?? 0)
  const streak        = ref(s.streak        ?? 0)
  const lastPlayedDay = ref(s.lastPlayedDay ?? null)
  const dailyDone     = ref(s.dailyDone     ?? false)
  const dailyScore    = ref(s.dailyScore    ?? 0)
  const history       = ref(s.history       ?? [])

  function persist() {
    save({ totalScore: totalScore.value, streak: streak.value,
           lastPlayedDay: lastPlayedDay.value, dailyDone: dailyDone.value,
           dailyScore: dailyScore.value, history: history.value })
  }

  // ── Session ──────────────────────────────────────────────────────────────
  const mode         = ref(null)
  const phase        = ref('idle')   // 'question' | 'estimate' | 'result' | 'gameover'
  const questions    = ref([])
  const currentIndex = ref(0)
  const sessionScore = ref(0)
  const lives        = ref(3)
  const timeLeft     = ref(0)
  const sessionStats = ref([])

  // question phase
  const selectedOption = ref(null)
  const isAnswered     = ref(false)
  const answerCorrect  = ref(false)
  const answerScore    = ref(0)

  // estimate phase (daily only)
  const estimateValue  = ref(50)
  const estimateScore  = ref(0)
  const estimateLocked = ref(false)

  // ── Computed ──────────────────────────────────────────────────────────────
  const currentQuestion = computed(() => questions.value[currentIndex.value] ?? null)
  const isLastQuestion  = computed(() => currentIndex.value >= questions.value.length - 1)

  // ── Actions ───────────────────────────────────────────────────────────────
  function resetSession() {
    sessionScore.value = 0; currentIndex.value = 0; sessionStats.value = []
    selectedOption.value = null; isAnswered.value = false
    answerCorrect.value = false; answerScore.value = 0
    estimateValue.value = 50; estimateScore.value = 0; estimateLocked.value = false
  }

  async function startMode(m) {
    mode.value = m
    resetSession()
    
    try {
      switch (m) {
        case 'daily': {
          // Récupérer l'ID de la question du jour
          const dailyResult = await getFirebaseDailyQuestion()
          if (!dailyResult.success) {
            console.error('Erreur:', dailyResult.error)
            throw new Error('Impossible de charger la question du jour')
          }
          
          const questionId = dailyResult.data.questionId
          // Récupérer la question complète
          const questionResult = await getQuestionById(questionId)
          if (!questionResult.success) {
            console.error('Erreur:', questionResult.error)
            throw new Error('Impossible de charger les données de la question')
          }
          
          questions.value = [questionResult.data]
          break
        }
        case 'endless': {
          const result = await getRandomQuestionsFromFirebase(200)
          if (!result.success) throw new Error(result.error)
          questions.value = result.data
          break
        }
        case 'express': {
          const result = await getRandomQuestionsFromFirebase(20)
          if (!result.success) throw new Error(result.error)
          questions.value = result.data
          lives.value = 1
          timeLeft.value = 20
          break
        }
        case 'expert': {
          const result = await getExpertQuestionsFromFirebase()
          if (!result.success) throw new Error(result.error)
          questions.value = result.data
          break
        }
        case 'survival': {
          const result = await getRandomQuestionsFromFirebase(200)
          if (!result.success) throw new Error(result.error)
          questions.value = result.data
          lives.value = 3
          timeLeft.value = 30
          break
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des questions:', error.message)
      questions.value = []
    }
    
    phase.value = 'question'
  }

  function submitAnswer(optionIndex) {
    if (isAnswered.value) return
    const q = currentQuestion.value
    isAnswered.value    = true
    selectedOption.value = optionIndex
    answerCorrect.value = optionIndex === q.answer
    answerScore.value   = answerCorrect.value ? 500 : 0
    sessionScore.value += answerScore.value

    // Mettre à jour les stats de la question dans Firebase (sans bloquer)
    updateQuestionStats(q.id, answerCorrect.value).catch(err => 
      console.error('Erreur mise à jour stats:', err)
    )

    if (!answerCorrect.value) {
      if (mode.value === 'express') { setTimeout(() => { phase.value = 'gameover' }, 1400); return }
      if (mode.value === 'survival') {
        lives.value--
        if (lives.value <= 0) { setTimeout(() => { phase.value = 'gameover' }, 1400); return }
      }
    }

    // Estimation uniquement en daily ET si bonne réponse
    const goEstimate = mode.value === 'daily' && answerCorrect.value
    if (goEstimate) {
      setTimeout(() => {
        phase.value = 'estimate'
        estimateValue.value = 50; estimateScore.value = 0; estimateLocked.value = false
      }, 1400)
    }
    // Les autres modes (endless, express, survival) attendent nextQuestion() si réponse l'utilisateur
  }

  function nextQuestion() {
    _proceed()
  }

  function submitEstimate() {
    if (estimateLocked.value) return
    const diff = Math.abs(estimateValue.value - currentQuestion.value.percent)
    estimateScore.value = Math.max(0, Math.round(500 * (1 - diff / 50)))
    sessionScore.value += estimateScore.value
    estimateLocked.value = true
    setTimeout(() => _proceed(), 1200)
  }

  function _proceed() {
    sessionStats.value.push({
      question: currentQuestion.value,
      correct: answerCorrect.value,
      answerScore: answerScore.value,
      estimateScore: estimateScore.value,
      selectedOption: selectedOption.value
    })

    if (isLastQuestion.value) { _endSession(); return }

    currentIndex.value++
    selectedOption.value = null; isAnswered.value = false
    answerCorrect.value = false; answerScore.value = 0
    estimateValue.value = 50; estimateScore.value = 0; estimateLocked.value = false
    if (mode.value === 'express')  timeLeft.value = 20
    if (mode.value === 'survival') timeLeft.value = 30
    phase.value = 'question'
  }

  function _endSession() {
    if (mode.value === 'daily') {
      const today = new Date().toDateString()
      if (lastPlayedDay.value !== today) {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
        streak.value = lastPlayedDay.value === yesterday.toDateString() ? streak.value + 1 : 1
      }
      lastPlayedDay.value = new Date().toDateString()
      dailyDone.value = true
      dailyScore.value = sessionScore.value
      totalScore.value += sessionScore.value
      
      // Format historique : { date, questionId, points }
      const todayISO = new Date().toISOString().split('T')[0]
      const questionId = currentQuestion.value?.id || null
      history.value.unshift({ 
        date: todayISO, 
        questionId: questionId,
        points: sessionScore.value
      })
      persist()
    }
    phase.value = 'result'
  }

  function quit() { phase.value = 'idle'; mode.value = null }
  function devResetDaily() { dailyDone.value = false; dailyScore.value = 0; persist() }
  
  function clearStorage() {
    localStorage.removeItem(STORAGE_KEY)
    totalScore.value = 0
    streak.value = 0
    lastPlayedDay.value = null
    dailyDone.value = false
    dailyScore.value = 0
    history.value = []
  }

  // ── Firebase Sync ────────────────────────────────────────────────────────
  async function syncToFirebase(userId) {
    if (!userId) return { success: false, error: 'No user' }
    
    return await upsertUserProfile(userId, {
      totalScore: totalScore.value,
      streak: streak.value,
      lastPlayedDay: lastPlayedDay.value,
      dailyDone: dailyDone.value,
      dailyScore: dailyScore.value,
      history: history.value,
    })
  }

  async function loadFromFirebase(userId) {
    if (!userId) return { success: false, error: 'No user' }
    const { loadGameData } = useGameDB(userId)
    const result = await loadGameData()
    
    if (result.success && result.data) {
      totalScore.value = result.data.totalScore ?? 0
      streak.value = result.data.streak ?? 0
      lastPlayedDay.value = result.data.lastPlayedDay ?? null
      dailyDone.value = result.data.dailyDone ?? false
      dailyScore.value = result.data.dailyScore ?? 0
      history.value = result.data.history ?? []
    }
    
    return result
  }

  return {
    mode, phase, questions, currentIndex, sessionScore,
    lives, timeLeft, sessionStats,
    selectedOption, isAnswered, answerCorrect, answerScore,
    estimateValue, estimateScore, estimateLocked,
    totalScore, streak, dailyDone, dailyScore, history,
    currentQuestion, isLastQuestion,
    startMode, submitAnswer, nextQuestion, submitEstimate, quit, devResetDaily, clearStorage,
    syncToFirebase, loadFromFirebase
  }
})
