import { GoogleGenAI } from "@google/genai";

// Initialize AI with environment variable (simulated for client-side demo if needed, but standard strictly follows instruction)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  /**
   * Generates a creative description for a product based on its name and category.
   */
  generateProductDescription: async (name: string, category: string): Promise<string> => {
    try {
      const model = 'gemini-2.5-flash-latest';
      const prompt = `Escribe una descripción corta, apetitosa y atractiva (máximo 15 palabras) para un producto de heladería.
      Producto: ${name}
      Categoría: ${category}
      Idioma: Español.
      Solo devuelve el texto de la descripción, sin comillas ni explicaciones.`;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });

      return response.text?.trim() || 'Delicioso producto artesanal.';
    } catch (error) {
      console.error("Error generating description with Gemini:", error);
      // Fallback if API key is missing or error
      return 'Exquisita preparación de la casa.';
    }
  },

  /**
   * Analyzes sales data to provide a quick insight.
   */
  analyzeDailySales: async (totalSales: number, totalOrders: number): Promise<string> => {
    try {
      const model = 'gemini-2.5-flash-latest';
      const prompt = `Analiza brevemente este desempeño de ventas diario de una heladería:
      Ventas Totales: $${totalSales} COP
      Pedidos: ${totalOrders}
      
      Dame una frase motivacional corta o una observación de negocio en una sola oración.`;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });

      return response.text?.trim() || '';
    } catch (error) {
      return '';
    }
  }
};