const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

// Use the API key from environment variables. 
// If not present, AI classification will fail gracefully.
const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const { CATEGORIES, PRIORITIES } = require('../models/Complaint');

exports.classifyComplaint = async (title, description) => {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY or AI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          category: {
            type: SchemaType.STRING,
            description: 'The most appropriate category for the complaint.',
            enum: CATEGORIES,
          },
          priority: {
            type: SchemaType.STRING,
            description: 'The urgency of the complaint.',
            enum: PRIORITIES,
          },
          keywords: {
            type: SchemaType.ARRAY,
            description: '2-4 keywords representing the complaint.',
            items: { type: SchemaType.STRING },
          },
        },
        required: ['category', 'priority', 'keywords'],
      },
    },
  });

  const prompt = `Analyze the following student hostel complaint and classify its category and priority.
  
Title: ${title}
Description: ${description}

Instructions:
1. "category" must exactly match one of the allowed enums.
2. "priority" must be one of the allowed enums. Use "Critical" for severe safety, water, or electrical hazards. Use "High" for major inconveniences. Use "Medium" for standard repairs. Use "Low" for minor issues or suggestions.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('AI Classification Error:', error);
    throw new Error('Failed to classify complaint with AI');
  }
};
