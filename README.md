# ChefBot - Swarm d'Agents IA pour la Recherche de Recettes

Ce projet est un exemple d'implémentation d'un swarm d'agents IA spécialisés utilisant LangGraph, LangChain et une base de données SQL pour créer un assistant culinaire intelligent.

## 🍳 Présentation

Le projet implémente un système de swarm composé de deux agents spécialisés :
- **ChefBot** : Un expert culinaire qui répond uniquement aux questions liées à la cuisine et aux recettes
- **Assistant** : Un assistant général qui répond à toutes les autres questions

Le système utilise une base de données SQL contenant des recettes et permet de rechercher des recettes selon différents critères (ingrédients, catégories, auteurs, etc.).

## 📁 Structure du Projet

### Fichiers Principaux

- **`swarm.ts`** : Configuration et exécution du swarm d'agents, définition des agents ChefBot et Assistant
- **`recipeTools.ts`** : Outils de recherche et manipulation des recettes dans la base de données
- **`testRecipeTools.ts`** : Tests unitaires pour les outils de recettes
- **`recipeDemo.ts`** : Démonstration d'utilisation des outils de recettes
- **`.env`** : Configuration des variables d'environnement (connexion à la base de données, clés API)
- **`prisma/schema.prisma`** : Schéma de la base de données pour Prisma ORM

## 🚀 Installation et Configuration

### Prérequis

- Node.js (v16+)
- PostgreSQL ou autre base de données compatible avec Prisma
- Clé API OpenAI

### Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer le fichier .env avec vos propres valeurs
```

### Configuration de la Base de Données

1. Créer une base de données PostgreSQL
2. Configurer la connexion dans le fichier `.env` :
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/recipes_db"
   ```
3. Initialiser la base de données avec le script prévu à cet effet :
   ```bash
   npx tsx initDb.ts
   ```
4. (Optionnel) Vous pouvez explorer la structure des données avec :
   ```bash
   npx tsx fetchCsvStructure.ts
   ```

## 📋 Commandes Principales

### Tester les Outils de Recettes

Pour tester individuellement les outils de recherche de recettes :

```bash
npx tsx testRecipeTools.ts
```

Ce script teste les différentes fonctions de recherche et affiche les résultats.

### Exécuter le Swarm

Pour lancer le swarm d'agents et tester ses capacités :

```bash
npx tsx swarm.ts
```

Ce script exécute plusieurs tests pour vérifier que :
1. Les questions culinaires sont traitées par ChefBot
2. Les questions générales sont traitées par l'Assistant
3. Les recherches par ingrédients fonctionnent correctement

### Démo des Outils de Recettes

Pour une démonstration interactive des outils de recettes :

```bash
npx tsx recipeDemo.ts
```

## 🔧 Outils de Recettes Disponibles

Le ChefBot dispose des outils suivants pour répondre aux questions culinaires :

- **searchRecipesTool** : Recherche générale de recettes avec plusieurs critères
- **searchRecipesByTitleTool** : Recherche par titre de recette
- **searchRecipesByIngredientTool** : Recherche par ingrédient spécifique
- **searchRecipesByCategoryTool** : Recherche par catégorie de recette
- **getRecipeByIdTool** : Récupère une recette par son ID
- **getSimilarRecipesTool** : Trouve des recettes similaires à une recette donnée
- **getAvailableCategoriesTool** : Liste les catégories disponibles
- **getPopularAuthorsTool** : Liste les auteurs populaires
- **findRecipesByAvailableIngredientsTool** : Trouve des recettes réalisables avec les ingrédients disponibles

## 🔍 Fonctionnement du Swarm

Le swarm utilise le framework LangGraph pour orchestrer les interactions entre les agents :

1. Chaque requête utilisateur est d'abord évaluée pour déterminer l'agent approprié
2. Si la requête concerne la cuisine, elle est dirigée vers ChefBot
3. Sinon, elle est traitée par l'Assistant général
4. Les agents peuvent se transférer des requêtes entre eux si nécessaire

## 🛠️ Personnalisation

### Ajouter de Nouveaux Outils

Pour ajouter de nouveaux outils au ChefBot :

1. Définir la fonction dans `recipeTools.ts`
2. Créer un outil LangChain avec la fonction `tool()`
3. Ajouter l'outil à la liste des outils de ChefBot dans `swarm.ts`

### Modifier le Comportement des Agents

Les prompts des agents peuvent être modifiés dans `swarm.ts` pour ajuster leur comportement.

## ⚠️ Gestion des Erreurs

Le projet inclut une gestion des erreurs pour les problèmes courants :
- Sérialisation des BigInt pour la communication avec l'API OpenAI
- Fermeture propre des connexions à la base de données
- Validation des entrées utilisateur

## 📝 Notes Techniques

- Le projet utilise Prisma comme ORM pour interagir avec la base de données
- La fonction `serializeWithBigInt` est utilisée pour gérer la sérialisation des objets BigInt
- Les résultats de recherche sont paginés pour gérer de grandes quantités de données

## 🤝 Contribution

N'hésitez pas à contribuer à ce projet en soumettant des pull requests ou en signalant des problèmes.

## 📄 Licence

Ce projet est sous licence MIT.
