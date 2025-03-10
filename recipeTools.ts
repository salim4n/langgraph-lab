import { PrismaClient } from '@prisma/client';
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Initialisation du client Prisma
const prisma = new PrismaClient();

/**
 * Interface pour les recettes
 */
export interface Recipe {
  id?: number;
  title?: string;
  url?: string | null;
  category?: string | null;
  author?: string | null;
  description?: string | null;
  rating?: number | null;
  ratingCount?: number | null;
  reviewCount?: number | null;
  ingredients?: string;
  directions?: string;
  prepTime?: string | null;
  cookTime?: string | null;
  totalTime?: string | null;
  servings?: number | null;
  yields?: string | null;
  calories?: number | null;
  carbohydrates?: number | null;
  sugars?: number | null;
  fat?: number | null;
  protein?: number | null;
  sodium?: number | null;
  instructionList?: string | null;
  image?: string | null;
}

/**
 * Interface pour les options de recherche de recettes
 */
export interface RecipeSearchOptions {
  title?: string;
  ingredients?: string[];
  category?: string;
  author?: string;
  minRating?: number;
  maxCookTime?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

/**
 * Interface pour les résultats paginés
 */
export interface PaginatedResult<T> {
  data?: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

/**
 * Interface pour les tags populaires
 */
export interface PopularTag {
  tag?: string;
  count?: number;
}

/**
 * Interface pour les recettes avec score de correspondance
 */
export interface ScoredRecipe extends Recipe {
  matchPercentage?: number;
  missingIngredientsCount?: number;
}

/**
 * Fonction utilitaire pour convertir les BigInt en string lors de la sérialisation JSON
 */
export function serializeWithBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeWithBigInt);
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = serializeWithBigInt(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}

/**
 * Recherche des recettes en fonction de critères spécifiés
 * @param options Options de recherche
 * @returns Liste paginée de recettes correspondant aux critères
 */
export const searchRecipes = async (options: RecipeSearchOptions) => {
  try {
    const {
      title,
      ingredients,
      category,
      author,
      minRating,
      maxCookTime,
      searchTerm,
      limit = 10,
      offset = 0
    } = options;

    // Construction de la requête de base
    let whereClause: any = {};

    // Recherche par terme (titre, description, ingrédients)
    if (searchTerm) {
      whereClause.OR = [
        { title: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { ingredients: { contains: searchTerm } }
      ];
    }

    // Recherche par titre
    if (title) {
      whereClause.title = { contains: title };
    }

    // Recherche par ingrédients (tous les ingrédients doivent être présents)
    if (ingredients && ingredients.length > 0) {
      whereClause.AND = ingredients.map(ingredient => ({
        ingredients: { contains: ingredient }
      }));
    }

    // Filtrage par catégorie
    if (category) {
      whereClause.category = { contains: category };
    }

    // Filtrage par auteur
    if (author) {
      whereClause.author = { contains: author };
    }

    // Filtrage par note minimale
    if (minRating !== undefined) {
      whereClause.rating = { gte: minRating };
    }

    // Filtrage par temps de cuisson maximal
    if (maxCookTime) {
      whereClause.cookTime = { lte: maxCookTime };
    }

    // Exécution de la requête pour obtenir les recettes
    const recipes = await prisma.recipe.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: {
        id: 'desc'
      }
    });

    // Comptage du nombre total de recettes correspondant aux critères
    const total = await prisma.recipe.count({
      where: whereClause
    });

    // Calcul des informations de pagination
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    // Sérialiser les résultats pour éviter les problèmes avec BigInt
    const serializedRecipes = serializeWithBigInt(recipes);
    
    return {
      data: serializedRecipes,
      total,
      page,
      pageSize: limit,
      totalPages
    };
  } catch (error) {
    console.error('Erreur lors de la recherche de recettes:', error);
    throw error;
  }
};

/**
 * Recherche de recettes avec pagination
 */
export const searchRecipesTool = tool(
  async (args: { query?: string; limit?: number; offset?: number; category?: string; ingredient?: string; }) => {
    return searchRecipes({
      searchTerm: args.query,
      limit: args.limit || 10,
      offset: args.offset || 0,
      category: args.category,
      ingredients: args.ingredient ? [args.ingredient] : undefined
    });
  },
  {
    name: "searchRecipes",
    description: "Recherche des recettes avec pagination en fonction de critères optionnels.",
    schema: z.object({
      query: z.string().optional().describe("Terme de recherche général"),
      limit: z.number().optional().describe("Nombre de résultats à retourner"),
      offset: z.number().optional().describe("Nombre de résultats à sauter"),
      category: z.string().optional().describe("Catégorie de recette"),
      ingredient: z.string().optional().describe("Ingrédient à inclure")
    })
  }
);

