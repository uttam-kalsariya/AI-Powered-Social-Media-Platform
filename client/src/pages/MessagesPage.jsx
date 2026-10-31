import React, { useState } from 'react';
import { Send, Search, User, Sparkles, Bot, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const MessagesPage = () => {
  const { user } = useAuth();

  const [activeContact, setActiveContact] = useState('alex');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'alex', text: 'Hey! Did you check out the new AI summarization feature on Aura?', time: '10:45 AM' },
    { id: 2, sender: 'me', text: 'Yes, it works really well on long discussions. Highly accurate!', time: '10:48 AM' },
    { id: 3, sender: 'alex', text: 'Awesome! Let me know if you want to collaborate on the next post.', time: '10:50 AM' }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const contacts = [
    { id: 'alex', username: 'alex', name: 'Alex Johnson', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex', lastMsg: 'Awesome! Let me know...', time: '10:50 AM', unread: 0 },
    { id: 'sarah', username: 'sarah_ai', name: 'Sarah Miller', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=sarah', lastMsg: 'Thanks for sharing that repo!', time: 'Yesterday', unread: 2 },
    { id: 'marcus', username: 'marcus_dev', name: 'Marcus Vance', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=marcus', lastMsg: 'Are we still syncing at 3pm?', time: 'Oct 29', unread: 0 }
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'me',
        text: inputMessage.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInputMessage('');
  };

  return (
    <div className="glass-panel" style={{
      maxWidth: '1000px',
      margin: '0 auto',
      height: 'calc(100vh - 160px)',
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden'
    }}>
      {/* Sidebar / Contacts List */}
      <div style={{ borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Direct Messages</h3>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search conversations..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {contacts.map(c => (
            <div
              key={c.id}
              onClick={() => setActiveContact(c.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                background: activeContact === c.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                border: activeContact === c.id ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                marginBottom: '0.35rem',
                transition: 'all 0.15s ease'
              }}
            >
              <img
                src={c.avatar}
                alt={c.name}
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1e293b' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.time}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.2rem' }}>
                  {c.lastMsg}
                </div>
              </div>
              {c.unread > 0 && (
                <span style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700
                }}>
                  {c.unread}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Chat Header */}
        <div style={{
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'rgba(15, 23, 42, 0.3)'
        }}>
          <img
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${activeContact}`}
            alt={activeContact}
            style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1e293b' }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>@{activeContact}</div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
              <span>Online</span>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {messages.map(m => {
            const isMe = m.sender === 'me';
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  padding: '0.7rem 1rem',
                  borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isMe ? 'var(--primary)' : 'rgba(30, 41, 59, 0.75)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  lineHeight: 1.45,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {m.text}
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {m.time}
                </span>
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            style={{
              flex: 1,
              padding: '0.7rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0.7rem 1.25rem' }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
export default MessagesPage;
