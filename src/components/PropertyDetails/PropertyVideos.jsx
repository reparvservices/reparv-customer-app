import {useEffect, useState} from 'react';
import {
  Dimensions,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Video from 'react-native-video';
import YoutubePlayer from 'react-native-youtube-iframe';
import {WebView} from 'react-native-webview';
import {Instagram, Play, Video as VideoIcon, Youtube} from 'lucide-react-native';
import {getImageUri} from '../../utils/imageHandle';
import {reelCodeOf, youtubeIdOf} from '../../utils/videoLinks';

const {width} = Dimensions.get('window');
const PLAYER_WIDTH = width - 64; // screen - card margins - card padding
const PLAYER_HEIGHT = Math.round((PLAYER_WIDTH * 9) / 16);

const YouTubeCard = ({id}) => {
  // Show the thumbnail first; load the YouTube player only when asked
  const [playing, setPlaying] = useState(false);

  useEffect(() => setPlaying(false), [id]);

  if (playing) {
    return (
      <View style={styles.player}>
        <YoutubePlayer
          height={PLAYER_HEIGHT}
          width={PLAYER_WIDTH}
          videoId={id}
          play
          onChangeState={state => state === 'ended' && setPlaying(false)}
        />
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.player}
      onPress={() => setPlaying(true)}>
      <Image
        source={{uri: `https://img.youtube.com/vi/${id}/hqdefault.jpg`}}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View style={styles.ytPlayBtn}>
        <Play size={22} color="white" fill="white" />
      </View>
    </TouchableOpacity>
  );
};

/**
 * The property's videos: uploaded walkthrough, YouTube video and Instagram reel,
 * one at a time (tabs), like the website's PropertyVideos. Renders nothing when
 * the property has none.
 */
export const PropertyVideos = ({propertyVideo, videoLink, instagramReelLink}) => {
  const uploaded = propertyVideo ? getImageUri(propertyVideo) : '';
  const ytId = youtubeIdOf(videoLink);
  const reelCode = reelCodeOf(instagramReelLink);

  const items = [
    uploaded && {key: 'uploaded', label: 'Walkthrough', Icon: VideoIcon, color: '#8A38F5'},
    ytId && {key: 'youtube', label: 'YouTube', Icon: Youtube, color: '#FF0000'},
    reelCode && {key: 'reel', label: 'Instagram Reel', Icon: Instagram, color: '#C13584'},
  ].filter(Boolean);
  const [active, setActive] = useState(items[0]?.key);

  if (!items.length) return null;
  const current = items.some(v => v.key === active) ? active : items[0].key;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Videos & Reels</Text>

      {items.length > 1 && (
        <View style={styles.tabs}>
          {items.map(({key, label, Icon, color}) => {
            const isActive = current === key;
            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.8}
                onPress={() => setActive(key)}
                style={[styles.tab, isActive && styles.activeTab]}>
                <Icon size={14} color={color} />
                <Text
                  numberOfLines={1}
                  style={[styles.tabText, isActive && styles.activeTabText]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {current === 'uploaded' && (
        <Video
          key={uploaded}
          source={{uri: uploaded}}
          style={styles.player}
          controls
          paused
          resizeMode="contain"
        />
      )}

      {current === 'youtube' && <YouTubeCard id={ytId} />}

      {current === 'reel' && (
        <View style={styles.reelWrapper}>
          <View style={styles.reelFrame}>
            <WebView
              source={{uri: `https://www.instagram.com/reel/${reelCode}/embed/`}}
              style={styles.reelWebView}
              scrollEnabled={false}
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction
            />
          </View>
          <TouchableOpacity
            style={styles.reelLink}
            onPress={() =>
              Linking.openURL(`https://www.instagram.com/reel/${reelCode}/`)
            }>
            <Instagram size={15} color="#C13584" />
            <Text style={styles.reelLinkText}>Watch on Instagram</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE7FB',
  },
  title: {fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 12},
  tabs: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 10,
    backgroundColor: '#F6F1FF',
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 8,
  },
  activeTab: {backgroundColor: 'white', elevation: 1},
  tabText: {fontSize: 12, fontWeight: '600', color: '#5E23DC'},
  activeTabText: {color: '#000'},
  player: {
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytPlayBtn: {
    width: 64,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelWrapper: {
    alignItems: 'center',
    backgroundColor: '#FAF8FF',
    borderRadius: 12,
    paddingVertical: 16,
  },
  reelFrame: {
    width: Math.min(PLAYER_WIDTH - 24, 340),
    height: 560,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  reelWebView: {flex: 1},
  reelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  reelLinkText: {fontSize: 14, fontWeight: '600', color: '#C13584'},
});