/**
 * Recherche des recettes par titre
 */
export const searchRecipesByTitleTool = tool(
  async (args: { title: string; limit?: number; offset?: number }) => {
    const { title, limit = 10, offset = 0 } = args;
    
    const recipes = await prisma.recipe.findMany({
      where: { name: { contains: title } },
      take: limit,
      skip: offset,
      orderBy: { id: 'desc' }
    });
    
    const total = await prisma.recipe.count({
      where: { name: { contains: title } }
    });
    
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);
    
    // Sérialiser les résultats pour éviter les problèmes avec BigInt
    const serializedRecipes = serializeWithBigInt(recipes);
    
    return {
      data: serializedRecipes,
      total,
      page,
      pageSize: limit,
      totalPages
    };
  },
  {
    name: "searchRecipesByTitle",
    description: "Recherche des recettes par titre.",
    schema: z.object({
      title: z.string().describe("Titre ou partie du titre à rechercher"),
      limit: z.number().optional().describe("Nombre maximum de recettes à retourner"),
      offset: z.number().optional().describe("Nombre de recettes à sauter (pour la pagination)")
    })
  }
);

/**
 * Recherche des recettes par ingrédient
 */
export const searchRecipesByIngredientTool = tool(
  async (args: { ingredient: string; limit?: number; offset?: number }) => {
    const { ingredient, limit = 10, offset = 0 } = args;
    
    const recipes = await prisma.recipe.findMany({
      where: { ingredients: { contains: ingredient } },
      take: limit,
      skip: offset,
      orderBy: { id: 'desc' }
    });
    
    const total = await prisma.recipe.count({
      where: { ingredients: { contains: ingredient } }
    });
    
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);
    
    // Sérialiser les résultats pour éviter les problèmes avec BigInt
    const serializedRecipes = serializeWithBigInt(recipes);
    
    return {
      data: serializedRecipes,
      total,
      page,
      pageSize: limit,
      totalPages
    };
  },
  {
    name: "searchRecipesByIngredient",
    description: "Recherche des recettes par ingrédient.",
    schema: z.object({
      ingredient: z.string().describe("Ingrédient à rechercher"),
      limit: z.number().optional().describe("Nombre maximum de recettes à retourner"),
      offset: z.number().optional().describe("Nombre de recettes à sauter (pour la pagination)")
    })
  }
);

/**
 * Recherche des recettes par catégorie
 */
export const searchRecipesByCategoryTool = tool(
  async (args: { category: string; limit?: number; offset?: number }) => {
    const { category, limit = 10, offset = 0 } = args;
    
    const recipes = await prisma.recipe.findMany({
      where: { cuisine: { contains: category } },
      take: limit,
      skip: offset,
      orderBy: { id: 'desc' }
    });
    
    const total = await prisma.recipe.count({
      where: { cuisine: { contains: category } }
    });
    
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);
    
    // Sérialiser les résultats pour éviter les problèmes avec BigInt
    const serializedRecipes = serializeWithBigInt(recipes);
    
    return {
      data: serializedRecipes,
      total,
      page,
      pageSize: limit,
      totalPages
    };
  },
  {
    name: "searchRecipesByCategory",
    description: "Recherche des recettes par catégorie.",
    schema: z.object({
      category: z.string().describe("Catégorie à rechercher"),
      limit: z.number().optional().describe("Nombre maximum de recettes à retourner"),
      offset: z.number().optional().describe("Nombre de recettes à sauter (pour la pagination)")
    })
  }
);

/**
 * Récupère une recette par son ID
 */
export const getRecipeByIdTool = tool(
  async (args: { id: number }) => {
    const recipe = await getRecipeById(args.id);
    
    if (!recipe) {
      throw new Error(`Recette avec l'ID ${args.id} non trouvée.`);
    }
    
    // Sérialiser les résultats pour éviter les problèmes avec BigInt
    return serializeWithBigInt(recipe);
  },
  {
    name: "getRecipeById",
    description: "Récupère une recette par son ID.",
    schema: z.object({
      id: z.number().describe("ID de la recette à récupérer")
    })
  }
);

/**
 * Récupère une recette par son ID
 * @param id ID de la recette
 * @returns Recette correspondante ou null si non trouvée
 */
export async function getRecipeById(id: number): Promise<Recipe | null> {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id }
    });
    
    return recipe;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la recette avec l'ID ${id}:`, error);
    throw error;
  }
}

/**
 * Recherche des recettes par titre
 * @param title Titre ou partie du titre à rechercher
 * @param limit Nombre maximum de recettes à retourner
 * @param offset Nombre de recettes à sauter (pour la pagination)
 * @returns Liste paginée de recettes correspondant au titre
 */
