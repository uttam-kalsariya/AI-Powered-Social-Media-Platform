import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Heart, 
  MessageSquare, 
  Sparkles, 
  Trash2, 
  Edit3, 
  ShieldAlert, 
  Send, 
  FileText,
  Clock,
  Check,
  CheckCircle2,
  Bookmark,
  UserPlus,
  UserCheck
} from 'lucide-react';

export const PostCard = ({ post, onPostDeleted, onPostUpdated, onOpenAuth }) => {
  const { user, isAdmin } = useAuth();
  
  const [liked, setLiked] = useState(
    user ? (post.likes || []).includes(user.id || user._id) : false
  );
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [likeLoading, setLikeLoading] = useState(false);

  // Social suite: Bookmarks & Follows
  const [isSaved, setIsSaved] = useState(post.is_saved || false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveToast, setSaveToast] = useState(null);
  const [isFollowing, setIsFollowing] = useState(post.is_author_followed || false);
  const [followLoading, setFollowLoading] = useState(false);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);

  // AI smart replies state
  const [smartReplies, setSmartReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // AI summary state
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Edit post state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  const isAuthor = user && (user.id === post.author_id || user._id === post.author_id);
  const canManage = isAuthor || isAdmin;

  const handleToggleLike = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await api.posts.toggleLike(post.id || post._id);
      setLiked(res.liked);
      setLikesCount(res.likes_count);
    } catch (e) {
      console.error(e);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (saveLoading) return;
    setSaveLoading(true);
    try {
      const res = await api.posts.toggleSave(post.id || post._id);
      setIsSaved(res.saved);
      setSaveToast(res.message || (res.saved ? "Saved to Bookmarks" : "Removed from Bookmarks"));
      setTimeout(() => setSaveToast(null), 3000);
      if (onPostUpdated) {
        onPostUpdated({ ...post, is_saved: res.saved });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (followLoading || !post.author_id) return;
    setFollowLoading(true);
    try {
      const res = await api.users.toggleFollow(post.author_id);
      setIsFollowing(res.is_following);
      if (onPostUpdated) {
        onPostUpdated({ ...post, is_author_followed: res.is_following });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleFetchComments = async () => {
    if (!showComments) {
      setShowComments(true);
      setCommentsLoading(true);
      try {
        const res = await api.posts.getComments(post.id || post._id);
        setComments(res.comments || []);
      } catch (e) {
        console.error(e);
      } finally {
        setCommentsLoading(false);
      }
    } else {
      setShowComments(false);
    }
  };

  const handleAddComment = async (textToAdd = null) => {
    const text = (textToAdd || commentInput).trim();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!text) return;

    try {
      const res = await api.posts.addComment(post.id || post._id, text);
      setComments(prev => [...prev, res.comment]);
      setCommentsCount(prev => prev + 1);
      setCommentInput('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.posts.deleteComment(post.id || post._id, commentId);
      setComments(prev => prev.filter(c => (c.id || c._id) !== commentId));
      setCommentsCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadSmartReplies = async () => {
    if (smartReplies.length > 0) return;
    setLoadingReplies(true);
    try {
      const res = await api.ai.getSmartReplies(post.content);
      setSmartReplies(res.replies || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleSummarizeThread = async () => {
    setLoadingSummary(true);
    try {
      const res = await api.ai.summarize({ post_id: post.id || post._id, post_text: post.content });
      setSummary(res.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      const res = await api.posts.updatePost(post.id || post._id, { content: editContent });
      setIsEditing(false);
      if (onPostUpdated) onPostUpdated(res.post);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.posts.deletePost(post.id || post._id);
      if (onPostDeleted) onPostDeleted(post.id || post._id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDismissFlag = async () => {
    try {
      await api.admin.dismissFlag(post.id || post._id);
      post.is_flagged = false;
      if (onPostUpdated) onPostUpdated({ ...post, is_flagged: false });
    } catch (e) {
      console.error(e);
    }
  };

  const formattedDate = post.created_at
    ? new Date(post.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Just now';

  return (
    <article className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
      {/* Moderation Alert Banner */}
      {post.is_flagged && (
        <div style={{
          padding: '0.6rem 0.9rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fda4af',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={16} />
            <span>AI Moderation Flag: {post.moderation_reason || 'Under review'} (Score: {post.toxicity_score})</span>
          </div>
          {isAdmin && (
            <button 
              onClick={handleDismissFlag}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
            >
              Dismiss Flag
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src={post.author_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.author_name}`}
            alt={post.author_name}
            style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--bg-surface-elevated)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{post.author_name}</span>
              {post.author_name === 'admin' && (
                <span className="badge badge-admin" style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>Admin</span>
              )}
              {user && !isAuthor && (
                <button
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                  style={{
                    fontSize: '0.68rem',
                    padding: '0.15rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    marginLeft: '0.35rem'
                  }}
                  title={isFollowing ? "Unfollow this creator" : "Follow this creator"}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck size={11} />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={11} />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={11} />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Post Actions for Author or Admin */}
        {canManage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {isAuthor && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary"
                style={{ padding: '0.4rem', borderRadius: '50%' }}
                title="Edit Post"
              >
                <Edit3 size={14} />
              </button>
            )}
            <button
              onClick={handleDeletePost}
              className="btn btn-danger"
              style={{ padding: '0.4rem', borderRadius: '50%' }}
              title={isAdmin && !isAuthor ? "Admin Delete Post" : "Delete Post"}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div style={{ marginBottom: '1rem' }}>
          <textarea
            className="textarea-field"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            style={{ marginBottom: '0.5rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setIsEditing(false)} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
              Cancel
            </button>
            <button onClick={handleSaveEdit} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          fontSize: '0.95rem',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          marginBottom: '0.85rem',
          color: 'var(--text-primary)'
        }}>
          {post.content}
        </div>
      )}

      {/* Optional Post Image */}
      {post.image_url && (
        <div style={{
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          marginBottom: '0.85rem',
          maxHeight: '380px',
          border: '1px solid var(--border-subtle)'
        }}>
          <img
            src={post.image_url}
            alt="post visual"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.85rem' }}>
          {post.tags.map(t => (
            <span key={t} className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* AI Summary Box */}
      {summary && (
        <div style={{
          padding: '0.85rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          marginBottom: '0.85rem',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '0.4rem' }}>
            <Sparkles size={15} />
            <span>AI Discussion Highlights</span>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
            {summary}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '0.6rem',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Like */}
          <button
            onClick={handleToggleLike}
            style={{
              background: 'none',
              border: 'none',
              color: liked ? '#f43f5e' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 600,
              transition: 'color var(--transition-fast)'
            }}
          >
            <Heart size={18} fill={liked ? '#f43f5e' : 'none'} />
            <span>{likesCount}</span>
          </button>

          {/* Comments Toggle */}
          <button
            onClick={handleFetchComments}
            style={{
              background: 'none',
              border: 'none',
              color: showComments ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 600
            }}
          >
            <MessageSquare size={18} />
            <span>{commentsCount}</span>
          </button>

          {/* Bookmark / Save Post */}
          <button
            onClick={handleToggleSave}
            disabled={saveLoading}
            style={{
              background: 'none',
              border: 'none',
              color: isSaved ? '#f59e0b' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 600,
              transition: 'color var(--transition-fast)'
            }}
            title={isSaved ? "Saved to Bookmarks" : "Save to Bookmarks"}
          >
            <Bookmark size={18} fill={isSaved ? '#f59e0b' : 'none'} />
            <span style={{ fontSize: '0.8rem' }}>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        {/* AI Summarize Button */}
        <button
          onClick={handleSummarizeThread}
          disabled={loadingSummary}
          className="btn btn-secondary"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          title="Summarize post and discussion with AI"
        >
          <Sparkles size={13} color="var(--accent-cyan)" />
          <span>{loadingSummary ? 'Summarizing...' : 'AI Summary'}</span>
        </button>
      </div>

      {/* Save Notification Toast Banner */}
      {saveToast && (
        <div style={{
          marginTop: '0.65rem',
          padding: '0.45rem 0.85rem',
          borderRadius: '8px',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#fbbf24',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem'
        }}>
          <Bookmark size={13} fill="#fbbf24" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Comments Drawer */}
      {showComments && (
        <div style={{
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          animation: 'fadeIn 0.2s ease'
        }}>
          {/* Smart Replies Prompt */}
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Sparkles size={12} color="var(--accent-cyan)" />
                Suggested Smart Replies:
              </span>
              {smartReplies.length === 0 && (
                <button
                  type="button"
                  onClick={handleLoadSmartReplies}
                  disabled={loadingReplies}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {loadingReplies ? 'Generating ideas...' : 'Generate Replies'}
                </button>
              )}
            </div>

            {smartReplies.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {smartReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddComment(reply)}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.35rem 0.65rem',
                      background: 'rgba(6, 182, 212, 0.1)',
                      borderColor: 'rgba(6, 182, 212, 0.25)',
                      color: '#a5f3fc'
                    }}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comment Input */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              className="input-field"
              placeholder={user ? "Write a comment or pick a smart reply..." : "Log in to join discussion..."}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
              disabled={!user}
              style={{ fontSize: '0.85rem' }}
            />
            <button
              onClick={() => handleAddComment()}
              disabled={!user || !commentInput.trim()}
              className="btn btn-primary"
              style={{ padding: '0.5rem 0.85rem' }}
            >
              <Send size={15} />
            </button>
          </div>

          {/* Comment List */}
          {commentsLoading ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.75rem' }}>
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
              No comments yet. Start the conversation!
            </div>
          ) : (
            comments.map(c => {
              const canDeleteComment = user && (user.id === c.author_id || user._id === c.author_id || isAdmin);
              return (
                <div
                  key={c.id || c._id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '0.5rem',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <img
                      src={c.author_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.author_name}`}
                      alt={c.author_name}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-surface-elevated)' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 600 }}>{c.author_name}</span>
                        {c.author_name === 'admin' && (
                          <span className="badge badge-admin" style={{ fontSize: '0.55rem', padding: '0.05rem 0.25rem' }}>Admin</span>
                        )}
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {c.created_at ? new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {c.content}
                      </div>
                    </div>
                  </div>

                  {canDeleteComment && (
                    <button
                      onClick={() => handleDeleteComment(c.id || c._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-rose)',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        opacity: 0.7
                      }}
                      title="Delete comment"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </article>
  );
};
export default PostCard;
