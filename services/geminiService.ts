
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TransactionCategory, SpendingInsight } from "../types";

// Always use the API key directly from process.env.API_KEY
const apiKey = process.env.API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not configured. Please set the environment variable.');
}

const ai = new GoogleGenAI({ apiKey });

export const categorizeTransactions = async (
  rawText?: string, 
  image?: { data: string; mimeType: string }
): Promise<Transaction[]> => {
  if (!rawText?.trim() && !image) {
    throw new Error('Either rawText or image must be provided');
  }

  if (image && (!image.data?.trim() || !image.mimeType?.trim())) {
    throw new Error('Invalid image data provided');
  }

  const parts: any[] = [];
  
  if (image) {
    parts.push({
      inlineData: {
        data: image.data,
        mimeType: image.mimeType,
      },
    });
    parts.push({ 
      text: "Extract all transaction data from this bank statement image. Identify the date, description, amount, and whether it is a DEBIT or CREDIT for each entry." 
    });
  } else if (rawText) {
    parts.push({ 
      text: `Parse the following raw UPI transaction text or bank SMS into structured transaction data: \n\n${rawText}` 
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        ...parts,
        {
          text: `Map each extracted transaction to exactly one of these categories: ${Object.values(TransactionCategory).join(', ')}.
          Rules:
          - If an amount is deducted, it's a DEBIT. If it's added, it's a CREDIT.
          - Date should be in ISO format YYYY-MM-DD.
          - Output MUST be valid JSON matching the schema.`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transactions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: 'ISO date format YYYY-MM-DD' },
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                category: { type: Type.STRING },
                type: { type: Type.STRING, description: 'DEBIT or CREDIT' }
              },
              required: ['date', 'description', 'amount', 'category', 'type']
            }
          }
        },
        required: ['transactions']
      }
    }
  });

  if (!response.text) {
    throw new Error('No response received from AI service');
  }

  let data;
  try {
    data = JSON.parse(response.text);
  } catch (parseError) {
    throw new Error('Failed to parse AI response as JSON');
  }

  if (!data.transactions || !Array.isArray(data.transactions)) {
    throw new Error('Invalid response format: transactions array missing');
  }

  return data.transactions.map((t: any, index: number) => {
    if (!t.date || !t.description || !t.amount || !t.category || !t.type) {
      throw new Error(`Invalid transaction data at index ${index}: missing required fields`);
    }
    
    if (!Object.values(TransactionCategory).includes(t.category)) {
      throw new Error(`Invalid category "${t.category}" at index ${index}`);
    }
    
    if (t.type !== 'DEBIT' && t.type !== 'CREDIT') {
      throw new Error(`Invalid transaction type "${t.type}" at index ${index}`);
    }

    return {
      ...t,
      id: `${Date.now()}-${index}`,
      category: t.category as TransactionCategory
    };
  });
};

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<SpendingInsight[]> => {
  if (!transactions || transactions.length === 0) {
    throw new Error('No transactions provided for analysis');
  }

  const summary = transactions.map(t => `${t.date}: ${t.description} - ${t.amount} (${t.category})`).join('\n');
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Analyze these UPI transactions and provide 3-4 professional financial insights. 
    Focus on overspending, recurring patterns, and suggestions for savings.
    
    Transactions:
    ${summary}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          insights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                impact: { type: Type.STRING, description: 'High, Medium, or Low' }
              },
              required: ['title', 'description', 'suggestion', 'impact']
            }
          }
        },
        required: ['insights']
      }
    }
  });

  if (!response.text) {
    throw new Error('No response received from AI service');
  }

  let data;
  try {
    data = JSON.parse(response.text);
  } catch (parseError) {
    throw new Error('Failed to parse AI response as JSON');
  }

  if (!data.insights || !Array.isArray(data.insights)) {
    throw new Error('Invalid response format: insights array missing');
  }

  return data.insights.map((insight: any, index: number) => {
    if (!insight.title || !insight.description || !insight.suggestion || !insight.impact) {
      throw new Error(`Invalid insight data at index ${index}: missing required fields`);
    }
    
    if (!['High', 'Medium', 'Low'].includes(insight.impact)) {
      throw new Error(`Invalid impact level "${insight.impact}" at index ${index}`);
    }

    return {
      title: insight.title,
      description: insight.description,
      suggestion: insight.suggestion,
      impact: insight.impact as 'High' | 'Medium' | 'Low'
    };
  });
};
