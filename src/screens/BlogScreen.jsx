import React, {useEffect, useMemo, useState} from 'react';
import {API_BASE_URL} from '../config/api';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Search,
  Calendar,
  Clock,
  ArrowRight,
  Hash,
  ArrowLeft,
} from 'lucide-react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

const {width} = Dimensions.get('window');

const API_URL = `${API_BASE_URL}/frontend/blog`;
const IMAGE_BASE = API_BASE_URL;

const BlogScreen = () => {
  const [blogs, setBlogs] = useState([]);
  const [selectedType, setSelectedType] = useState('All');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  /* ---------- FETCH BLOGS ---------- */
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setBlogs(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.log('Blog API Error:', err);
        setLoading(false);
      });
  }, []);

  /* ---------- UNIQUE TYPES ---------- */
  const blogTypes = useMemo(() => {
    const types = blogs.map(item => item.type);
    return ['All', ...Array.from(new Set(types))];
  }, [blogs]);

  /* ---------- FILTERED BLOGS BY TYPE AND SEARCH ---------- */
  const filteredBlogs = useMemo(() => {
    let result = blogs;

    // Filter by type
    if (selectedType !== 'All') {
      result = result.filter(item => item.type === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          item.tittle?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query),
      );
    }

    return result;
  }, [selectedType, searchQuery, blogs]);

  const getImageUrl = image =>
    image?.startsWith('http') ? image : `${IMAGE_BASE}${image}`;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6A3DF0" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ---------- HERO ---------- */}
      <ImageBackground
        source={require('../assets/image/blogs/pn.jpg')}
        style={styles.hero}
        resizeMode="cover">
        <LinearGradient
          colors={['rgba(0,0,0,0)', '#3F2D62']}
          locations={[0, 0.8]}
          style={styles.heroOverlay}
        />

        {/* SAFE TOP BAR */}
        <SafeAreaView edges={['top']} style={styles.heroTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>

        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Reparv Real Estate Blog</Text>
          <Text style={styles.heroSubtitle}>
            Property insights, trends & expert advice to help you make smarter
            real estate decisions.
          </Text>

          {/* ---------- SEARCH INPUT ---------- */}
          <View style={styles.searchBox}>
            <Search size={18} color="#999" />
            <TextInput
              placeholder="Search articles..."
              placeholderTextColor="#999"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={text => setSearchQuery(text)}
            />
          </View>
        </View>
      </ImageBackground>

      {/* ---------- CATEGORY TABS ---------- */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsWrap}>
        {blogTypes.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedType(item)}
            style={[styles.tab, selectedType === item && styles.activeTab]}>
            <Text
              style={[
                styles.tabText,
                selectedType === item && styles.activeTabText,
              ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ---------- BLOG LIST ---------- */}
      <View style={styles.sectionHeader}>
        <Hash size={14} color="#6A3DF0" />
        <Text style={styles.sectionHash}>
          {selectedType === 'All' ? 'Latest From Our Blog' : selectedType}
        </Text>
      </View>

      {filteredBlogs.length === 0 ? (
        <Text style={styles.emptyText}>No blogs found.</Text>
      ) : (
        filteredBlogs.map(item => (
          <View key={item.id} style={styles.card}>
            <Image
              source={{uri: getImageUrl(item.image)}}
              style={styles.cardImage}
            />

            <View style={styles.cardContent}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.type}</Text>
              </View>

              <Text style={styles.cardTitle}>{item.tittle}</Text>

              <Text style={styles.cardDesc} numberOfLines={3}>
                {item.description}
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.metaRow}>
                  <Calendar size={12} color="#999" />
                  <Text style={styles.meta}>{item.created_at}</Text>
                </View>

                <TouchableOpacity
                  style={styles.readBtn}
                  onPress={() =>
                    navigation.navigate('BlogDetails', {blog: item})
                  }>
                  <Text style={styles.readBtnText}>Read More</Text>
                  <ArrowRight size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default BlogScreen;
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F6F7FB'},
  loader: {flex: 1, justifyContent: 'center', alignItems: 'center'},

  hero: {
    height: 260,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  heroTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroOverlay: {...StyleSheet.absoluteFillObject},
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroTitle: {fontSize: 22, fontWeight: '700', color: '#fff'},
  heroSubtitle: {
    color: '#E6E1F0',
    marginVertical: 8,
    fontSize: 14,
  },

  searchBox: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {flex: 1, marginLeft: 8},

  tabsWrap: {paddingLeft: 16, marginVertical: 14},
  tab: {
    // borderWidth: 1,
    // borderColor: '#6A3DF0',
    backgroundColor: '#F1F1F1',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
  },
  activeTab: {backgroundColor: '#6A3DF0'},
  tabText: {color: '#0c0b0e', fontSize: 13},
  activeTabText: {color: '#fff'},

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    gap: 6,
  },
  sectionHash: {color: '#6A3DF0', fontWeight: '600'},

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    margin: 16,
    marginTop: 12,
    overflow: 'hidden',
    // elevation: 3,
  },
  cardImage: {width: '100%', height: width * 0.5},
  cardContent: {padding: 14},

  tag: {
    backgroundColor: '#E9F7EF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  tagText: {color: '#27AE60', fontSize: 11},

  cardTitle: {fontSize: 16, fontWeight: '700', marginVertical: 6},
  cardDesc: {fontSize: 13, color: '#666'},

  cardFooter: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  meta: {fontSize: 11, color: '#999'},

  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6A3DF0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  readBtnText: {color: '#fff', fontSize: 12},
  emptyText: {
    textAlign: 'center',
    marginVertical: 40,
    color: '#999',
  },
});
