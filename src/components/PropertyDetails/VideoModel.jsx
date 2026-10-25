import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import LinearGradient from 'react-native-linear-gradient';
import {X, Play} from 'lucide-react-native';
import {getImageUri} from '../../utils/imageHandle';

const {width, height} = Dimensions.get('window');

const getYoutubeVideoId = url => {
  const regExp =
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&?/]+)/;
  const match = url?.match(regExp);
  return match ? match[1] : null;
};

export default function PropertyVideoModal({
  visible,
  onClose,
  property,
  onBook,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoVisible, setVideoVisible] = useState(false);
  const flatListRef = useRef(null);

  const images = property?.images || [];
  const videoLink = property?.videoLink;
  const videoId = getYoutubeVideoId(videoLink);

  const scrollToIndex = index => {
    if (index >= 0 && index < images.length) {
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
      });
      setActiveIndex(index);
    }
  };

  const onNext = () => scrollToIndex(activeIndex + 1);
  const onPrev = () => scrollToIndex(activeIndex - 1);

  const renderItem = ({item}) => (
    <View style={{width, alignItems: 'center'}}>
      <View style={styles.imageCard}>
        <Image
          source={{uri: getImageUri(item)}}
          style={styles.carouselImage}
          resizeMode="contain"
        />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.25)']}
          style={styles.gradientOverlay}
        />

        {/* Counter */}
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {activeIndex + 1}/{images.length}
          </Text>
        </View>

        {/* Left Arrow */}
        {activeIndex > 0 && (
          <TouchableOpacity style={styles.leftArrow} onPress={onPrev}>
            <Text style={styles.arrowText}>{'‹'}</Text>
          </TouchableOpacity>
        )}

        {/* Right Arrow */}
        {activeIndex < images.length - 1 && (
          <TouchableOpacity style={styles.rightArrow} onPress={onNext}>
            <Text style={styles.arrowText}>{'›'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      {/* <StatusBar
        backgroundColor="transparent"
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
      /> */}

      {/* <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} /> */}

      <View style={styles.bottomSheet}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <X color="#333" size={28} />
        </TouchableOpacity>

        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={ev => {
            const index = Math.round(ev.nativeEvent.contentOffset.x / width);
            setActiveIndex(index);
          }}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
        />

        <View style={styles.infoOverlay}>
          <Text style={styles.propertyTitle}>{property?.title}</Text>
          <Text style={styles.propertyLocation}>{property?.location}</Text>

          <TouchableOpacity style={styles.bookBtn} onPress={onBook}>
            <Text style={styles.bookBtnText}>Book Site Visit</Text>
          </TouchableOpacity>

          {videoLink && (
            <TouchableOpacity
              style={styles.videoCardBtn}
              onPress={() => setVideoVisible(true)}>
              <Play color="#fff" size={18} style={{marginRight: 6}} />
              <Text style={styles.videoBtnText}>Watch Video</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Video Modal */}
      {videoId && videoVisible && (
        <Modal visible={videoVisible} transparent animationType="fade">
          <View style={styles.videoOverlay}>
            <TouchableOpacity
              style={styles.videoCloseBtn}
              onPress={() => setVideoVisible(false)}>
              <X color="#fff" size={28} />
            </TouchableOpacity>

            <View style={styles.videoContainer}>
              <YoutubePlayer
                height={height * 0.55}
                width={width * 0.95}
                play
                videoId={videoId}
              />
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    maxHeight: height * 0.75,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    paddingTop: 12,
    alignItems: 'center',
  },

  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 20,
    elevation: 5,
  },

  imageCard: {
    width: width * 0.9,
    height: height * 0.4,
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 12,
  },

  carouselImage: {
    width: '100%',
    height: '100%',
  },

  gradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: '50%',
    bottom: 0,
  },

  counter: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  counterText: {
    color: '#fff',
    fontWeight: '600',
  },

  leftArrow: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{translateY: -20}],
    backgroundColor: 'rgba(0,0,0,0.55)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  rightArrow: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{translateY: -20}],
    backgroundColor: 'rgba(0,0,0,0.55)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  arrowText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
  },

  infoOverlay: {
    width: '90%',
    marginTop: 10,
  },

  propertyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  propertyLocation: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },

  bookBtn: {
    backgroundColor: '#8A38F5',
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 6,
    alignItems: 'center',
  },

  bookBtnText: {
    color: '#fff',
    fontWeight: '600',
  },

  videoCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
    alignSelf: 'flex-start',
  },

  videoBtnText: {
    color: '#fff',
    fontWeight: '600',
  },

  videoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  videoCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },

  videoContainer: {
    width: width * 0.95,
    backgroundColor: '#000',
    borderRadius: 15,
    overflow: 'hidden',
  },
});
