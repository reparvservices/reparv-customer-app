import {API_BASE_URL} from '../config/api';
import {requestJson} from './networkClient';

const S3_BASE = 'https://reparv-assets.s3.ap-south-1.amazonaws.com';

export const toMediaUrl = path => {
  if (!path) {
    return null;
  }
  return /^https?:\/\//i.test(path) ? path : `${S3_BASE}${path}`;
};

export const isVideoUrl = url => {
  if (!url) {
    return false;
  }
  const lower = url.toLowerCase().split('?')[0];
  return /\.(mp4|mov|avi|mkv|webm)$/.test(lower) || lower.includes('/video/');
};

/** "5m", "3h", "2d", else a short date. `now` is injectable for tests. */
export const timeAgo = (value, now = Date.now()) => {
  const t = new Date(value).getTime();
  if (!Number.isFinite(t)) {
    return '';
  }
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 60) {
    return 'just now';
  }
  if (s < 3600) {
    return `${Math.floor(s / 60)}m`;
  }
  if (s < 86400) {
    return `${Math.floor(s / 3600)}h`;
  }
  if (s < 7 * 86400) {
    return `${Math.floor(s / 86400)}d`;
  }
  return new Date(t).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'});
};

export const fetchFeedPosts = async (page = 1, limit = 20) => {
  const data = await requestJson(
    `${API_BASE_URL}/customerapp/feed/posts?page=${page}&limit=${limit}`,
    {method: 'GET'},
    'feed posts',
  );
  return {
    posts: Array.isArray(data?.posts) ? data.posts : [],
    hasMore: Boolean(data?.hasMore),
  };
};

export const fetchPostComments = async postId => {
  const data = await requestJson(
    `${API_BASE_URL}/customerapp/feed/posts/${postId}/comments`,
    {method: 'GET'},
    'feed comments',
  );
  return Array.isArray(data?.comments) ? data.comments : [];
};

const authHeaders = token => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const MAX_COMMENT_LENGTH = 500;

/** Toggles the like; resolves to {liked, likes_count} from the server. */
export const toggleLike = async (postId, token) => {
  const data = await requestJson(
    `${API_BASE_URL}/customerapp/feed/posts/${postId}/like`,
    {method: 'POST', headers: authHeaders(token)},
    'feed like',
  );
  return {liked: Boolean(data?.liked), likes_count: Number(data?.likes_count) || 0};
};

/** Resolves to {comment, comments_count}. */
export const postComment = async (postId, content, token) => {
  const data = await requestJson(
    `${API_BASE_URL}/customerapp/feed/posts/${postId}/comments`,
    {method: 'POST', headers: authHeaders(token), body: JSON.stringify({content})},
    'feed comment',
  );
  return {comment: data?.comment, comments_count: Number(data?.comments_count) || 0};
};

export const fetchLikedIds = async (ids, token) => {
  if (!ids.length || !token) {
    return [];
  }
  const data = await requestJson(
    `${API_BASE_URL}/customerapp/feed/posts/liked?ids=${ids.join(',')}`,
    {method: 'GET', headers: {Authorization: `Bearer ${token}`}},
    'feed liked',
  );
  return Array.isArray(data?.liked) ? data.liked : [];
};
