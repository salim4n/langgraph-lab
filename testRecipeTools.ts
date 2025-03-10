import { 
  searchRecipes, 
  searchRecipesByTitle, 
  searchRecipesByIngredient, 
  searchRecipesByCategory,
  getRecipeById,
  getSimilarRecipes,
  getAvailableCategories,
  getPopularAuthors,
  findRecipesByAvailableIngredients,
  closeConnection
} from './recipeTools.js';

/**
 * Fonction utilitaire pour ajouter un délai
 * @param ms Délai en millisecondes
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fonction pour exécuter un test individuel
 * @param name Nom du test
 * @param testFn Fonction de test
 */
async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  console.log(`\n📋 Test: ${name}`);
  try {
    await testFn();
    await delay(100); // Petit délai pour s'assurer que la sortie console est complète
  } catch (error) {
    console.error(`❌ Erreur dans le test "${name}":`, error);
  }
}

/**
 * Fonction principale pour exécuter les tests
 */
async function runTests() {
  console.log('🧪 Démarrage des tests des fonctionnalités de recherche de recettes...\n');
  
  try {
    // Test 1: Recherche de base avec pagination
    await runTest('Recherche de base avec pagination', async () => {
      const basicResults = await searchRecipes({ limit: 5, offset: 0 });
      console.log(`✅ Trouvé ${basicResults?.total} recettes au total, affichage de ${basicResults?.data?.length} recettes`);
      console.log(`   Page ${basicResults?.page}/${basicResults?.totalPages}, ${basicResults?.pageSize} recettes par page`);
      console.log('   Première recette:', basicResults?.data[0]?.title);
    });

    // Test 2: Recherche par titre
    await runTest('Recherche par titre', async () => {
      const titleQuery = 'chicken';
      const titleResults = await searchRecipesByTitle(titleQuery, 3);
      console.log(`✅ Recherche de recettes contenant "${titleQuery}" dans le titre:`);
      for (let i = 0; i < titleResults?.data?.length; i++) {
        console.log(`   ${i + 1}. ${titleResults?.data[i]?.title}`);
      }
    });

    // Test 3: Recherche par ingrédient
    await runTest('Recherche par ingrédient', async () => {
      const ingredientQuery = 'garlic';
      const ingredientResults = await searchRecipesByIngredient(ingredientQuery, 3);
      console.log(`✅ Recherche de recettes contenant "${ingredientQuery}" dans les ingrédients:`);
      for (let i = 0; i < ingredientResults.data.length; i++) {
        console.log(`   ${i + 1}. ${ingredientResults.data[i].title}`);
      }
    });

    // Test 4: Recherche par catégorie
    await runTest('Recherche par catégorie', async () => {
      const categoryQuery = 'dessert';
      const categoryResults = await searchRecipesByCategory(categoryQuery, 3);
      console.log(`✅ Recherche de recettes dans la catégorie "${categoryQuery}":`);
      for (let i = 0; i < categoryResults.data.length; i++) {
        console.log(`   ${i + 1}. ${categoryResults.data[i].title}`);
      }
    });

    // Test 5: Recherche avec plusieurs critères
    await runTest('Recherche avec plusieurs critères', async () => {
      const complexResults = await searchRecipes({
        title: 'cake',
        minRating: 4.5,
        limit: 3
      });
      console.log(`✅ Recherche de gâteaux avec une note d'au moins 4.5:`);
      for (let i = 0; i < complexResults.data.length; i++) {
        console.log(`   ${i + 1}. ${complexResults.data[i].title} - Note: ${complexResults.data[i].rating}`);
      }
    });

    // Test 6: Récupération d'une recette par ID
    await runTest('Récupération d\'une recette par ID', async () => {
      const firstRecipe = await searchRecipes({ limit: 1 });
      if (firstRecipe.data.length > 0) {
        const firstRecipeId = firstRecipe.data[0].id;
        const recipe = await getRecipeById(firstRecipeId);
        console.log(`✅ Recette avec l'ID ${firstRecipeId}:`);
        console.log(`   Titre: ${recipe?.title}`);
        console.log(`   Catégorie: ${recipe?.category}`);
        console.log(`   Note: ${recipe?.rating}`);
      } else {
        console.log('❌ Aucune recette disponible pour tester getRecipeById');
      }
    });

    // Test 7: Recherche de recettes similaires
    await runTest('Recherche de recettes similaires', async () => {
      const firstRecipe = await searchRecipes({ limit: 1 });
      if (firstRecipe.data.length > 0) {
        const referenceRecipeId = firstRecipe.data[0].id;
        const similarRecipes = await getSimilarRecipes(referenceRecipeId, 3);
        console.log(`✅ Recettes similaires à la recette avec l'ID ${referenceRecipeId}:`);
        for (let i = 0; i < similarRecipes.length; i++) {
          console.log(`   ${i + 1}. ${similarRecipes[i].title}`);
        }
      } else {
        console.log('❌ Aucune recette disponible pour tester getSimilarRecipes');
      }
    });

    // Test 8: Récupération des catégories disponibles
    await runTest('Récupération des catégories disponibles', async () => {
      const categories = await getAvailableCategories();
      console.log(`✅ ${categories.length} catégories disponibles:`);
      console.log(`   ${categories.slice(0, 10).join(', ')}${categories.length > 10 ? '...' : ''}`);
    });

    // Test 9: Récupération des auteurs populaires
    await runTest('Récupération des auteurs populaires', async () => {
      const authors = await getPopularAuthors(5);
      console.log(`✅ Top 5 des auteurs populaires:`);
      for (let i = 0; i < authors.length; i++) {
        console.log(`   ${i + 1}. ${authors[i].author} (${authors[i].count} recettes)`);
      }
    });

    // Test 10: Recherche par ingrédients disponibles
    await runTest('Recherche par ingrédients disponibles', async () => {
      const availableIngredients = ['chicken', 'rice', 'onion', 'garlic'];
      const availableResults = await findRecipesByAvailableIngredients(availableIngredients, 3);
      console.log(`✅ Recettes réalisables avec les ingrédients disponibles (${availableIngredients.join(', ')}):`);
      for (let i = 0; i < availableResults.length; i++) {
        console.log(`   ${i + 1}. ${availableResults[i].title} - Correspondance: ${availableResults[i].matchPercentage.toFixed(1)}%, Ingrédients manquants: ${availableResults[i].missingIngredientsCount}`);
      }
    });

    console.log('\n🎉 Tous les tests ont été exécutés avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des tests:', error);
  } finally {
    // Fermeture de la connexion à la base de données
    await closeConnection();
  }
}

// Exécution des tests
runTests().catch(error => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});
