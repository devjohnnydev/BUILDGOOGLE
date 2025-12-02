import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBio = async (name: string, interests: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Escreva uma biografia profissional curta, criativa e envolvente (máximo 250 caracteres) para um perfil de usuário. 
      Nome: ${name}. 
      Interesses/Profissão: ${interests}.
      Escreva em primeira pessoa. Não use aspas.`,
    });

    return response.text || "Apaixonado por tecnologia e inovação.";
  } catch (error) {
    console.error("Erro ao gerar bio com Gemini:", error);
    return "Entusiasta de tecnologia explorando novas ideias.";
  }
};
