const Groq = require('groq-sdk');

// Use the API key from environment variables. 
// If not present, AI classification will fail gracefully.
const apiKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY || '';
const groq = new Groq({ apiKey });

const { CATEGORIES, PRIORITIES } = require('../models/Complaint');

exports.classifyComplaint = async (title, description) => {
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const prompt = `Analyze the following student hostel complaint and classify its category and priority.
  
Title: ${title}
Description: ${description}

Instructions:
1. "category" must EXACTLY match one of these: ${CATEGORIES.join(', ')}
2. "priority" must EXACTLY match one of these: ${PRIORITIES.join(', ')} (Use "Critical" for severe safety, water, or electrical hazards. Use "High" for major inconveniences. Use "Medium" for standard repairs. Use "Low" for minor issues or suggestions).
3. "keywords" must be an array of 2-4 string keywords representing the complaint.
4. Output MUST be valid JSON in this exact format:
{
  "category": "String",
  "priority": "String",
  "keywords": ["String"]
}`;

  try {
    const result = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'qwen/qwen3.8-27b',
      max_tokens: 500,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const text = result.choices[0]?.message?.content || '{}';
    return JSON.parse(text);
  } catch (error) {
    console.error('AI Classification Error:', error);
    throw new Error('Failed to classify complaint with AI');
  }
};
