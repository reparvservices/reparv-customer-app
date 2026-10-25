import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Calendar,
} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

const {width} = Dimensions.get('window');

const BlogDetailScreen = ({route}) => {
  const navigation = useNavigation();
  const {blog} = route.params || {};

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ---------- HERO IMAGE ---------- */}
      <View>
        <Image source={{uri: blog?.image}} style={styles.heroImage} />
        <LinearGradient
          colors={['rgba(0,0,0,0)', '#000']}
          style={styles.heroOverlay}
        />

        <SafeAreaView style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <ArrowLeft color="#fff" size={20} />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      {/* ---------- CONTENT ---------- */}
      <View style={styles.content}>
        <Text style={styles.breadcrumb}>
          Home › Blogs › Investment › {blog?.title}
        </Text>

        <Text style={styles.title}>{blog?.title}</Text>

        <View style={styles.metaRow}>
          <Calendar size={12} color="#777" />
          <Text style={styles.metaText}>{blog?.created_at}</Text>
        </View>

        <Text style={styles.description}>{blog?.description}</Text>

        {/* ---------- AUTHOR ---------- */}
        <View style={styles.authorCard}>
          <View style={styles.avatar} />
          <View>
            <Text style={styles.authorName}>Name Of Author</Text>
            <Text style={styles.authorBio}>
              Real estate expert with years of experience in rental and
              investment property markets.
            </Text>
          </View>
        </View>

        {/* ---------- RELATED BLOGS ---------- */}
        <Text style={styles.relatedTitle}>Related Articles</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[1, 2].map(item => (
            <View key={item} style={styles.relatedCard}>
              <Image source={{uri: blog?.image}} style={styles.relatedImage} />
              <Text style={styles.relatedText} numberOfLines={2}>
                Top 10 Real Estate Investment Strategies for 2024
              </Text>
              <TouchableOpacity style={styles.readMore}>
                <Text style={styles.readMoreText}>Read More →</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

export default BlogDetailScreen;
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},

  heroImage: {width: '100%', height: width * 0.65},
  heroOverlay: {...StyleSheet.absoluteFillObject},
  topBar: {position: 'absolute', top: 0, left: 16},
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {padding: 16},
  breadcrumb: {fontSize: 12, color: '#777', marginBottom: 8},
  title: {fontSize: 22, fontWeight: '800', marginBottom: 6},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  metaText: {fontSize: 12, color: '#777'},
  description: {fontSize: 14, marginTop: 12, color: '#333'},

  authorCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F6F7FB',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ccc',
  },
  authorName: {fontWeight: '700'},
  authorBio: {fontSize: 12, color: '#666', marginTop: 4},

  actionRow: {
    flexDirection: 'row',
    gap: 20,
    marginVertical: 20,
  },
  actionItem: {flexDirection: 'row', gap: 6, alignItems: 'center'},
  actionText: {fontSize: 12},

  feedbackBox: {
    backgroundColor: '#F6F2FF',
    borderRadius: 16,
    padding: 16,
  },
  feedbackTitle: {fontWeight: '700', marginBottom: 10},
  feedbackButtons: {flexDirection: 'row', gap: 10},
  yesBtn: {
    backgroundColor: '#6A3DF0',
    padding: 10,
    borderRadius: 10,
  },
  noBtn: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 10,
  },
  btnText: {color: '#fff', fontSize: 12},

  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  submitBtn: {
    backgroundColor: '#6A3DF0',
    padding: 14,
    borderRadius: 12,
    marginTop: 14,
    alignItems: 'center',
  },
  submitText: {color: '#fff', fontWeight: '700'},

  relatedTitle: {fontWeight: '800', marginVertical: 16, fontSize: 16},
  relatedCard: {
    width: width * 0.6,
    marginRight: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  relatedImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  relatedText: {padding: 10, fontWeight: '600'},
  readMore: {padding: 10},
  readMoreText: {color: '#6A3DF0', fontSize: 12},
});
