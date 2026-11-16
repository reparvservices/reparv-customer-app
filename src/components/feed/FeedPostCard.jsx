import React, {memo, useCallback, useState} from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
  useWindowDimensions,
} from 'react-native';
import {Heart, MessageCircle, Play} from 'lucide-react-native';
import {isVideoUrl, timeAgo, toMediaUrl} from '../../utils/feedApi';

const PRIMARY = '#5E23DC';
const CONTENT_LINES = 4;

function avatarFor(name, image) {
  return (
    toMediaUrl(image) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || 'Reparv',
    )}&background=5E23DC&color=fff`
  );
}

function FeedPostCard({post, liked, onToggleLike, onOpenComments}) {
  const {width} = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const media = post.media_urls || [];
  const mediaH = Math.round(width * 0.9);

  const openVideo = useCallback(url => {
    Linking.openURL(toMediaUrl(url)).catch(() => {});
  }, []);

  const renderMedia = useCallback(
    ({item}) => {
      const uri = toMediaUrl(item);
      if (isVideoUrl(item)) {
        const poster = toMediaUrl(post.thumbnail_url);
        return (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => openVideo(item)}
            style={[styles.mediaBox, {width, height: mediaH}]}>
            {poster && !isVideoUrl(post.thumbnail_url) ? (
              <Image source={{uri: poster}} style={styles.media} resizeMode="cover" />
            ) : null}
            <View style={styles.playBadge}>
              <Play size={26} color="#fff" fill="#fff" />
            </View>
          </TouchableOpacity>
        );
      }
      return (
        <View style={[styles.mediaBox, {width, height: mediaH}]}>
          <Image source={{uri}} style={styles.media} resizeMode="cover" />
        </View>
      );
    },
    [width, mediaH, post.thumbnail_url, openVideo],
  );

  const longText = (post.content || '').length > 180;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image
          source={{uri: avatarFor(post.author_name, post.author_image)}}
          style={styles.avatar}
        />
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>
            {post.author_name}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {post.author_label} · {timeAgo(post.created_at)}
          </Text>
        </View>
        {post.tag_label ? (
          <View
            style={[
              styles.tag,
              post.tag_bg ? {backgroundColor: post.tag_bg} : null,
            ]}>
            <Text
              style={[styles.tagText, post.tag_color ? {color: post.tag_color} : null]}>
              {post.tag_label}
            </Text>
          </View>
        ) : null}
      </View>

      {media.length > 0 ? (
        <View>
          <FlatList
            data={media}
            keyExtractor={(m, i) => `${m}-${i}`}
            renderItem={renderMedia}
            horizontal
            pagingEnabled
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e =>
              setPage(Math.round(e.nativeEvent.contentOffset.x / width))
            }
            initialNumToRender={1}
            windowSize={3}
            removeClippedSubviews
          />
          {media.length > 1 ? (
            <View style={styles.dots}>
              {media.map((_, i) => (
                <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.stat}
          onPress={() => onToggleLike(post)}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          accessibilityRole="button"
          accessibilityLabel={liked ? 'Unlike' : 'Like'}>
          <Heart
            size={20}
            color={liked ? '#EF4444' : '#6B7280'}
            fill={liked ? '#EF4444' : 'none'}
          />
          <Text style={styles.statText}>{post.likes_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.stat}
          onPress={() => onOpenComments(post)}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <MessageCircle size={20} color="#6B7280" />
          <Text style={styles.statText}>{post.comments_count}</Text>
        </TouchableOpacity>
      </View>

      {post.content ? (
        <View style={styles.body}>
          <Text
            style={styles.content}
            numberOfLines={expanded ? undefined : CONTENT_LINES}>
            {post.content}
          </Text>
          {longText && !expanded ? (
            <TouchableOpacity onPress={() => setExpanded(true)}>
              <Text style={styles.more}>more</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {backgroundColor: '#fff', marginBottom: 10},
  header: {flexDirection: 'row', alignItems: 'center', padding: 12},
  avatar: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE'},
  headerText: {flex: 1, marginLeft: 10},
  name: {fontSize: 14, fontWeight: '700', color: '#111827'},
  sub: {fontSize: 12, color: '#6B7280', marginTop: 1},
  tag: {
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  tagText: {fontSize: 11, fontWeight: '700', color: PRIMARY},
  mediaBox: {backgroundColor: '#000', alignItems: 'center', justifyContent: 'center'},
  media: {...StyleSheet.absoluteFillObject},
  playBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {flexDirection: 'row', justifyContent: 'center', paddingTop: 8},
  dot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB', marginHorizontal: 3},
  dotActive: {backgroundColor: PRIMARY},
  actions: {flexDirection: 'row', paddingHorizontal: 12, paddingTop: 10},
  stat: {flexDirection: 'row', alignItems: 'center', marginRight: 18},
  statText: {marginLeft: 6, fontSize: 13, color: '#374151', fontWeight: '600'},
  body: {paddingHorizontal: 12, paddingTop: 8, paddingBottom: 14},
  content: {fontSize: 14, lineHeight: 20, color: '#1F2937'},
  more: {color: PRIMARY, fontWeight: '700', marginTop: 4},
});

export default memo(FeedPostCard);
