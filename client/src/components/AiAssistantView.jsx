import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Bot, 
  Send, 
  Sparkles, 
  RefreshCw, 
  Lightbulb, 
  Copy, 
  Check,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

export const AiAssistantView = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${user ? user.username : 'there'}! 👋 I'm **Aura**, your personal AI Social Media Strategist.\n\nI can help you brainstorm high-performing content ideas, write compelling hooks, optimize your posting strategy, or polish any captions. How can I assist you today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend = null) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.ai.chat(updatedMessages);
      setMessages([...updatedMessages, { role: 'assistant', content: res.reply }]);
    } catch (e) {
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: "I encountered a hiccup generating a response. Please try again!" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const quickPrompts = [
    "💡 Give me 3 viral post ideas for developers",
    "🚀 Draft a celebratory launch post for my full-stack app",
    "📈 How do I double my social media engagement rate?",
    "✨ Write a witty caption about debugging code late at night"
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
          }}>
            <Bot size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h2 style={{ fontSize: '1.15rem' }}>Aura AI Assistant</h2>
              <span className="badge badge-ai" style={{ fontSize: '0.65rem' }}>Social Strategist</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Ask for creative angles, content rewrites, or hashtag recommendations
            </p>
          </div>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="glass-panel" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                maxWidth: '85%',
                padding: '0.85rem 1.15rem',
                borderRadius: 'var(--radius-lg)',
                background: isUser ? 'var(--primary-gradient)' : 'rgba(30, 41, 59, 0.8)',
                color: '#fff',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                border: isUser ? 'none' : '1px solid var(--border-subtle)',
                whiteSpace: 'pre-wrap',
                boxShadow: isUser ? '0 4px 15px rgba(99, 102, 241, 0.25)' : 'none'
              }}>
                {m.content}
              </div>

              {!isUser && (
                <button
                  onClick={() => copyToClipboard(m.content, idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    marginTop: '0.3rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {copiedIdx === idx ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  <span>{copiedIdx === idx ? 'Copied' : 'Copy answer'}</span>
                </button>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', fontSize: '0.85rem', padding: '0.5rem' }}>
            <RefreshCw className="animate-spin" size={16} />
            <span>Aura is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="btn btn-secondary"
            style={{
              fontSize: '0.75rem',
              padding: '0.35rem 0.75rem',
              whiteSpace: 'nowrap',
              background: 'rgba(255, 255, 255, 0.04)'
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="glass-panel" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Ask Aura anything about content creation, strategy, or ideas..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          style={{ border: 'none', background: 'transparent' }}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="btn btn-ai"
          style={{ padding: '0.6rem 1.25rem' }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
