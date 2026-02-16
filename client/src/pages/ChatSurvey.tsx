import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

export default function ChatSurvey() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [personality, setPersonality] = useState<{ title: string; emoji: string; description: string } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReady, setTurnstileReady] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>(undefined);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasSentInitial = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Turnstile setup
  const renderTurnstile = useCallback(() => {
    if (turnstileRef.current && window.turnstile && !widgetIdRef.current) {
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: '0x4AAAAAACdQ_pJ4jiR82h13',
        callback: (token: string) => {
          setTurnstileToken(token);
          setTurnstileReady(true);
        },
        'error-callback': () => setTurnstileToken(''),
      });
    }
  }, []);

  useEffect(() => {
    renderTurnstile();
    if (!window.turnstile) {
      const interval = setInterval(() => {
        if (window.turnstile) {
          renderTurnstile();
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [renderTurnstile]);

  // Auto-start conversation once Turnstile is ready
  useEffect(() => {
    if (turnstileReady && !sessionId && messages.length === 0 && !hasSentInitial.current) {
      hasSentInitial.current = true;
      sendMessage('', turnstileToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnstileReady]);

  const sendMessage = async (text: string, token?: string) => {
    // Add user message to chat (unless it's the initial empty message)
    if (text) {
      setMessages(prev => [...prev, {
        id: `user-${Date.now()}`,
        role: 'user',
        text,
      }]);
    }

    setInput('');
    setQuickReplies([]);
    setLoading(true);

    // Minimum typing delay for natural feel
    const minDelay = new Promise(resolve => setTimeout(resolve, 800));

    try {
      const [response] = await Promise.all([
        fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            session_id: sessionId || undefined,
            message: text,
            turnstile_token: token || undefined,
          }),
        }),
        minDelay,
      ]);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (data.session_id) setSessionId(data.session_id);
      setProgress(data.progress || 0);

      // Add AI reply
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: data.reply,
      }]);

      if (data.quick_replies?.length) {
        setQuickReplies(data.quick_replies);
      }

      if (data.is_complete && data.citizen_id) {
        setComplete(true);
        // Fetch personalized summary
        try {
          const summaryRes = await fetch('/api/chat/summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ citizen_id: data.citizen_id }),
          });
          const summaryData = await summaryRes.json();
          if (summaryData.summary) setSummary(summaryData.summary);
          if (summaryData.personality_title) {
            setPersonality({
              title: summaryData.personality_title,
              emoji: summaryData.personality_emoji || '',
              description: summaryData.personality_description || '',
            });
          }
        } catch {
          // Summary is optional, don't block
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'ai',
        text: `Oops! ${message}`,
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || complete) return;
    sendMessage(input.trim());
  };

  const handleQuickReply = (reply: string) => {
    if (loading || complete) return;
    sendMessage(reply);
  };

  // Completion screen with summary + social sharing
  if (complete && messages.length > 0) {
    const shareUrl = 'https://bahamastech.ai';
    const shareText = personality
      ? `I'm ${personality.emoji} ${personality.title}! Take the Bahamas Tech Town Hall survey to find yours.`
      : "I shared my voice at the Bahamas Technology Town Hall!";
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-bahamas-aqua-light to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-4">
            Your feedback has been submitted successfully.
          </p>

          {personality && (
            <div className="bg-gradient-to-br from-bahamas-aqua/5 to-yellow-50 rounded-xl border-2 border-bahamas-aqua/30 p-6 mb-4">
              <div className="text-5xl mb-3">{personality.emoji}</div>
              <p className="text-xs uppercase tracking-wider text-bahamas-aqua font-semibold mb-1">Your Tech Personality</p>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{personality.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{personality.description}</p>
            </div>
          )}

          {summary && (
            <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4 text-left">
              <div className="flex items-center gap-2 mb-3">
                <BahamasFlag size={20} />
                <h3 className="font-semibold text-gray-800">Bahamas AI Insight</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">Share the Town Hall</h3>
            <div className="flex flex-col gap-2">
              <a href={linkedInUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#0A66C2] text-white px-4 py-3 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                Share on LinkedIn
              </a>
              <div className="flex gap-2">
                <a href={twitterUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Post on X
                </a>
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1877F2] text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </a>
              </div>
            </div>
          </div>

          <button onClick={() => navigate('/')} className="text-bahamas-aqua hover:opacity-80 text-sm font-medium">
            &larr; Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <BahamasFlag size={32} />
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900 text-sm">Bahamas AI</h1>
            <p className="text-xs text-gray-500">Technology Town Hall Survey</p>
          </div>
          <button onClick={() => navigate('/')} className="text-xs text-gray-400 hover:text-gray-600">
            Exit
          </button>
        </div>
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-2">
          <div className="w-full bg-gray-100 rounded-full h-1">
            <div
              className="bg-bahamas-aqua h-1 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Turnstile (hidden after verification) */}
          {!turnstileReady && (
            <div className="flex justify-center py-8">
              <div>
                <div ref={turnstileRef} />
                <p className="text-xs text-gray-400 text-center mt-2">Verifying...</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              {msg.role === 'ai' && (
                <div className="flex-shrink-0 mt-1">
                  <BahamasFlag size={24} />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-bahamas-aqua text-white rounded-br-md'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-2 justify-start animate-fade-in">
              <div className="flex-shrink-0 mt-1">
                <BahamasFlag size={24} />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick replies */}
      {quickReplies.length > 0 && !loading && !complete && (
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="max-w-2xl mx-auto flex flex-wrap gap-2">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => handleQuickReply(reply)}
                className="px-4 py-2 bg-white border border-bahamas-aqua text-bahamas-aqua rounded-full text-sm font-medium hover:bg-bahamas-aqua hover:text-white transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      {!complete && turnstileReady && (
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={loading ? 'Bahamas AI is typing...' : 'Type your message...'}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-bahamas-aqua focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-bahamas-aqua text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity disabled:bg-gray-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function BahamasFlag({ size = 24 }: { size?: number }) {
  const h = size * (2/3);
  return (
    <svg width={size} height={h} viewBox="0 0 300 200" className="rounded-sm flex-shrink-0">
      <rect width="300" height="66.67" fill="#00B4D8" />
      <rect y="66.67" width="300" height="66.67" fill="#FFD700" />
      <rect y="133.33" width="300" height="66.67" fill="#00B4D8" />
      <polygon points="0,0 120,100 0,200" fill="#1A1A2E" />
    </svg>
  );
}
