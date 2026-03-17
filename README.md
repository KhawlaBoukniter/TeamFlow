# 🚀 TeamFlow — Collaborative Project Management Platform

<p align="center">
  <strong>A full-stack project management application inspired by Linear, built with Spring Boot & Angular.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.4.1-6DB33F?style=for-the-badge&logo=spring-boot" alt="Spring Boot"/>
  <img src="https://img.shields.io/badge/Angular-17-DD0031?style=for-the-badge&logo=angular" alt="Angular"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
</p>

---

## 📋 Table des matières

- [Aperçu](#-aperçu)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Technologies](#-technologies)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Déploiement Docker](#-déploiement-docker)
- [Structure du projet](#-structure-du-projet)
- [API REST](#-api-rest)
- [Auteur](#-auteur)

---

## 🎯 Aperçu

**TeamFlow** est une plateforme de gestion de projets collaborative conçue pour optimiser la productivité des équipes. Elle permet de créer et suivre des projets, gérer des tâches avec des workflows personnalisables, collaborer en temps réel via un chat intégré, et suivre la progression à travers des tableaux de bord interactifs.

L'interface adopte une esthétique premium inspirée de **Linear**, avec un thème sombre élégant, des animations fluides et une expérience utilisateur intuitive.

---

## ✨ Fonctionnalités

### 🔐 Authentification & Sécurité
- Inscription / Connexion sécurisée avec **JWT** (Access + Refresh Token)
- Gestion des rôles : **Administrateur**, **Manager**, **Membre**
- Protection des routes et contrôle d'accès par rôle
- Changement de mot de passe

### 📁 Gestion des Projets
- Création de projets **personnels** et **en équipe**
- Workflows personnalisables (colonnes Kanban)
- Gestion des membres et attribution de rôles par projet
- Archivage et suppression logique

### ✅ Gestion des Tâches
- Création, modification et suppression de tâches
- Priorités : **High**, **Medium**, **Low**
- Assignation de membres multiples
- Sous-tâches avec suivi de progression
- Commentaires et discussions sur les tâches
- Pièces jointes (fichiers)
- Drag & Drop entre colonnes du board Kanban

### 💬 Chat Temps Réel
- Room principale par projet d'équipe
- Sous-rooms thématiques (frontend, backend, etc.)
- Messagerie instantanée via **WebSocket**
- Indicateurs de présence en ligne

### 🔔 Notifications
- Notifications en temps réel (assignation, changement de statut, mentions)
- Centre de notifications (Inbox) intégré
- Marquage comme lu

### 📊 Tableau de Bord
- Statistiques par projet et par utilisateur
- Taux de complétion, tâches en retard
- Export CSV des données

### 🔍 Recherche Globale
- Recherche unifiée (projets, tâches, utilisateurs)
- Command Palette (`Ctrl+K`) pour navigation rapide

### 🛡️ Administration
- Gestion des utilisateurs (CRUD, activation/désactivation)
- Journal d'audit avec traçabilité complète
- Export des logs

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│    Frontend      │────▶│     Backend      │────▶│  PostgreSQL  │
│  Angular + Nginx │     │  Spring Boot     │     │   Database   │
│    Port: 80      │     │   Port: 8080     │     │  Port: 5432  │
└─────────────────┘     └──────────────────┘     └──────────────┘
        │                        │
        │    WebSocket (STOMP)   │
        └────────────────────────┘
```

L'application suit une architecture **3-tiers** :
- **Frontend** : Angular SPA servie par Nginx
- **Backend** : API REST Spring Boot avec WebSocket pour le temps réel
- **Base de données** : PostgreSQL pour la persistance

---

## 🛠️ Technologies

### Backend
| Technologie | Version | Rôle |
|---|---|---|
| **Java** | 17 | Langage principal |
| **Spring Boot** | 3.4.1 | Framework backend |
| **Spring Security** | - | Authentification & autorisation |
| **Spring Data JPA** | - | Accès aux données (ORM Hibernate) |
| **Spring WebSocket** | - | Communication temps réel |
| **Spring Validation** | - | Validation des données |
| **PostgreSQL** | 15 | Base de données relationnelle |
| **JWT (jjwt)** | 0.11.5 | Gestion des tokens |
| **Lombok** | - | Réduction du boilerplate |
| **Maven** | - | Gestion des dépendances |

### Frontend
| Technologie | Version | Rôle |
|---|---|---|
| **Angular** | 17 | Framework frontend |
| **Angular Material** | - | Composants UI (menus, dialogues, etc.) |
| **Angular CDK** | - | Drag & Drop |
| **Tailwind CSS** | - | Utilitaires CSS |
| **RxJS** | - | Programmation réactive |
| **TypeScript** | - | Typage statique |

### DevOps
| Technologie | Rôle |
|---|---|
| **Docker** | Conteneurisation |
| **Docker Compose** | Orchestration des services |
| **Nginx** | Reverse proxy & serveur statique |

---

## 📦 Prérequis

### Développement local
- **Java** 17+
- **Maven** 3.8+
- **Node.js** 18+
- **npm** 9+
- **PostgreSQL** 15+
- **Angular CLI** (`npm install -g @angular/cli`)

### Déploiement Docker
- **Docker** 20+
- **Docker Compose** 2+

---

## ⚡ Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-utilisateur/teamflow.git
cd teamflow
```

### 2. Configurer la base de données

Créer une base de données PostgreSQL :

```sql
CREATE DATABASE teamflow_db;
```

### 3. Lancer le Backend

```bash
# Depuis la racine du projet
mvn spring-boot:run
```

Le backend sera accessible sur `http://localhost:8080`.

### 4. Lancer le Frontend

```bash
cd teamflow-frontend
npm install
ng serve
```

Le frontend sera accessible sur `http://localhost:4200`.

---

## 🐳 Déploiement Docker

L'application est entièrement dockerisée avec un fichier `docker-compose.yml` à la racine du projet.

### Lancer toute la stack

```bash
docker-compose up --build
```

Cela démarre les trois services :

| Service | Port | Description |
|---|---|---|
| **db** | `5432` | PostgreSQL 15 |
| **backend** | `8080` | API Spring Boot |
| **frontend** | `80` | Angular (Nginx) |

### Arrêter les services

```bash
docker-compose down
```

### Supprimer les données (volumes)

```bash
docker-compose down -v
```

### Variables d'environnement

| Variable | Défaut | Description |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://db:5432/teamflow_db` | URL de connexion à la BDD |
| `DB_USERNAME` | `postgres` | Utilisateur PostgreSQL |
| `DB_PASSWORD` | `postgres` | Mot de passe PostgreSQL |

---

## 📂 Structure du projet

```
teamflow/
├── 📄 docker-compose.yml          # Orchestration Docker
├── 📄 Dockerfile                   # Dockerfile Backend
├── 📄 pom.xml                      # Dépendances Maven
├── 📁 src/main/java/com/teamflow/
│   ├── 📁 config/                  # Configuration (CORS, WebSocket, Security)
│   ├── 📁 controller/              # Contrôleurs REST (14 endpoints)
│   │   ├── AuthController          # Authentification (login, register, refresh)
│   │   ├── ProjectController       # CRUD Projets
│   │   ├── TaskController          # CRUD Tâches
│   │   ├── ChatController          # Messagerie temps réel
│   │   ├── CommentController       # Commentaires sur tâches
│   │   ├── NotificationController  # Notifications
│   │   ├── DashboardController     # Statistiques
│   │   ├── SearchController        # Recherche globale
│   │   └── ...
│   ├── 📁 dto/                     # Data Transfer Objects (25 DTOs)
│   ├── 📁 entity/                  # Entités JPA (22 entités)
│   ├── 📁 exception/               # Gestion des exceptions
│   ├── 📁 repository/              # Repositories Spring Data (15)
│   ├── 📁 security/                # JWT Filter, UserDetails
│   └── 📁 service/                 # Services métier (interfaces + implémentations)
├── 📁 src/main/resources/
│   └── 📄 application.properties   # Configuration Spring Boot
├── 📁 teamflow-frontend/
│   ├── 📄 Dockerfile               # Dockerfile Frontend
│   ├── 📄 nginx.conf               # Configuration Nginx
│   ├── 📁 src/app/
│   │   ├── 📁 core/                # Services, Guards, Layout (Sidebar, Header)
│   │   ├── 📁 features/            # Modules fonctionnels
│   │   │   ├── 📁 auth/            # Login, Register
│   │   │   ├── 📁 projects/        # Projets, Board Kanban, Détails
│   │   │   ├── 📁 my-issues/       # Tâches assignées
│   │   │   ├── 📁 inbox/           # Centre de notifications
│   │   │   ├── 📁 dashboard/       # Tableau de bord
│   │   │   ├── 📁 admin/           # Administration, Audit
│   │   │   └── 📁 profile/         # Profil utilisateur
│   │   └── 📁 shared/              # Modèles, Composants partagés
│   └── 📁 src/environments/        # Configuration d'environnement
└── 📁 uploads/                     # Fichiers uploadés (pièces jointes)
```

---

## 🔌 API REST

L'API est organisée autour des ressources suivantes :

| Ressource | Endpoint | Description |
|---|---|---|
| **Auth** | `/api/auth/*` | Login, Register, Refresh Token |
| **Users** | `/api/users/*` | Gestion des utilisateurs |
| **Projects** | `/api/projects/*` | CRUD Projets |
| **Tasks** | `/api/tasks/*` | CRUD Tâches |
| **Columns** | `/api/columns/*` | Colonnes de workflow |
| **SubTasks** | `/api/subtasks/*` | Sous-tâches |
| **Comments** | `/api/comments/*` | Commentaires |
| **Attachments** | `/api/attachments/*` | Pièces jointes |
| **Memberships** | `/api/memberships/*` | Membres de projet |
| **Chat** | `/api/chat/*` | Rooms & Messages |
| **Notifications** | `/api/notifications/*` | Notifications |
| **Dashboard** | `/api/dashboard/*` | Statistiques |
| **Search** | `/api/search/*` | Recherche globale |
| **Audit Logs** | `/api/audit-logs/*` | Journal d'audit |

---

## 👤 Auteur

**Khawla Boukniter**

---

<p align="center">
  <em>Built with ❤️ using Spring Boot & Angular</em>
</p>
