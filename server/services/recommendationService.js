import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const parseJsonArray = (text = '') => {
  const cleaned = String(text || '').replace(/```(?:json)?/gi, '').trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const generateRecommendations = async (weakTopics = []) => {
  const prompt = `Return JSON only. Recommend 5 competitive programming practice problems for these weak topics: ${JSON.stringify(
    weakTopics
  )}. Each item must include title, platform, topic, difficulty, reason, and url (a direct link to the problem on its platform, e.g. https://codeforces.com/problemset/problem/4/A or https://leetcode.com/problems/two-sum/). Only include a url you are confident is correct; omit the field if unsure.`;

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required');
  }

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
  );

  const content = response.data?.choices?.[0]?.message?.content || '';
  const recommendations = parseJsonArray(content);

  if (!recommendations) {
    throw new Error('OpenAI returned invalid recommendation data');
  }

  return {
    recommendations,
    generatedBy: 'openai',
  };
};
