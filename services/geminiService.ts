import { GoogleGenAI } from "@google/genai";
import { Transaction, TransactionType } from "../types";

// Function to get AI analysis of the business performance
export const getBusinessAnalysis = async (transactions: Transaction[]): Promise<string> => {
  // Use import.meta.env for Vite or fall back to process.env if needed, though strictly requested to use process.env
  const apiKey = process.env.API_KEY; 

  if (!apiKey) {
    return "Clé API manquante. Veuillez configurer la clé API pour utiliser l'assistant.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });

    // Prepare data summary for the prompt
    // We manually format this to text to avoid JSON.stringify circular error issues completely
    const recentTransactionsList = transactions.slice(0, 20).map(t => {
      // Safe string conversion
      const dateStr = typeof t.date === 'string' ? t.date.split('T')[0] : "N/A";
      const typeStr = t.type === TransactionType.INCOME ? "Recette" : "Dépense";
      const amountStr = t.amount ? `${t.amount} F` : "0 F";
      const catStr = t.category || "Autre";
      
      return `- ${dateStr} | ${typeStr} | ${amountStr} | ${catStr}`;
    }).join('\n');

    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const profit = income - expense;
    
    const prompt = `
      Tu es un expert analyste financier pour une station de lavage automobile.
      
      BILAN FINANCIER ACTUEL :
      - Revenu Total: ${income} FCFA
      - Dépenses Totales: ${expense} FCFA
      - Profit Net: ${profit} FCFA
      
      DERNIÈRES TRANSACTIONS (20 plus récentes) :
      ${recentTransactionsList}

      En te basant sur ces chiffres :
      1. Quelle est la tendance actuelle ?
      2. Donne une recommandation concrète pour augmenter le profit.
      3. Y a-t-il des dépenses alarmantes ?
      
      Réponds en français, format Markdown, ton professionnel et direct. Max 150 mots.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Impossible de générer une analyse pour le moment.";
  } catch (error) {
    console.error("Erreur Gemini:", error);
    return "Une erreur technique est survenue lors de l'analyse.";
  }
};