export async function searchRecipesByTitle(
  title: string,
  limit: number = 10,
  offset: number = 0
): Promise<PaginatedResult<Recipe>> {
  return searchRecipes({
    title,
    limit,
    offset
  });
}

/**
 * Recherche des recettes par ingrédient
 * @param ingredient Ingrédient à rechercher
 * @param limit Nombre maximum de recettes à retourner
 * @param offset Nombre de recettes à sauter (pour la pagination)
 * @returns Liste de recettes contenant l'ingrédient spécifié
 */
export async function searchRecipesByIngredient(
  ingredient: string,
  limit: number = 10,
  offset: number = 0
): Promise<PaginatedResult<Recipe>> {
  return searchRecipes({
    ingredients: [ingredient],
    limit,
    offset
  });
}

/**
 * Recherche des recettes par catégorie
 * @param category Catégorie à rechercher
 * @param limit Nombre maximum de recettes à retourner
 * @param offset Nombre de recettes à sauter (pour la pagination)
 * @returns Liste de recettes appartenant à la catégorie spécifiée
 */
export async function searchRecipesByCategory(
  category: string,
  limit: number = 10,
  offset: number = 0
): Promise<PaginatedResult<Recipe>> {
  return searchRecipes({
    category,
    limit,
    offset
  });
}

/**
 * Recherche de recettes similaires
 */
export const getSimilarRecipesTool = tool(
  async (args: { recipeId: number; limit?: number }) => {
    const { recipeId, limit = 5 } = args;
    
    const similarRecipes = await getSimilarRecipes(recipeId, limit);
    
    // Sérialiser les résultats pour éviter les problèmes avec BigInt
    return serializeWithBigInt(similarRecipes);
  },
  {
    name: "getSimilarRecipes",
    description: "Trouve des recettes similaires à une recette donnée.",
    schema: z.object({
      recipeId: z.number().describe("ID de la recette de référence"),
      limit: z.number().optional().describe("Nombre maximum de recettes à retourner")
    })
  }
);

/**
 * Récupère des recettes similaires à une recette donnée
 * @param recipeId ID de la recette de référence
 * @param limit Nombre maximum de recettes à retourner
 * @returns Liste de recettes similaires
 */
export async function getSimilarRecipes(recipeId: number, limit: number = 5): Promise<Recipe[]> {
  try {
    // Récupération de la recette de référence
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId }
    });

    if (!recipe) {
      throw new Error(`Recette avec l'ID ${recipeId} non trouvée`);
    }

    // Extraction des mots-clés de la recette de référence
    const keywords = [
      ...(recipe?.name ? recipe.name.split(/\s+/) : []),
      ...(recipe?.cuisine ? [recipe.cuisine] : []),
      ...(recipe?.ingredients ? extractKeyIngredients(recipe.ingredients) : [])
    ];

    // Recherche de recettes similaires basée sur les mots-clés
    const similarRecipes = await prisma.recipe.findMany({
      where: {
        id: { not: recipeId }, // Exclure la recette de référence
        OR: keywords.map(keyword => ({
          OR: [
            { name: { contains: keyword } },
            { cuisine: { contains: keyword } },
            { ingredients: { contains: keyword } }
          ]
        }))
      },
      take: limit,
      orderBy: {
        id: 'desc'
      }
    });

    return similarRecipes;
  } catch (error) {
    console.error(`Erreur lors de la recherche de recettes similaires à l'ID ${recipeId}:`, error);
    throw error;
  }
}

/**
 * Extrait les ingrédients clés d'une chaîne d'ingrédients
 * @param ingredients Chaîne d'ingrédients
 * @returns Liste des ingrédients clés
 */
function extractKeyIngredients(ingredients: string): string[] {
  // Diviser la chaîne d'ingrédients et filtrer les mots courts ou communs
  return ingredients
    .split(/[,;]/)
    .map(item => item.trim())
    .filter(item => item.length > 3) // Ignorer les mots trop courts
    .slice(0, 5); // Limiter à 5 ingrédients clés
}

/**
 * Récupère les catégories disponibles dans la base de données
 * @returns Liste des catégories uniques
 */
export async function getAvailableCategories(): Promise<string[]> {
  try {
    const categories = await prisma.recipe.groupBy({
      by: ['category'],
      where: {
        category: {
          not: null
        }
      }
    });

    return categories
      .map(c => c.category as string)
      .filter(Boolean)
      .sort();
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories disponibles:', error);
    throw error;
  }
}

/**
 * Récupère les catégories disponibles
 */
