# 🎱 Billard Score Tracker

Application web progressive (PWA) pour gérer les scores de parties de billard en temps réel avec synchronisation multijoueurs.

## 📱 Fonctionnalités principales

- ✅ **Synchronisation temps réel** : Les scores se mettent à jour instantanément pour tous les joueurs
- ✅ **Sessions multijoueurs** : Jusqu'à 20 joueurs par partie
- ✅ **Invitations** : Partagez un code ou un lien pour inviter des amis
- ✅ **Réinitialisation rapide** : Boutons pour recommencer une partie
- ✅ **Statistiques** : Suivi des performances globales et personnelles
- ✅ **Design thématique** : Interface inspirée par les couleurs du billard
- ✅ **Accessible partout** : Sur navigateur mobile de n'importe quel appareil

## 🛠️ Stack technologique

| Composant | Technologie |
|-----------|-------------|
| **Frontend** | React + Vite |
| **Styles** | Tailwind CSS + animations personnalisées |
| **Base de données** | Firebase Realtime Database |
| **Authentification** | Firebase Auth (anonyme + Google) |
| **PWA** | Service Worker + Web Manifest |
| **Déploiement** | Firebase Hosting |

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+ et npm
- Un compte Firebase gratuit

### Installation

```bash
# Cloner le projet
git clone https://github.com/jcd176/Billard.git
cd Billard

# Installer les dépendances
npm install

# Configurer Firebase (.env.local)
# Copier VITE_FIREBASE_CONFIG depuis votre console Firebase
cp .env.example .env.local

# Démarrer en développement
npm run dev

# Ou construire pour la production
npm run build
```

## 📁 Structure du projet

```
Billard/
├── public/              # Assets statiques et manifest PWA
├── src/
│   ├── components/      # Composants React réutilisables
│   ├── pages/           # Pages principales
│   ├── services/        # Logique Firebase et API
│   ├── styles/          # Styles globaux
│   ├── App.jsx          # Composant racine
│   └── main.jsx         # Point d'entrée
├── .env.example         # Template de configuration
└── package.json         # Dépendances et scripts
```

## 📋 Roadmap développement

### Phase 1 : MVP (Semaines 1-2)
- [ ] Setup React + Vite + Tailwind
- [ ] Interface créer une partie
- [ ] Affichage tableau de scores simple
- [ ] Boutons +/- pour modifier les scores

### Phase 2 : Synchronisation (Semaines 3-4)
- [ ] Intégration Firebase Realtime Database
- [ ] Synchronisation temps réel entre joueurs
- [ ] Persistance des données

### Phase 3 : Sessions multijoueurs (Semaines 5-6)
- [ ] Système d'invitations avec code
- [ ] Gestion des joueurs (ajout/suppression)
- [ ] Authentification anonyme et Google

### Phase 4 : Statistiques (Semaines 7-8)
- [ ] Dashboard statistiques globales
- [ ] Stats personnelles par joueur
- [ ] Historique des parties

### Phase 5 : Design & Polissage (Semaines 9-10)
- [ ] Thème billard (couleurs verte/bleue/noir/or)
- [ ] Animation du tapis de billard
- [ ] Interface mobile optimisée
- [ ] PWA manifest et service worker

## 🎨 Palette de couleurs

```
Vert billard:   #0B5E2F
Bleu océan:     #1E3A8A
Noir profond:   #1F2937
Or accent:      #F59E0B
Blanc:          #F9FAFB
```

## 📚 Ressources d'apprentissage

### Pour débuter avec React
- [React Documentation](https://react.dev) - Guide officiel
- [React Tutorial - Tic Tac Toe](https://react.dev/learn/tutorial-tic-tac-toe) - Excellent pour apprendre les bases

### Pour Firebase
- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
- [Realtime Database Guide](https://firebase.google.com/docs/database)

### Pour PWA
- [Web.dev - PWA Basics](https://web.dev/progressive-web-apps/)

## 🤝 Contribution et support

Ce projet est en phase de développement. Les issues sont documentées dans l'onglet "Issues" pour suivre la progression.

**Vous n'avez pas d'expérience en code ?** Pas de problème! :
1. Chaque issue a des instructions détaillées
2. Les commentaires expliquent le "pourquoi" pas seulement le "quoi"
3. Des liens vers des tutoriels sont fournis pour chaque concept nouveau

## 📄 Licence

MIT - Libre d'utilisation

---

**Dernière mise à jour:** Mai 2026

