# LogicDle - Configuration Firebase

## 📝 Prérequis

Vous devez avoir un projet Firebase créé. Si ce n'est pas fait :
1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Créez un nouveau projet
3. Activez **Firestore Database** et **Authentication** (Email/Password)

## ⚙️ Configuration

### 1. Récupérer les credentials Firebase

Dans Firebase Console :
- Allez à **Project Settings** > **Your apps** > Sélectionnez votre app web
- Copiez le code de configuration

### 2. Remplir les variables d'environnement

```bash
# Créer le fichier .env.local
cp .env.example .env.local
```

Ensuite, remplissez `.env.local` avec vos credentials :
```
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre_project_id
VITE_FIREBASE_STORAGE_BUCKET=votre_projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_messaging_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
```

## 🚀 Utilisation

### Installation et démarrage

```bash
npm install
npm run dev
```

### Structure des données Firestore

Les données de l'utilisateur sont stockées dans cette structure :

```
users/
├── {userId}/
│   └── gameData/
│       └── stats/
│           ├── totalScore (number)
│           ├── streak (number)
│           ├── lastPlayedDay (string)
│           ├── dailyDone (boolean)
│           ├── dailyScore (number)
│           ├── history (array)
│           └── updatedAt (string)
```

## 📚 Composables Firebase

### `useAuth()`
Gère l'authentification utilisateur.

```javascript
import { useAuth } from '@/composables/useAuth.js'

const { user, loading, register, login, logout } = useAuth()
```

### `useGameDB(userId)`
Gère la synchronisation des données du jeu.

```javascript
import { useGameDB } from '@/composables/useGameDB.js'

const { saveGameData, loadGameData, updateGameData } = useGameDB(userId)
```

## 🔄 Synchronisation automatique

- **Chargement** : Au montage de HomeView, les données Firestore sont chargées
- **Sauvegarde** : À la fin de chaque partie, les données sont synchronisées à Firestore
- **Fallback** : Les données localStorage sont utilisées en fallback

## 🧪 Développement avec l'émulateur

Pour développer localement avec l'émulateur Firebase :

1. Installez Firebase CLI
2. Décommentez les lignes d'émulateur dans `src/firebase.js`
3. Lancez l'émulateur : `firebase emulators:start`

## 🔒 Règles de sécurité Firestore

Exemple de règles à configurer dans Firestore Console :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chaque utilisateur ne peut accéder qu'à ses propres données
    match /users/{userId}/gameData/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

## 🐛 Troubleshooting

- **"Firebase not initialized"** : Vérifiez vos variables d'environnement
- **"CORS error"** : Vérifiez que votre domaine est autorisé dans Firebase Console
- **Les données ne se synchronisent pas** : Vérifiez les règles de sécurité Firestore
