import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  Modal,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {X, Send} from 'lucide-react-native';
import {AUTH_ACTION_TYPES, requireAuth} from '../utils/authGuard';
import FeedPostCard from '../components/feed/FeedPostCard';
import {
  fetchFeedPosts,
  fetchLikedIds,
  toggleLike,
  postComment,
  MAX_COMMENT_LENGTH,
  fetchPostComments,
  timeAgo,
  toMediaUrl,
} from '../utils/feedApi';

const PRIMARY = '#5E23DC';
const PAGE_SIZE = 20;

function CommentsSheet({post, canComment, onNeedLogin, token, onPosted, onClose}) {
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    fetchPostComments(post.id)
      .then(c => alive && setComments(c))
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [post.id]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) {
      return;
    }
    if (!canComment) {
      onNeedLogin();
      return;
    }
    setSending(true);
    try {
      const {comment, comments_count} = await postComment(post.id, text, token);
      if (comment) {
        setComments(prev => prev.concat(comment));
      }
      setDraft('');
      onPosted(post.id, comments_count);
    } catch (e) {
      Alert.alert('Could not post comment', e?.message || 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayTap} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <X size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator color={PRIMARY} style={styles.sheetLoader} />
          ) : error ? (
            <Text style={styles.muted}>Could not load comments.</Text>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={c => String(c.id)}
              ListEmptyComponent={<Text style={styles.muted}>No comments yet.</Text>}
              renderItem={({item}) => (
                <View style={styles.comment}>
                  <Image
                    source={{
                      uri:
                        toMediaUrl(item.author_image) ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          item.author_name,
                        )}&background=5E23DC&color=fff`,
                    }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentBody}>
                    <Text style={styles.commentName}>
                      {item.author_name}
                      <Text style={styles.commentTime}>  {timeAgo(item.created_at)}</Text>
                    </Text>
                    <Text style={styles.commentText}>{item.content}</Text>
                  </View>
                </View>
              )}
            />
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder={canComment ? 'Add a comment…' : 'Log in to comment'}
              placeholderTextColor="#9CA3AF"
              maxLength={MAX_COMMENT_LENGTH}
              editable={canComment}
              onPressIn={canComment ? undefined : onNeedLogin}
              multiline
            />
            <TouchableOpacity
              onPress={send}
              disabled={sending || !draft.trim()}
              style={[styles.sendBtn, (sending || !draft.trim()) && styles.sendBtnOff]}>
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Send size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function FeedScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  const token = auth?.token;
  const loggedIn = Boolean(auth?.isAuthenticated && auth?.user?.id && token);
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [commentsFor, setCommentsFor] = useState(null);
  const busy = useRef(false);

  const load = useCallback(async (target, replace) => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    try {
      const {posts: next, hasMore: more} = await fetchFeedPosts(target, PAGE_SIZE);
      setPosts(prev => {
        if (replace) {
          return next;
        }
        const seen = new Set(prev.map(p => p.id));
        return prev.concat(next.filter(p => !seen.has(p.id)));
      });
      setPage(target);
      if (token) {
        fetchLikedIds(next.map(p => p.id), token)
          .then(ids => setLikedIds(prev => new Set([...prev, ...ids])))
          .catch(() => {});
      }
      setHasMore(more);
      setError(null);
    } catch (e) {
      setError(e?.message || 'Could not load the feed.');
    } finally {
      busy.current = false;
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [token]);

  useEffect(() => {
    load(1, true);
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(1, true);
  }, [load]);

  const onEndReached = useCallback(() => {
    if (!hasMore || busy.current || loading || refreshing) {
      return;
    }
    setLoadingMore(true);
    load(page + 1, false);
  }, [hasMore, loading, refreshing, page, load]);

  const needLogin = useCallback(
    () =>
      requireAuth(navigation, dispatch, auth, {type: AUTH_ACTION_TYPES.FEED}),
    [navigation, dispatch, auth],
  );

  const patchPost = useCallback((id, patch) => {
    setPosts(prev => prev.map(p => (p.id === id ? {...p, ...patch} : p)));
  }, []);

  const onToggleLike = useCallback(
    async post => {
      if (!loggedIn) {
        needLogin();
        return;
      }
      const wasLiked = likedIds.has(post.id);
      const setLiked = on =>
        setLikedIds(prev => {
          const next = new Set(prev);
          on ? next.add(post.id) : next.delete(post.id);
          return next;
        });
      // Optimistic update, rolled back if the server call fails.
      setLiked(!wasLiked);
      patchPost(post.id, {
        likes_count: Math.max(0, post.likes_count + (wasLiked ? -1 : 1)),
      });
      try {
        const res = await toggleLike(post.id, token);
        setLiked(res.liked);
        patchPost(post.id, {likes_count: res.likes_count});
      } catch (e) {
        setLiked(wasLiked);
        patchPost(post.id, {likes_count: post.likes_count});
        Alert.alert('Could not update like', e?.message || 'Please try again.');
      }
    },
    [loggedIn, likedIds, needLogin, patchPost, token],
  );

  const renderItem = useCallback(
    ({item}) => (
      <FeedPostCard
        post={item}
        liked={likedIds.has(item.id)}
        onToggleLike={onToggleLike}
        onOpenComments={setCommentsFor}
      />
    ),
    [likedIds, onToggleLike],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.topBar}>
        <Text style={styles.title}>Feed</Text>
        <Text style={styles.subtitle}>Updates from Reparv partners</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={PRIMARY} size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={posts}
          extraData={likedIds}
          keyExtractor={p => String(p.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {error ? 'Could not load the feed' : 'No posts yet'}
              </Text>
              <Text style={styles.muted}>
                {error || 'Check back soon for updates from our partners.'}
              </Text>
              {error ? (
                <TouchableOpacity style={styles.retry} onPress={() => load(1, true)}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={PRIMARY} style={styles.footer} /> : null
          }
        />
      )}

      {commentsFor ? (
        <CommentsSheet
          post={commentsFor}
          token={token}
          canComment={loggedIn}
          onNeedLogin={() => {
            setCommentsFor(null);
            needLogin();
          }}
          onPosted={(id, count) => patchPost(id, {comments_count: count})}
          onClose={() => setCommentsFor(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#F3F4F6'},
  topBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  title: {fontSize: 22, fontWeight: '800', color: '#111827'},
  subtitle: {fontSize: 12, color: '#6B7280', marginTop: 2},
  loader: {marginTop: 60},
  footer: {paddingVertical: 20},
  empty: {alignItems: 'center', padding: 40},
  emptyTitle: {fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6},
  muted: {color: '#6B7280', fontSize: 13, textAlign: 'center', padding: 16},
  retry: {
    marginTop: 12,
    backgroundColor: PRIMARY,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {color: '#fff', fontWeight: '700'},
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
  overlayTap: {flex: 1},
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: 220,
    paddingBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sheetTitle: {fontSize: 16, fontWeight: '800', color: '#111827'},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    maxHeight: 90,
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  sendBtn: {
    marginLeft: 8,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnOff: {opacity: 0.45},
  sheetLoader: {marginVertical: 30},
  comment: {flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8},
  commentAvatar: {width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEE'},
  commentBody: {flex: 1, marginLeft: 10},
  commentName: {fontSize: 13, fontWeight: '700', color: '#111827'},
  commentTime: {fontSize: 11, color: '#9CA3AF', fontWeight: '400'},
  commentText: {fontSize: 14, color: '#374151', marginTop: 2, lineHeight: 19},
});
