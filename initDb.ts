import { PrismaClient } from '@prisma/client';

// Configuration
const CSV_URL = 'https://huggingface.co/datasets/Shengtao/recipe/resolve/main/recipe.csv';

// Interface pour les recettes du CSV
interface RecipeCSV {
  title: string;
  url: string;
  category: string;
  author: string;
  description: string;
  rating: string;
  rating_count: string;
  review_count: string;
  ingredients: string;
  directions: string;
  prep_time: string;
  cook_time: string;
  total_time: string;
  servings: string;
  yields: string;
  calories: string;
  carbohydrates_g: string;
  sugars_g: string;
  fat_g: string;
  protein_g: string;
  sodium_mg: string;
  instructions_list: string;
  image: string;
  [key: string]: string;
}

// Initialisation du client Prisma
const prisma = new PrismaClient();

/**
 * Fonction pour récupérer et parser les données CSV directement
 * @param url URL du fichier CSV
 * @returns Tableau d'objets RecipeCSV
 */
async function fetchAndParseCSV(url: string): Promise<RecipeCSV[]> {
  console.log(`Récupération des données CSV depuis ${url}...`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const csvContent = await response.text();
    console.log(`Fichier CSV récupéré (${(csvContent.length / 1024 / 1024).toFixed(2)} Mo)`);
    
    // Parser le CSV
    const rows = csvContent.split("\n");
    const headers = rows[0].split(",");
    
    console.log(`Nombre de lignes dans le CSV: ${rows.length}`);
    console.log(`En-têtes: ${headers.join(', ')}`);
    
    const recipes = rows.slice(1)
      .filter(row => row.trim() !== '') // Ignorer les lignes vides
      .map((row, index) => {
        try {
          // Utiliser une regex pour gérer correctement les virgules dans les champs entre guillemets
          const matches = [...row.matchAll(/"([^"]*)"|([^,]*),?/g)].filter(match => match[0] !== ',');
          const values = matches.map(match => {
            const value = match[1] !== undefined ? match[1] : match[2];
            return value ? value.trim() : '';
          });
          
          // Créer un objet recette
          const recipe: RecipeCSV = {} as RecipeCSV;
          
          // Assigner les valeurs aux propriétés correspondantes
          headers.forEach((header, i) => {
            if (i < values.length) {
              recipe[header.trim()] = values[i];
            } else {
              recipe[header.trim()] = '';
            }
          });
          
          return recipe;
        } catch (error) {
          console.error(`Erreur lors du parsing de la ligne ${index + 1}:`, error);
          return null;
        }
      })
      .filter((recipe): recipe is RecipeCSV => recipe !== null);
    
    console.log(`Nombre de recettes parsées: ${recipes.length}`);
    return recipes;
  } catch (error) {
    console.error('Erreur lors de la récupération ou du parsing du CSV:', error);
    throw error;
  }
}

/**
 * Fonction pour réinitialiser la base de données
 */
async function resetDatabase(): Promise<void> {
  try {
    // Supprimer toutes les recettes existantes
    await prisma.recipe.deleteMany({});
    console.log('Base de données réinitialisée');
  } catch (error) {
    console.error('Erreur lors de la réinitialisation de la base de données:', error);
    throw error;
  }
}

/**
 * Fonction pour convertir une valeur en nombre ou null
 * @param value Valeur à convertir
 * @returns Nombre ou null
 */
function toNumberOrNull(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

/**
 * Fonction pour convertir une valeur en nombre flottant ou null
 * @param value Valeur à convertir
 * @returns Nombre flottant ou null
 */
function toFloatOrNull(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

/**
 * Fonction pour convertir une valeur en chaîne ou null
 * @param value Valeur à convertir
 * @returns Chaîne ou null
 */
function toStringOrNull(value: string): string | null {
  if (!value || value.trim() === '') return null;
  return value;
}

/**
 * Fonction pour importer les recettes dans la base de données
 * @param recipes Tableau de recettes à importer
 */
async function importRecipes(recipes: RecipeCSV[]): Promise<void> {
  try {
    console.log(`Importation de ${recipes.length} recettes dans la base de données...`);
    
    let importedCount = 0;
    let errorCount = 0;
    
    // Importer les recettes une par une pour gérer les erreurs individuellement
    for (const recipe of recipes) {
      try {
        await prisma.recipe.create({
          data: {
            title: recipe.title || 'Sans titre',
            url: toStringOrNull(recipe.url),
            category: toStringOrNull(recipe.category),
            author: toStringOrNull(recipe.author),
            description: toStringOrNull(recipe.description),
            rating: toFloatOrNull(recipe.rating),
            ratingCount: toNumberOrNull(recipe.rating_count),
            reviewCount: toNumberOrNull(recipe.review_count),
            ingredients: recipe.ingredients || '',
            directions: recipe.directions || '',
            prepTime: toStringOrNull(recipe.prep_time),
            cookTime: toStringOrNull(recipe.cook_time),
            totalTime: toStringOrNull(recipe.total_time),
            servings: toNumberOrNull(recipe.servings),
            yields: toStringOrNull(recipe.yields),
            calories: toNumberOrNull(recipe.calories),
            carbohydrates: toFloatOrNull(recipe.carbohydrates_g),
            sugars: toFloatOrNull(recipe.sugars_g),
            fat: toFloatOrNull(recipe.fat_g),
            protein: toFloatOrNull(recipe.protein_g),
            sodium: toNumberOrNull(recipe.sodium_mg),
            instructionList: toStringOrNull(recipe.instructions_list),
            image: toStringOrNull(recipe.image)
          }
        });
        
        importedCount++;
        
        // Afficher la progression tous les 1000 enregistrements
        if (importedCount % 1000 === 0) {
          console.log(`${importedCount} recettes importées...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Erreur lors de l'importation de la recette "${recipe.title}":`, error);
        
        // Limiter le nombre d'erreurs affichées pour éviter de surcharger la console
        if (errorCount > 10) {
          console.error('Trop d\'erreurs, arrêt de l\'affichage des erreurs individuelles');
          break;
        }
      }
    }
    
    console.log(`Importation terminée: ${importedCount} recettes importées avec succès, ${errorCount} erreurs`);
  } catch (error) {
    console.error('Erreur lors de l\'importation des recettes:', error);
    throw error;
  }
}

/**
 * Fonction pour vérifier la base de données
 */
async function checkDatabase(): Promise<void> {
  try {
    const count = await prisma.recipe.count();
    console.log(`La base de données contient ${count} recettes`);
  } catch (error) {
    console.error('Erreur lors de la vérification de la base de données:', error);
    throw error;
  }
}

/**
 * Fonction principale
 */
async function main(): Promise<void> {
  try {
    console.log('Initialisation de la base de données de recettes...');
    
    // Étape 1: Réinitialiser la base de données
    await resetDatabase();
    
    // Étape 2: Récupérer et parser les données CSV
    const recipes = await fetchAndParseCSV(CSV_URL);
    
    // Étape 3: Importer les recettes dans la base de données
    await importRecipes(recipes);
    
    // Étape 4: Vérifier la base de données
    await checkDatabase();
    
    console.log('Initialisation terminée avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécute la fonction principale
main();
