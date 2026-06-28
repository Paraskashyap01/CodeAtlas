import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const fallbackProblems = [
  { topic: 'graphs', title: 'Build Roads', platform: 'CSES', difficulty: '1200-1400', url: 'https://cses.fi/problemset/task/1666' },
  { topic: 'dp', title: 'Dice Combinations', platform: 'CSES', difficulty: '1100-1300', url: 'https://cses.fi/problemset/task/1633' },
  { topic: 'greedy', title: 'Ferris Wheel', platform: 'CSES', difficulty: '900-1100', url: 'https://cses.fi/problemset/task/1090' },
  { topic: 'math', title: 'Number Spiral', platform: 'CSES', difficulty: '800-1000', url: 'https://cses.fi/problemset/task/1071' },
  { topic: 'implementation', title: 'Team', platform: 'Codeforces', difficulty: '800', url: 'https://codeforces.com/problemset/problem/231/A' },
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
      url: seed.url,
      reason: `Your ${topic.tag || seed.topic} accuracy is lower than your other practiced tags, so this is a focused warm-up.`,
    };
  });
};

// Best-effort link when the LLM didn't supply a direct url: a platform
// search page is far more useful than no link at all, and never 404s.
const buildSearchFallbackUrl = (rec) => {
  const platform = (rec.platform || '').toLowerCase();
  const query = encodeURIComponent(rec.title || '');
  if (!query) return null;
  if (platform.includes('codeforces')) {
    return `https://codeforces.com/problemset?search=${query}`;
  }
  if (platform.includes('leetcode')) {
    return `https://leetcode.com/problems/?search=${query}`;
  }
  if (platform.includes('cses')) {
    return `https://cses.fi/problemset/list/?search=${query}`;
  }
  return `https://www.google.com/search?q=${query}+${encodeURIComponent(rec.platform || '')}+problem`;
};

// Ensures every recommendation has a usable url, whether it came from the
// LLM directly or needs a search-page fallback.
const ensureRecommendationUrls = (recommendations = []) =>
  recommendations.map((rec) => ({
    ...rec,
    url: rec.url && typeof rec.url === 'string' ? rec.url : buildSearchFallbackUrl(rec),
  }));

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
  )}. Each item must include title, platform, topic, difficulty, reason, and url (a direct link to the problem on its platform, e.g. https://codeforces.com/problemset/problem/4/A or https://leetcode.com/problems/two-sum/). Only include a url you are confident is correct; omit the field if unsure.`;

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
        recommendations: ensureRecommendationUrls(parseJsonArray(content) || buildFallbackRecommendations(weakTopics)),
        generatedBy: 'google-gemini',
      };
    } catch (error) {
      console.error('Gemini recommendation request failed:', error.response?.data || error.message);
      return {
        recommendations: ensureRecommendationUrls(buildFallbackRecommendations(weakTopics)),
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
    return {
      recommendations: ensureRecommendationUrls(parseJsonArray(content) || buildFallbackRecommendations(weakTopics)),
      generatedBy: 'openai',
    };
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
    return {
      recommendations: ensureRecommendationUrls(parseJsonArray(content) || buildFallbackRecommendations(weakTopics)),
      generatedBy: 'anthropic',
    };
  }

  return { recommendations: ensureRecommendationUrls(buildFallbackRecommendations(weakTopics)), generatedBy: 'fallback' };
};
