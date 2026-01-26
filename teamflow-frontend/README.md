# TeamFlow Frontend

## 📋 Vue d'ensemble

**TeamFlow Frontend** est une application Angular moderne développée pour gérer des projets collaboratifs de type Kanban. L'application communique avec un backend Spring Boot via une API REST sécurisée par JWT.

## 🛠️ Stack Technique

- **Framework**: Angular 19 (standalone components)
- **UI Library**: Angular Material
- **Styling**: SCSS
- **Authentication**: JWT (Bearer Token)
- **HTTP Client**: Angular HttpClient avec intercepteurs
- **Routing**: Angular Router avec lazy loading
- **State Management**: RxJS (BehaviorSubject)

## 📂 Architecture du Projet

```
src/app/
├── core/                          # Fonctionnalités core de l'application
│   ├── guards/
│   │   └── auth.guard.ts         # Protection des routes authentifiées
│   ├── interceptors/
│   │   └── auth.interceptor.ts   # Injection automatique du token JWT
│   └── services/
│       └── auth.service.ts       # Gestion authentification et tokens
│
├── shared/                        # Ressources partagées
│   └── models/
│       ├── user.model.ts         # Interface User
│       ├── auth.model.ts         # Interfaces Auth (Login, Register, Response)
│       └── index.ts              # Barrel exports
│
├── features/                      # Modules fonctionnels
│   ├── auth/
│   │   ├── login/                # Page de connexion
│   │   │   ├── login.component.ts
│   │   │   ├── login.component.html
│   │   │   └── login.component.scss
│   │   └── register/             # Page d'inscription
│   │       ├── register.component.ts
│   │       ├── register.component.html
│   │       └── register.component.scss
│   ├── projects/                 # Page projets (protégée)
│   │   ├── projects.component.ts
│   │   ├── projects.component.html
│   │   └── projects.component.scss
│   ├── board/                    # À implémenter (Kanban board)
│   └── tasks/                    # À implémenter (Gestion des tâches)
│
├── app.routes.ts                 # Configuration du routing
├── app.config.ts                 # Configuration de l'application
├── app.ts                        # Composant racine
└── app.html                      # Template racine
```

## 🔐 Système d'Authentification

### AuthService (`core/services/auth.service.ts`)

Service principal gérant l'authentification:

```typescript
- register(request: RegisterRequest): Observable<AuthResponse>
- login(request: LoginRequest): Observable<AuthResponse>
- logout(): void
- getToken(): string | null
- getUserEmail(): string | null
- isAuthenticated(): boolean
```

**Stockage sécurisé:**
- Token JWT: `localStorage.getItem('teamflow_token')`
- Email utilisateur: `localStorage.getItem('teamflow_email')`

### AuthInterceptor (`core/interceptors/auth.interceptor.ts`)

Intercepteur HTTP fonctionnel qui:
- Récupère automatiquement le token JWT
- Injecte le header `Authorization: Bearer {token}` dans toutes les requêtes API
- S'exécute transparently sans modification du code métier

### AuthGuard (`core/guards/auth.guard.ts`)

Guard fonctionnel qui:
- Protège les routes nécessitant une authentification
- Redirige vers `/login` si non authentifié
- Conserve l'URL de retour dans les query params

## 🎯 Fonctionnalités Implémentées

### ✅ Pages d'Authentification

#### 1. **LoginComponent** (`/login`)
- Formulaire réactif avec validation
- Champs: Email, Password
- Validation email format
- Validation longueur minimum du mot de passe (6 caractères)
- Toggle visibilité du mot de passe
- Gestion des erreurs API
- Loading spinner pendant la requête
- Redirection automatique vers `/projects` après login

#### 2. **RegisterComponent** (`/register`)
- Formulaire réactif avec validation complète
- Champs: Full Name, Email, Password, Confirm Password
- Validation de correspondance des mots de passe
- Validation nom minimum 3 caractères
- Design cohérent avec LoginComponent
- Redirection automatique après inscription

#### 3. **ProjectsComponent** (`/projects`) - Protected
- Page protégée par AuthGuard
- Toolbar avec logout
- Affichage de l'email utilisateur
- Placeholder pour fonctionnalités futures

## 🚀 Installation et Démarrage

### Prérequis
- Node.js (v18+)
- npm
- Angular CLI (`npm install -g @angular/cli`)

### Installation

```bash
# Installer les dépendances
npm install
```

### Démarrage

```bash
# Démarrer le serveur de développement
ng serve

# L'application sera accessible sur http://localhost:4200
```

