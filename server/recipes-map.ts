/**
 * JARVIS Recipe Dispatcher
 * Maps user intent keywords to Rube Recipe IDs.
 *
 * HOW TO USE:
 * 1. Create your automation in the Rube dashboard (https://rube.app)
 * 2. Copy the Recipe ID and add it below under the correct category
 * 3. JARVIS will automatically select the right recipe based on conversation context
 */

export interface RecipeEntry {
  recipeId: string;
  description: string;
  keywords: string[];
}

export const RECIPES: RecipeEntry[] = [
  {
    recipeId: 'REPLACE_WITH_GMAIL_RECIPE_ID',
    description: 'Read and summarize unread emails from Gmail',
    keywords: ['email', 'e-mail', 'gmail', 'mensagem', 'caixa de entrada', 'inbox', 'correio'],
  },
  {
    recipeId: 'rcp_C7NVajdHlR_6',
    description: 'Read upcoming events from Google Calendar via Rube Webhook',
    keywords: ['agenda', 'calendar', 'reunião', 'reunioes', 'compromisso', 'evento', 'meeting', 'schedule', 'almoço', 'amanhã', 'hoje'],
  },
  {
    recipeId: 'REPLACE_WITH_NOTION_RECIPE_ID',
    description: 'Create or retrieve notes in Notion',
    keywords: ['notion', 'nota', 'anotar', 'anote', 'registrar', 'salvar', 'note'],
  },
];

/**
 * Finds the best matching recipe ID for a given text.
 * Scans keywords against the provided context string.
 * Returns undefined if no match is found (OpenAI will choose freely).
 */
export function findRecipeByContext(context: string): string | undefined {
  const lowerContext = context.toLowerCase();

  for (const recipe of RECIPES) {
    if (recipe.keywords.some(kw => lowerContext.includes(kw))) {
      console.log(`[DISPATCH] Matched recipe "${recipe.description}" for context: "${context}"`);
      return recipe.recipeId;
    }
  }

  console.log(`[DISPATCH] No recipe match found for: "${context}"`);
  return undefined;
}
