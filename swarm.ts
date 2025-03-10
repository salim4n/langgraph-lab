// Charger les variables d'environnement depuis le fichier .env
import * as dotenv from 'dotenv';
dotenv.config();

import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { createSwarm, createHandoffTool } from "@langchain/langgraph-swarm";
import {
  searchRecipesTool,
  searchRecipesByTitleTool,
  searchRecipesByIngredientTool,
  searchRecipesByCategoryTool,
  getRecipeByIdTool,
  getSimilarRecipesTool,
  getAvailableCategoriesTool,
  getPopularAuthorsTool,
  findRecipesByAvailableIngredientsTool,
  closeConnection
} from "./recipeTools.js";

// Initialisation du modèle
const model = new ChatOpenAI({ modelName: "gpt-4o-mini" });

// Outil simple de recherche de recettes (fallback si les outils réels ne fonctionnent pas)
const searchRecipesFallback = tool(
  async (args: { query: string; }) => {
    return `Voici quelques recettes contenant "${args.query}": 
    1. Poulet rôti aux herbes
    2. Salade de poulet et avocat
    3. Curry de poulet au lait de coco`;
  },
  {
    name: "searchRecipesFallback",
    description: "Recherche des recettes par mot-clé (version de secours).",
    schema: z.object({
      query: z.string().describe("Terme de recherche")
    })
  }
);

// Création d'un agent spécialisé dans la recherche de recettes
const recipeAgent = createReactAgent({
  llm: model,
  tools: [
    // Outils réels de recherche de recettes
    searchRecipesTool,
    searchRecipesByTitleTool,
    searchRecipesByIngredientTool,
    searchRecipesByCategoryTool,
    getRecipeByIdTool,
    getSimilarRecipesTool,
    getAvailableCategoriesTool,
    getPopularAuthorsTool,
    findRecipesByAvailableIngredientsTool,
    // Outil de secours
    searchRecipesFallback,
    // Outil de transfert vers l'assistant général
    createHandoffTool({ agentName: "Assistant" })
  ],
  name: "ChefBot",
  prompt: "Tu es ChefBot, un expert culinaire spécialisé UNIQUEMENT dans la recherche de recettes et les questions liées à la cuisine. Tu ne dois PAS répondre aux questions qui ne concernent pas la cuisine, les recettes, les ingrédients, ou les techniques culinaires. Pour toute question hors de ton domaine d'expertise, transfère immédiatement la conversation à l'agent Assistant. Ton rôle est d'aider les utilisateurs à trouver des recettes en fonction de leurs préférences et de fournir des conseils culinaires précis et pertinents."
});

// Création d'un agent assistant général
const assistantAgent = createReactAgent({
  llm: model,
  tools: [
    createHandoffTool({ 
      agentName: "ChefBot", 
      description: "Transférer à ChefBot UNIQUEMENT pour des questions liées aux recettes et à la cuisine" 
    })
  ],
  name: "Assistant",
  prompt: "Tu es un assistant général qui peut aider avec toutes les questions SAUF celles liées à la cuisine. Pour les questions sur la cuisine, les recettes, les ingrédients ou les techniques culinaires, transfère IMMÉDIATEMENT la conversation à ChefBot qui est spécialisé dans ce domaine. Pour toutes les autres questions (mathématiques, science, culture générale, technologie, etc.), c'est TOI qui dois répondre. Ne transfère pas la conversation pour des sujets non culinaires."
});

// Création du swarm avec nos agents
const checkpointer = new MemorySaver();
const workflow = createSwarm({
  agents: [recipeAgent, assistantAgent],
  defaultActiveAgent: "Assistant"
});

export const app = workflow.compile({ 
  checkpointer 
});

// Exécution du swarm avec des exemples de requêtes
(async () => {
  try {
    // Utiliser des thread_id différents pour chaque test
    const config1 = { configurable: { thread_id: "recipe-search-1" } };
    const config2 = { configurable: { thread_id: "general-question-1" } };
    const config3 = { configurable: { thread_id: "recipe-by-ingredient-1" } };
    
    console.log("=== Test 1: Question culinaire simple (devrait être traitée par ChefBot) ===");
    const turn1 = await app.invoke(
      { messages: [{ role: "user", content: "Bonjour, peux tu me donner des recettes avec du poulet" }] },
      config1
    );
    
    // Affichage plus détaillé des informations
    console.log("\nDernier message de:", turn1.messages[turn1.messages.length - 1].name || "Agent non spécifié");
    const lastMessage = turn1.messages[turn1.messages.length - 1];
    console.log("\nRéponse:");
    console.log(lastMessage.content);

    console.log("\n=== Test 2: Question générale (devrait être traitée par Assistant) ===");
    const turn2 = await app.invoke(
      { messages: [{ role: "user", content: "Quelle est la capitale de la France?" }] },
      config2
    );
    
    // Affichage plus détaillé des informations
    console.log("\nDernier message de:", turn2.messages[turn2.messages.length - 1].name || "Agent non spécifié");
    const lastMessage2 = turn2.messages[turn2.messages.length - 1];
    console.log("\nRéponse:");
    console.log(lastMessage2.content);
    
    console.log("\n=== Test 3: Recherche par ingrédient (devrait être traitée par ChefBot) ===");
    const turn3 = await app.invoke(
      { messages: [{ role: "user", content: "Quelles recettes puis-je faire avec des tomates et du basilic?" }] },
      config3
    );
    
    // Affichage plus détaillé des informations
    console.log("\nDernier message de:", turn3.messages[turn3.messages.length - 1].name || "Agent non spécifié");
    const lastMessage3 = turn3.messages[turn3.messages.length - 1];
    console.log("\nRéponse:");
    console.log(lastMessage3.content);
  } catch (error) {
    console.error("Erreur lors de l'exécution des tests:", error);
  } finally {
    // Fermer la connexion à la base de données à la fin
    try {
      await closeConnection();
      console.log("Connexion à la base de données fermée avec succès");
    } catch (error) {
      console.error("Erreur lors de la fermeture de la connexion:", error);
    }
  }
})();