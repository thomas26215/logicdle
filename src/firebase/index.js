// Services Firebase pour la gestion des questions
export {
  loadAllQuestions,
  getQuestionById,
  getRandomQuestionsFromFirebase,
  getExpertQuestionsFromFirebase,
  upsertQuestion,
  updateQuestionStats,
  recalculateQuestionPercent,
  getQuestionsStats,
  deleteQuestion,
  clearQuestionsCache
} from './questionsService.js'

// Services Firebase pour la gestion de la question du jour
export {
  getDailyQuestion,
  setDailyQuestion,
  getDailyQuestionByDate,
  hasDailyQuestion
} from './dailyQuestionService.js'

// Services Firebase pour les profils utilisateurs
export {
  upsertUserProfile,
  getUserProfile,
  updateUserGameStats,
  resetDailyForUser
} from './userService.js'

// Services Firebase pour le mode versus
export {
  createRoom,
  joinRoom,
  getRoom,
  onRoomChange,
  submitAnswer,
  markPlayerFinished,
  finishRoom,
  deleteRoom
} from './versusService.js'

export {
  initializeQuestionsFromLocal,
  printQuestionsStats
} from './questionInitializer.js'
