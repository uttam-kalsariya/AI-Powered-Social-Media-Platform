import React, { useState } from 'react';
import { Play, Heart, MessageCircle, Share2, Sparkles, Volume2 } from 'lucide-react';

export const ReelsPage = () => {
  const [likedReels, setLikedReels] = useState({});

  const sampleReels = [
    {
      id: 'reel-1',
      author: 'creative_coder',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=creative_coder',
      caption: 'Building real-time neural network visualizations with WebGL and React! 🚀',
      tags: ['#webgl', '#ai', '#creativecoding'],
      likes: 1240,
      comments: 89,
      videoPlaceholder: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'reel-2',
      author: 'ai_architect',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai_architect',
      caption: 'Top 5 open-source LLM architectures powering the latest autonomous agents in 2026.',
      tags: ['#deeplearning', '#agents', '#techtrends'],
      likes: 2150,
      comments: 142,
      videoPlaceholder: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80'
    }
  ];

  const toggleLike = (id) => {
    setLikedReels(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Play size={20} color="var(--primary)" />
          <span>Reels & Highlights</span>
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Short-form media</span>
      </div>

      {sampleReels.map(reel => {
        const isLiked = !!likedReels[reel.id];
        return (
          <div key={reel.id} className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative' }}>
            {/* Visual Media Container */}
            <div style={{
              width: '100%',
              height: '480px',
              position: 'relative',
              background: '#0f172a',
              overflow: 'hidden'
            }}>
              <img
                src={reel.videoPlaceholder}
                alt={reel.caption}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 40%, rgba(0,0,0,0.4) 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ background: 'rgba(0,0,0,0.5)', padding: '0.4rem', borderRadius: '50%', color: '#fff' }}>
                    <Volume2 size={16} />
                  </div>
                </div>

                {/* Bottom Overlay Info */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                      <img
                        src={reel.avatar}
                        alt={reel.author}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--primary)' }}
                      />
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>@{reel.author}</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', lineHeight: 1.4, marginBottom: '0.4rem' }}>{reel.caption}</p>
                    <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.8rem', color: '#93c5fd' }}>
                      {reel.tags.map(t => <span key={t}>{t}</span>)}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <button
                      onClick={() => toggleLike(reel.id)}
                      style={{ background: 'none', border: 'none', color: isLiked ? '#f43f5e' : '#fff', cursor: 'pointer', textAlign: 'center' }}
                    >
                      <Heart size={24} fill={isLiked ? '#f43f5e' : 'none'} />
                      <div style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>{reel.likes + (isLiked ? 1 : 0)}</div>
                    </button>
                    <div style={{ color: '#fff', textAlign: 'center' }}>
                      <MessageCircle size={24} />
                      <div style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>{reel.comments}</div>
                    </div>
                    <div style={{ color: '#fff', textAlign: 'center' }}>
                      <Share2 size={22} />
                      <div style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>Share</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default ReelsPage;
