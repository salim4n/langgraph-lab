import * as recipeTools from './recipeTools.js';

/**
 * Interface pour les recettes
 */
interface Recipe {
  id: number;
  name: string | null;
  ingredients: string;
  steps: string;
  tags: string | null;
  description: string | null;
  nutrition: string | null;
  cookingTime: number | null;
  difficulty: string | null;
  cuisine: string | null;
  matchPercentage?: number;
  missingIngredientsCount?: number;
}

/**
 * Interface pour les tags populaires
 */
interface PopularTag {
  tag: string;
  count: number;
}

/**
 * Fonction de démonstration pour montrer comment utiliser les outils de recettes
 */
async function demoRecipeTools() {
  try {
    console.log('=== DÉMONSTRATION DES OUTILS DE RECETTES ===\n');

    // 1. Recherche de recettes par terme
    console.log('1. Recherche de recettes contenant "pasta":');
    const pastaRecipes = await recipeTools.searchRecipes({ 
      searchTerm: 'pasta', 
      limit: 3 
    });
    console.log(`Trouvé ${pastaRecipes.total} recettes (affichage des 3 premières):`);
    pastaRecipes.data.forEach((recipe: Recipe) => {
      console.log(`- ${recipe.name || 'Sans nom'} (ID: ${recipe.id})`);
    });
    console.log();

    // 2. Recherche par ingrédients
    console.log('2. Recherche de recettes contenant "chicken" et "garlic":');
    const chickenGarlicRecipes = await recipeTools.searchRecipes({ 
      ingredients: ['chicken', 'garlic'], 
      limit: 3 
    });
    console.log(`Trouvé ${chickenGarlicRecipes.total} recettes (affichage des 3 premières):`);
    chickenGarlicRecipes.data.forEach((recipe: Recipe) => {
      console.log(`- ${recipe.name || 'Sans nom'} (ID: ${recipe.id})`);
    });
    console.log();

    // 3. Recherche par cuisine
    console.log('3. Recherche de recettes de cuisine italienne:');
    const italianRecipes = await recipeTools.searchRecipes({ 
      cuisine: 'Italian', 
      limit: 3 
    });
    console.log(`Trouvé ${italianRecipes.total} recettes italiennes (affichage des 3 premières):`);
    italianRecipes.data.forEach((recipe: Recipe) => {
      console.log(`- ${recipe.name || 'Sans nom'} (ID: ${recipe.id})`);
    });
    console.log();

    // 4. Recherche par difficulté
    console.log('4. Recherche de recettes faciles:');
    const easyRecipes = await recipeTools.searchRecipes({ 
      difficulty: 'easy', 
      limit: 3 
    });
    console.log(`Trouvé ${easyRecipes.total} recettes faciles (affichage des 3 premières):`);
    easyRecipes.data.forEach((recipe: Recipe) => {
      console.log(`- ${recipe.name || 'Sans nom'} (ID: ${recipe.id})`);
    });
    console.log();

    // 5. Recherche par temps de cuisson maximum
    console.log('5. Recherche de recettes rapides (moins de 30 minutes):');
    const quickRecipes = await recipeTools.searchRecipes({ 
      maxCookingTime: 30, 
      limit: 3 
    });
    console.log(`Trouvé ${quickRecipes.total} recettes rapides (affichage des 3 premières):`);
    quickRecipes.data.forEach((recipe: Recipe) => {
      console.log(`- ${recipe.name || 'Sans nom'} (ID: ${recipe.id})`);
    });
    console.log();

    // 6. Récupération d'une recette par ID
    if (pastaRecipes.data.length > 0) {
      const recipeId = pastaRecipes.data[0].id;
      console.log(`6. Détails de la recette avec l'ID ${recipeId}:`);
      const recipeDetails = await recipeTools.getRecipeById(recipeId) as Recipe;
      console.log(`Nom: ${recipeDetails.name || 'Non spécifié'}`);
      console.log(`Ingrédients: ${recipeDetails.ingredients || 'Non spécifiés'}`);
      console.log(`Étapes: ${recipeDetails.steps || 'Non spécifiées'}`);
      console.log(`Cuisine: ${recipeDetails.cuisine || 'Non spécifiée'}`);
      console.log(`Difficulté: ${recipeDetails.difficulty || 'Non spécifiée'}`);
      console.log(`Temps de cuisson: ${recipeDetails.cookingTime || 'Non spécifié'} minutes`);
      console.log();
    }

    // 7. Recherche de recettes similaires
    if (pastaRecipes.data.length > 0) {
      const recipeId = pastaRecipes.data[0].id;
      console.log(`7. Recettes similaires à la recette avec l'ID ${recipeId}:`);
      const similarRecipes = await recipeTools.getSimilarRecipes(recipeId, 3);
      similarRecipes.forEach((recipe: Recipe) => {
        console.log(`- ${recipe.name || 'Sans nom'} (ID: ${recipe.id})`);
      });
      console.log();
    }

    // 8. Récupération des cuisines disponibles
    console.log('8. Cuisines disponibles:');
    const cuisines = await recipeTools.getAvailableCuisines();
    console.log(`${cuisines.length} cuisines trouvées. Exemples: ${cuisines.length > 0 ? cuisines.slice(0, 5).join(', ') : 'Aucune'}`);
    console.log();

    // 9. Récupération des niveaux de difficulté disponibles
    console.log('9. Niveaux de difficulté disponibles:');
    const difficulties = await recipeTools.getAvailableDifficulties();
    console.log(difficulties.length > 0 ? difficulties.join(', ') : 'Aucun niveau de difficulté trouvé');
    console.log();

    // 10. Récupération des tags populaires
    console.log('10. Tags populaires:');
    const popularTags = await recipeTools.getPopularTags(10);
    if (popularTags.length > 0) {
      popularTags.forEach((tag: PopularTag) => {
        console.log(`- ${tag.tag}: ${tag.count} recettes`);
      });
    } else {
      console.log('Aucun tag trouvé');
    }
    console.log();

    // 11. Recherche de recettes par ingrédients disponibles
    console.log('11. Recettes réalisables avec les ingrédients disponibles:');
    const availableIngredients = ['chicken', 'rice', 'onion', 'garlic', 'tomato'];
    console.log(`Ingrédients disponibles: ${availableIngredients.join(', ')}`);
    const possibleRecipes = await recipeTools.findRecipesByAvailableIngredients(availableIngredients, 3);
    if (possibleRecipes.length > 0) {
      possibleRecipes.forEach((recipe: Recipe) => {
        console.log(`- ${recipe.name || 'Sans nom'} (correspondance: ${recipe.matchPercentage?.toFixed(1)}%, ingrédients manquants: ${recipe.missingIngredientsCount})`);
      });
    } else {
      console.log('Aucune recette trouvée avec ces ingrédients');
    }
    console.log();

  } catch (error) {
    console.error('Erreur lors de la démonstration:', error);
  } finally {
    // Ferme la connexion à la base de données
    await recipeTools.closeConnection();
  }
}

// Exécute la démonstration
demoRecipeTools();
