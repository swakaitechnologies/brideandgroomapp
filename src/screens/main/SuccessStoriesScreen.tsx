import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Star, Calendar, BookOpen, ChevronDown, ChevronUp } from 'lucide-react-native';
import { getApprovedSuccessStories, resolvePhotoUrl } from '../../services/api';
import { palette } from '../../theme/colors';
import { fonts } from '@/src/theme';

const { width, height } = Dimensions.get('window');

interface Story {
  id: string | number;
  coupleName: string;
  weddingDate: string;
  title: string;
  story: string;
  imageUrl?: string;
  createdAt: string;
}

export default function SuccessStoriesScreen() {
  const navigation = useNavigation<any>();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedStories, setExpandedStories] = useState<Record<string | number, boolean>>({});

  const fetchStories = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await getApprovedSuccessStories();
      if (res.data && Array.isArray(res.data)) {
        setStories(res.data);
      } else if (res.data?.stories && Array.isArray(res.data.stories)) {
        setStories(res.data.stories);
      } else {
        setStories([]);
      }
    } catch (err) {
      console.error("Error fetching approved stories:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const onRefresh = useCallback(() => {
    fetchStories(true);
  }, []);

  const toggleExpand = (id: string | number) => {
    setExpandedStories(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderStoryItem = ({ item }: { item: Story }) => {
    const isExpanded = !!expandedStories[item.id];
    const displayStory = isExpanded ? item.story : `${item.story.substring(0, 140)}...`;
    const isLongStory = item.story.length > 140;

    return (
      <View style={styles.storyCard}>
        {/* Couple Image header */}
        {item.imageUrl ? (
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: resolvePhotoUrl(item.imageUrl) }}
              style={styles.coverImage}
              resizeMode="cover"
            />
            <View style={styles.badgeOverlay}>
              <Star size={12} color="#D4AF37" fill="#D4AF37" />
              <Text style={styles.badgeOverlayText}>SUCCESS MATCH</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.imageWrapper, styles.placeholderWrapper]}>
            <Star size={36} color="rgba(212, 175, 55, 0.4)" />
            <Text style={styles.placeholderText}>A Match Made in Heaven</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          {/* Couple Names */}
          <Text style={styles.coupleNames}>{item.coupleName}</Text>

          {/* Wedding Date */}
          {item.weddingDate && (
            <View style={styles.metaRow}>
              <Calendar size={13} color="#7E6B8F" />
              <Text style={styles.metaText}>
                Married on {new Date(item.weddingDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Title */}
          <Text style={styles.storyTitle}>{item.title}</Text>

          {/* Description */}
          <Text style={styles.storyBody}>{displayStory}</Text>

          {/* Expand/Collapse Toggle */}
          {isLongStory && (
            <TouchableOpacity
              style={styles.expandBtn}
              onPress={() => toggleExpand(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.expandBtnText}>
                {isExpanded ? 'Read Less' : 'Read Full Story'}
              </Text>
              {isExpanded ? (
                <ChevronUp size={14} color="#3B1E54" />
              ) : (
                <ChevronDown size={14} color="#3B1E54" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <ArrowLeft size={22} color="#3B1E54" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Success Stories</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B1E54" />
          <Text style={styles.loadingText}>Loading happy endings...</Text>
        </View>
      ) : (
        <FlatList
          data={stories}
          renderItem={renderStoryItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B1E54']}
              tintColor="#3B1E54"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BookOpen size={48} color="rgba(90, 42, 130, 0.2)" />
              <Text style={styles.emptyTitle}>No Stories Yet</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to share your matrimonial success story and inspire our community!
              </Text>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={() => navigation.navigate('SubmitStory')}
                activeOpacity={0.8}
              >
                <Text style={styles.shareBtnText}>Share Your Story</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 30, 84, 0.08)',
    backgroundColor: '#FFFFFF',
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    ...fonts.bold,
    color: '#3B1E54',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#7E6B8F',
    ...fonts.medium,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 20,
  },
  storyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(59, 30, 84, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  imageWrapper: {
    width: '100%',
    height: 190,
    backgroundColor: '#FAF9FC',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  badgeOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(59, 30, 84, 0.85)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeOverlayText: {
    color: '#FFFFFF',
    fontSize: 9,
    ...fonts.bold,
    letterSpacing: 0.5,
  },
  placeholderWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAF9FC',
  },
  placeholderText: {
    fontSize: 14,
    color: '#7E6B8F',
    ...fonts.bold,
  },
  cardBody: {
    padding: 16,
  },
  coupleNames: {
    fontSize: 18,
    ...fonts.bold,
    color: '#3B1E54',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 12,
    color: '#7E6B8F',
    ...fonts.medium,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#EDE6F5',
    marginVertical: 12,
  },
  storyTitle: {
    fontSize: 15,
    ...fonts.bold,
    color: '#3B1E54',
    marginBottom: 6,
  },
  storyBody: {
    fontSize: 13.5,
    color: '#555555',
    lineHeight: 20,
    ...fonts.regular,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  expandBtnText: {
    fontSize: 12,
    ...fonts.bold,
    color: '#3B1E54',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: height * 0.15,
    paddingHorizontal: 30,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    ...fonts.bold,
    color: '#3B1E54',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: '#7E6B8F',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
    ...fonts.regular,
  },
  shareBtn: {
    backgroundColor: '#3B1E54',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    ...fonts.bold,
  },
});
