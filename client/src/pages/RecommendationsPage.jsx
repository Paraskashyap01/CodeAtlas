import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import { getRecommendations } from '../api/recommendations.js';

const RecommendationsPage = () => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    getRecommendations()
      .then((response) => {
        setData(response.data);
        setStatus('ready');
      })
      .catch((error) => {
        console.error(error);
        setStatus(error.response?.data?.message || 'Unable to load recommendations');
      });
  }, []);

  return (
    <AppShell
      title="Practice Recommendations"
      subtitle="Personalized problems based on your weaker Codeforces topics. Practice these to level up."
    >
      {status === 'loading' && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-slate-600">Loading recommendations...</p>
          </div>
        </div>
      )}

      {status !== 'loading' && status !== 'ready' && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800 text-sm animate-fade-in-up">
          ✗ {status}
        </div>
      )}

      {data && (
        <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] animate-fade-in-up">
          {/* Weak Topics Sidebar */}
          <section className="panel-rose">
            <h2 className="section-title mb-5 flex items-center gap-2">
              🔴 Weak Topics
            </h2>
            <div className="space-y-2.5">
              {data.weakTopics?.length ? (
                data.weakTopics.map((topic, idx) => (
                  <div
                    key={topic.tag}
                    className="group rounded-lg border border-slate-200 bg-white p-3.5 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer"
                    style={{ animationDelay: `${0.05 * idx}s` }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-medium text-slate-900 group-hover:text-blue-800 transition-colors text-sm">
                        {topic.tag}
                      </span>
                      <span className="badge-warning text-xs">{topic.accuracy}%</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {topic.solved}/{topic.attempts} solved
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-6">— No weak topics yet —</p>
              )}
            </div>
          </section>

          {/* Practice Queue */}
          <section className="panel-violet">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className="section-title">💡 Practice Queue</h2>
              <span className="badge-primary text-xs">
                {data.generatedBy === 'openai'
                  ? 'OpenAI GPT-4'
                  : data.generatedBy === 'anthropic'
                  ? 'Anthropic Claude'
                  : data.generatedBy === 'google-gemini'
                  ? 'Google Gemini'
                  : 'Curated'}
              </span>
            </div>
            <div className="space-y-3">
              {data.recommendations?.length ? (
                data.recommendations.map((rec, index) => (
                  <article
                    key={`${rec.title}-${index}`}
                    className="group rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer"
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    <div className="flex flex-col gap-3">
                      <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {rec.url ? (
                          <a
                            href={rec.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {rec.title}
                          </a>
                        ) : (
                          rec.title
                        )}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="badge-primary text-xs">{rec.platform}</span>
                        <span className="badge-primary text-xs">{rec.topic}</span>
                        <span className={`badge text-xs ${
                          rec.difficulty === 'Easy'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.difficulty === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {rec.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {rec.reason}
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">— No recommendations yet —</p>
              )}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
};

export default RecommendationsPage;
