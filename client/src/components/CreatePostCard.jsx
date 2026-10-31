import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Sparkles, 
  Wand2, 
  Image as ImageIcon, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  Tag, 
  RefreshCw 
} from 'lucide-react';

export const CreatePostCard = ({ onPostCreated, onOpenAuth }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [showImageInput, setShowImageInput] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  
  // AI Generator state
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState('casual');
  const [generating, setGenerating] = useState(false);
  
  // Submission & moderation state
  const [loading, setLoading] = useState(false);
  const [moderationNotice, setModerationNotice] = useState(null);
  const [error, setError] = useState('');

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tToRemove) => {
    setTags(tags.filter(t => t !== tToRemove));
  };

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const res = await api.ai.generatePost({ topic: aiTopic, tone: aiTone });
      setContent(res.content);
      setShowAiModal(false);
      setAiTopic('');
    } catch (err) {
      setError(err.message || 'AI generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleToneImprove = async (tone) => {
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.ai.improvePost({ content, target_tone: tone });
      setContent(res.improved_content);
    } catch (err) {
      setError(err.message || 'Tone enhancement failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!content.trim()) return;

    setLoading(true);
    setError('');
    setModerationNotice(null);

    try {
      const res = await api.posts.createPost({
        content,
        image_url: imageUrl,
        tags
      });
      setContent('');
      setImageUrl('');
      setTags([]);
      setShowImageInput(false);
      if (res.moderation_notice) {
        setModerationNotice(res.moderation_notice);
      }
      if (onPostCreated) onPostCreated(res.post);
    } catch (err) {
      setError(err.message || 'Failed to publish post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src={user?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=Guest"}
            alt="avatar"
            style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1e293b' }}
          />
          <div>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              {user ? `Share what's on your mind, ${user.username}` : "Join the conversation"}
            </span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Powered by AI content tools & real-time moderation
            </div>
          </div>
        </div>

        {/* AI Generator Trigger */}
        <button
          type="button"
          onClick={() => {
            if (!user) { onOpenAuth(); return; }
            setShowAiModal(true);
          }}
          className="btn btn-ai"
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
        >
          <Sparkles size={15} />
          <span>AI Post Creator</span>
        </button>
      </div>

      {error && (
        <div style={{
          padding: '0.6rem 0.9rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(244, 63, 94, 0.15)',
          color: '#fda4af',
          fontSize: '0.85rem',
          marginBottom: '0.75rem',
          border: '1px solid rgba(244, 63, 94, 0.3)'
        }}>
          {error}
        </div>
      )}

      {moderationNotice && (
        <div style={{
          padding: '0.6rem 0.9rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#fcd34d',
          fontSize: '0.85rem',
          marginBottom: '0.75rem',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <ShieldAlert size={16} />
          <span>Notice: Content was flagged for admin review ({moderationNotice.reason}).</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          className="textarea-field"
          rows={3}
          placeholder={user ? "Write your post, or let AI assist you..." : "Please log in to publish a post..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!user || loading}
          style={{ resize: 'vertical', minHeight: '80px', marginBottom: '0.75rem' }}
        />

        {/* Optional Image input */}
        {showImageInput && (
          <div style={{ marginBottom: '0.75rem' }}>
            <input
              type="url"
              className="input-field"
              placeholder="Paste Image URL (e.g. https://images.unsplash.com/...)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
            {imageUrl && (
              <div style={{ marginTop: '0.5rem', maxHeight: '180px', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
                <img src={imageUrl} alt="preview" style={{ width: '100%', objectFit: 'cover' }} onError={() => setError('Invalid image URL')} />
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', marginBottom: '0.75rem' }}>
          {tags.map((t) => (
            <span key={t} className="badge badge-primary" style={{ cursor: 'pointer' }} onClick={() => removeTag(t)}>
              #{t} &times;
            </span>
          ))}
          {user && (
            <input
              type="text"
              placeholder="Add tag (hit Enter)..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                outline: 'none',
                width: '140px'
              }}
            />
          )}
        </div>

        {/* Toolbar & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Quick AI Rewriters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            >
              <ImageIcon size={15} />
              <span>{showImageInput ? 'Hide Image' : 'Add Image'}</span>
            </button>

            {content.trim() && (
              <>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>AI Polish:</span>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleToneImprove('professional')}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                >
                  💼 Professional
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleToneImprove('witty')}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                >
                  🔥 Witty
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleToneImprove('inspirational')}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                >
                  🌟 Inspiring
                </button>
              </>
            )}
          </div>

          {/* Submit */}
          <div>
            {user ? (
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.25rem' }}
              >
                {loading ? <RefreshCw className="animate-spin" size={15} /> : <Send size={15} />}
                <span>Post</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.25rem' }}
              >
                Sign In to Post
              </button>
            )}
          </div>
        </div>
      </form>

      {/* AI Post Generator Modal */}
      {showAiModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-panel-elevated" style={{ maxWidth: '480px', width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                padding: '0.5rem',
                borderRadius: 'var(--radius-md)'
              }}>
                <Sparkles size={20} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>AI Post Generator</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Give a topic and tone, and AI will craft an engaging post for you.
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                Topic or Idea
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Launching my new SaaS, Machine learning trends, Morning routines..."
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                Tone of Voice
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { id: 'casual', label: '👋 Friendly & Casual' },
                  { id: 'professional', label: '💼 Professional' },
                  { id: 'witty', label: '🔥 Witty & Fun' },
                  { id: 'inspirational', label: '🌟 Inspirational' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAiTone(item.id)}
                    className={`btn ${aiTone === item.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="btn btn-secondary"
                disabled={generating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={generating || !aiTopic.trim()}
                className="btn btn-ai"
              >
                {generating ? <RefreshCw className="animate-spin" size={16} /> : <Wand2 size={16} />}
                <span>{generating ? 'Drafting...' : 'Generate Post'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