### Build de Production

```bash
# Créer le build optimisé
ng build --configuration production
```

## 🔌 Configuration Backend

L'application est configurée pour communiquer avec le backend Spring Boot:

**API Base URL**: `http://localhost:8080/api`

### Endpoints utilisés:

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/auth/register` | Inscription utilisateur |
| `POST` | `/api/auth/login` | Connexion utilisateur |
| `GET` | `/api/projects/*` | Endpoints projets (protégés) |

## 📡 Gestion des Requêtes HTTP

### Configuration HTTP Client

```typescript
// app.config.ts
providers: [
  provideHttpClient(withInterceptors([authInterceptor]))
]
```

### Exemple d'utilisation

```typescript
// Le token est automatiquement injecté par l'intercepteur
this.http.get('/api/projects').subscribe(data => {
  // Les headers incluent automatiquement:
  // Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
});
```

## 🎨 Design UI

### Thème Angular Material
- **Thème**: Indigo-Pink
- **Typography**: Enabled
- **Animations**: Enabled

### Style Global
- Gradient backgrounds pour les pages d'auth
- Design moderne et épuré
- Responsive design
- Scrollbar personnalisée
- Material Icons

## 🛣️ Routing

```typescript
Routes:
├── '' → redirect to '/login'
├── /login → LoginComponent (public)
├── /register → RegisterComponent (public)
├── /projects → ProjectsComponent (protected by authGuard)
└── /** → redirect to '/login'
```

**Lazy Loading**: Tous les composants utilisent le lazy loading pour optimiser les performances.

## 🧪 Validation des Formulaires

### Login Form
```typescript
email: [required, email format]
password: [required, min 6 characters]
```

### Register Form
```typescript
fullName: [required, min 3 characters]
email: [required, email format]
password: [required, min 6 characters]
confirmPassword: [required, must match password]
```

## 🔄 Flow d'Authentification

### 1. Inscription

```
User → RegisterComponent
     → AuthService.register()
     → POST /api/auth/register
     → Store token in localStorage
     → Navigate to /projects
```

### 2. Connexion

```
User → LoginComponent
     → AuthService.login()
     → POST /api/auth/login
     → Store token in localStorage
     → Navigate to /projects
```

### 3. Accès Route Protégée

```
User → Navigate to /projects
     → AuthGuard.canActivate()
     → Check if token exists
     → If YES: Allow access
     → If NO: Redirect to /login
```

### 4. Requête API Protégée

```
Component → HTTP Request
         → AuthInterceptor
         → Add Authorization header
         → Send to backend
         → Backend validates JWT
         → Return data
```

## 📦 Dépendances Principales

```json
{
  "@angular/core": "^19.x",
  "@angular/material": "^21.x",
  "rxjs": "^7.x"
}
```

## 🚧 Fonctionnalités À Implémenter

### Features Modules
- [ ] **Board Module** - Tableau Kanban interactif
- [ ] **Tasks Module** - Gestion détaillée des tâches
  - [ ] CRUD tâches
  - [ ] Sous-tâches
  - [ ] Commentaires
  - [ ] Pièces jointes
- [ ] **Projects Module** - Liste et gestion des projets
- [ ] **Teams Module** - Gestion des membres et rôles

### Services
- [ ] ProjectService
- [ ] TaskService
- [ ] ColumnService
- [ ] MembershipService

### Composants Partagés
- [ ] Navbar component
- [ ] Sidebar component
- [ ] Card component
- [ ] Modal/Dialog components

## 🔒 Sécurité

### Implémenté
✅ JWT Token stocké dans localStorage  
✅ Injection automatique du token dans les headers  
✅ Protection des routes par AuthGuard  
✅ Validation des formulaires côté client  
✅ Redirection automatique si non authentifié  

### Best Practices
- Le token est supprimé lors du logout
- Pas de token exposé dans l'URL
- Les routes protégées redirigent vers login
- Validation stricte des formulaires

## 📝 Scripts NPM

```bash
# Développement
npm start              # Démarre ng serve

# Build
npm run build         # Build de production

# Tests
npm test              # Unit tests
npm run e2e           # Tests end-to-end
```

## 🤝 Intégration Backend

### Format des Requêtes/Réponses

**Register Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Auth Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "email": "john@example.com"
}
```

## 📞 Support

Pour toute question ou problème, veuillez consulter la documentation du backend Spring Boot ou contacter l'équipe de développement.

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2026-01-26
