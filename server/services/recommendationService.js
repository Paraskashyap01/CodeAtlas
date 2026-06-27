import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const fallbackProblems = [
  { topic: 'graphs', title: 'Build Roads', platform: 'CSES', difficulty: '1200-1400' },
  { topic: 'dp', title: 'Dice Combinations', platform: 'CSES', difficulty: '1100-1300' },
  { topic: 'greedy', title: 'Ferris Wheel', platform: 'CSES', difficulty: '900-1100' },
  { topic: 'math', title: 'Number Spiral', platform: 'CSES', difficulty: '800-1000' },
  { topic: 'implementation', title: 'Team', platform: 'Codeforces', difficulty: '800' },
];

const buildFallbackRecommendations = (weakTopics = []) => {
  const topics = weakTopics.length ? weakTopics : [{ tag: 'graphs' }, { tag: 'dp' }, { tag: 'greedy' }];

  return topics.slice(0, 5).map((topic, index) => {
    const seed =
      fallbackProblems.find((problem) => topic.tag?.toLowerCase().includes(problem.topic)) ||
      fallbackProblems[index % fallbackProblems.length];

    return {
      title: seed.title,
      platform: seed.platform,
      topic: topic.tag || seed.topic,
      difficulty: seed.difficulty,
      reason: `Your ${topic.tag || seed.topic} accuracy is lower than your other practiced tags, so this is a focused warm-up.`,
    };
  });
};

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

const extractLLMResponseText = (response) => {
  const data = response?.data;
  if (!data) return '';

  if (Array.isArray(data?.candidates)) {
    const parts = data.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      return parts.map((part) => part.text).filter(Boolean).join('');
    }

    if (typeof data.candidates[0]?.content === 'string') {
      return data.candidates[0].content;
    }

    if (typeof data.candidates[0]?.message?.content === 'string') {
      return data.candidates[0].message.content;
    }
  }

  if (typeof data?.content === 'string') {
    return data.content;
  }

  if (Array.isArray(data?.output) && Array.isArray(data.output[0]?.content)) {
    const content = data.output[0].content.find((item) => typeof item.text === 'string');
    return content?.text || '';
  }

  return '';
};

export const generateRecommendations = async (weakTopics = []) => {
  const prompt = `Return JSON only. Recommend 5 competitive programming practice problems for these weak topics: ${JSON.stringify(
    weakTopics
  )}. Each item must include title, platform, topic, difficulty, and reason.`;

  if (process.env.GOOGLE_GEMINI_API_KEY) {
    try {
      const model = process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.0-flash';
      const apiKey = process.env.GOOGLE_GEMINI_API_KEY.trim();
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await axios.post(
        endpoint,
        {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 700,
          },
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const content = extractLLMResponseText(response);
      return {
        recommendations: parseJsonArray(content) || buildFallbackRecommendations(weakTopics),
        generatedBy: 'google-gemini',
      };
    } catch (error) {
      console.error('Gemini recommendation request failed:', error.response?.data || error.message);
      return {
        recommendations: buildFallbackRecommendations(weakTopics),
        generatedBy: 'fallback',
      };
    }
  }

  if (process.env.OPENAI_API_KEY) {
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
    return { recommendations: parseJsonArray(content) || buildFallbackRecommendations(weakTopics), generatedBy: 'openai' };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
      }
    );
    const content = response.data?.content?.map((part) => part.text).join('\n') || '';
    return { recommendations: parseJsonArray(content) || buildFallbackRecommendations(weakTopics), generatedBy: 'anthropic' };
  }

  return { recommendations: buildFallbackRecommendations(weakTopics), generatedBy: 'fallback' };
};
