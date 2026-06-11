# Firebase Questions Service

Ce dossier contient tous les services pour gérer les questions via Firebase Firestore.

## Structure des fichiers

- **`questionsService.js`** - Opérations CRUD et statistiques des questions
- **`questionInitializer.js`** - Initialisation des questions depuis le fichier local
- **`index.js`** - Fichier d'export centralisant tous les services

## Structure Firestore

```
logicdle (project)
└── questions (collection)
    └── {questionId} (documents)
        ├── id: number
        ├── text: string
        ├── options: string[]
        ├── answer: number (index 0-3)
        ├── explanation: string
        ├── percent: number (1-100)
        ├── category: string
        ├── correctCount: number (statistiques)
        ├── wrongCount: number (statistiques)
        ├── createdAt: timestamp
        └── lastUpdated: timestamp
```

## Utilisation

### 1. Initialiser les questions dans Firebase (une seule fois)

```javascript
import { initializeQuestionsFromLocal } from '@/firebase/index.js'

// Dans votre composant ou store
const result = await initializeQuestionsFromLocal()
console.log(result) // { success: 20, failed: 0, errors: [] }
```

### 2. Charger toutes les questions

```javascript
import { loadAllQuestions } from '@/firebase/index.js'

const result = await loadAllQuestions()
if (result.success) {
  console.log(result.data) // Array of questions
}
```

### 3. Charger une question spécifique

```javascript
import { getQuestionById } from '@/firebase/index.js'

const result = await getQuestionById('1')
if (result.success) {
  console.log(result.data) // Question object
}
```

### 4. Mettre à jour les statistiques d'une question

```javascript
import { updateQuestionStats } from '@/firebase/index.js'

// Après qu'un utilisateur réponde à une question
const result = await updateQuestionStats('1', true) // true = réponse correcte
```

### 5. Recalculer le pourcentage d'une question

```javascript
import { recalculateQuestionPercent } from '@/firebase/index.js'

const result = await recalculateQuestionPercent('1')
console.log(result.data.percent) // Nouveau pourcentage
```

### 6. Obtenir les statistiques globales

```javascript
import { getQuestionsStats } from '@/firebase/index.js'

const result = await getQuestionsStats()
console.log(result.data)
// {
//   totalQuestions: 20,
//   totalCorrect: 15480,
//   totalWrong: 9520,
//   globalCorrectPercent: 62,
//   totalResponses: 25000
// }
```

### 7. Imprimer les stats dans la console

```javascript
import { printQuestionsStats } from '@/firebase/index.js'

await printQuestionsStats()
// Affiche un joli résumé dans la console
```

## Règles de sécurité Firestore

À configurer dans Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tout le monde peut lire les questions
    match /questions/{questionId} {
      allow read: if true;
      // Seulement les administrateurs peuvent écrire
      allow write: if request.auth.uid in get(/databases/$(database)/documents/admin/users).data.admins;
    }
    
    // Utilisateurs - données privées
    match /users/{userId}/gameData/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

## Exemple d'intégration dans un composant

```vue
<script setup>
import { onMounted, ref } from 'vue'
import { loadAllQuestions, updateQuestionStats } from '@/firebase/index.js'

const questions = ref([])
const loading = ref(true)

onMounted(async () => {
  const result = await loadAllQuestions()
  if (result.success) {
    questions.value = result.data
  }
  loading.value = false
})

async function answerQuestion(questionId, isCorrect) {
  await updateQuestionStats(questionId, isCorrect)
}
</script>

<template>
  <div v-if="!loading">
    <div v-for="q in questions" :key="q.id">
      <h4>{{ q.text }}</h4>
      <p>Bonnes réponses: {{ q.correctCount }}</p>
      <p>Mauvaises réponses: {{ q.wrongCount }}</p>
    </div>
  </div>
</template>
```

## Notes importantes

- Les statistiques (`correctCount`, `wrongCount`) sont synchronisées en temps réel
- Le `percent` est recalculé automatiquement quand nécessaire
- Les questions sont immuables une fois créées (sauf stats)
- L'initialisation n'écrase pas les données existantes (utilise `merge: true`)