export const getAvailableCategoriesTool = tool(
  async (args: { limit?: number }) => {
    const { limit = 100 } = args;
    
    const categories = await getAvailableCategories();
    
    // Sérialiser les résultats pour éviter les problèmes avec BigInt
    return serializeWithBigInt(categories);
  },
  {
    name: "getAvailableCategories",
    description: "Liste les catégories disponibles.",
    schema: z.object({
      limit: z.number().optional().describe("Nombre maximum de catégories à retourner")
    })
  }
);

/**
 * Récupère les auteurs disponibles dans la base de données
 * @param limit Nombre maximum d'auteurs à retourner
 * @returns Liste des auteurs les plus actifs
 */
export async function getPopularAuthors(limit: number = 20): Promise<{ author: string; count: number }[]> {
  try {
    const authors = await prisma.$queryRaw`
      SELECT author, COUNT(*) as count
      FROM Recipe
      WHERE author IS NOT NULL AND author != ''
      GROUP BY author
      ORDER BY count DESC
      LIMIT ${limit}
    `;

    return authors as { author: string; count: number }[];
  } catch (error) {
    console.error('Erreur lors de la récupération des auteurs populaires:', error);
    throw error;
  }
}

/**
 * Récupère les auteurs populaires
 */
export const getPopularAuthorsTool = tool(
  async (args: { limit?: number }) => {
    const { limit = 20 } = args;
    
    const authors = await getPopularAuthors(limit);
    
    // Sérialiser les résultats pour éviter les problèmes avec BigInt
    return serializeWithBigInt(authors);
  },
  {
    name: "getPopularAuthors",
    description: "Liste les auteurs populaires.",
    schema: z.object({
      limit: z.number().optional().describe("Nombre d'auteurs à retourner")
    })
  }
);

/**
 * Recherche des recettes par ingrédients disponibles
 * @param availableIngredients Liste des ingrédients disponibles
 * @param limit Nombre maximum de recettes à retourner
 * @returns Liste de recettes réalisables avec les ingrédients disponibles
 */
export async function findRecipesByAvailableIngredients(
  availableIngredients: string[],
  limit: number = 10
): Promise<ScoredRecipe[]> {
  try {
    if (!availableIngredients.length) {
      return [];
    }

    // Récupération de toutes les recettes
    const recipes = await prisma.recipe.findMany({
      take: 1000, // Limiter pour des raisons de performance
      orderBy: {
        id: 'desc'
      }
    });

    // Calcul du score de correspondance pour chaque recette
    const scoredRecipes = recipes.map(recipe => {
      const recipeIngredients = recipe.ingredients.toLowerCase();
      
      // Compter combien d'ingrédients disponibles sont présents dans la recette
      const matchingIngredients = availableIngredients.filter(ingredient => 
        recipeIngredients.includes(ingredient.toLowerCase())
      );
      
      // Estimation grossière du nombre total d'ingrédients dans la recette
      const totalIngredients = recipe.ingredients.split(/[,;]/).length;
      
      // Calcul du pourcentage de correspondance
      const matchPercentage = (matchingIngredients.length / totalIngredients) * 100;
      
      // Calcul du nombre d'ingrédients manquants
      const missingIngredientsCount = totalIngredients - matchingIngredients.length;

      return {
        ...recipe,
        matchPercentage,
        missingIngredientsCount
      };
    });

    // Tri des recettes par pourcentage de correspondance décroissant
    const sortedRecipes = scoredRecipes
      .filter(recipe => recipe.matchPercentage > 50) // Filtrer les recettes avec moins de 50% de correspondance
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, limit);

    return sortedRecipes;
  } catch (error) {
    console.error('Erreur lors de la recherche de recettes par ingrédients disponibles:', error);
    throw error;
  }
}

/**
 * Recherche de recettes par ingrédients disponibles
 */
export const findRecipesByAvailableIngredientsTool = tool(
  async (args: { ingredients: string[]; limit?: number }) => {
    const { ingredients, limit = 10 } = args;
    
    const recipes = await findRecipesByAvailableIngredients(ingredients, limit);
    
    // Sérialiser les résultats pour éviter les problèmes avec BigInt
    return serializeWithBigInt(recipes);
  },
  {
    name: "findRecipesByAvailableIngredients",
    description: "Trouve des recettes réalisables avec les ingrédients disponibles.",
    schema: z.object({
      ingredients: z.array(z.string()).describe("Liste des ingrédients disponibles"),
      limit: z.number().optional().describe("Nombre maximum de recettes à retourner")
    })
  }
);

/**
 * Ferme la connexion Prisma
 */
export async function closeConnection(): Promise<void> {
  await prisma.$disconnect();
}

// Exporte le client Prisma pour des cas d'utilisation avancés
export { prisma };
