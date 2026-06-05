import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Search, ArrowLeft, X, Heart } from "lucide-react-native";
import api from "../../services/api";
import { ProfileCard } from "../../components/ProfileCard";
import { fonts } from "@/src/theme";

export default function SearchProfilesScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await api.get("/profile/all");
      if (res.data?.success && res.data?.data) {
        setAllProfiles(res.data.data);
      }
    } catch (error) {
      console.error("Search Profiles Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setResults([]);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const filtered = allProfiles.filter(p => {
      const first = (p.firstName || "").toLowerCase();
      const last = (p.lastName || "").toLowerCase();
      const profession = (p.profession || "").toLowerCase();
      const city = (p.city || "").toLowerCase();
      const state = (p.state || "").toLowerCase();
      return (
        first.includes(q) ||
        last.includes(q) ||
        profession.includes(q) ||
        city.includes(q) ||
        state.includes(q)
      );
    });
    setResults(filtered);
  }, [searchQuery, allProfiles]);

  const handleViewProfile = (profile: any) => {
    navigation.navigate("ProfileDetail", { profile });
  };

  const renderEmptyState = () => {
    if (searchQuery.trim().length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Search size={50} color="#7E6B8F" style={{ opacity: 0.5 }} />
          <Text style={styles.emptyTitle}>Search for Profiles</Text>
          <Text style={styles.emptyText}>
            Type a name, profession, or location above to find matches.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Heart size={50} color="#7E6B8F" style={{ opacity: 0.5 }} />
        <Text style={styles.emptyTitle}>No Results Found</Text>
        <Text style={styles.emptyText}>
          We couldn't find any profiles matching "{searchQuery}". Try a different spelling or criteria.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Search Header Bar */}
      <View style={styles.searchHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#3B1E54" />
        </TouchableOpacity>

        <View style={styles.searchBarContainer}>
          <Search size={18} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            placeholder="Search by name, job, or city..."
            placeholderTextColor="#8E8E93"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <X size={16} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B1E54" />
          <Text style={styles.loadingText}>Loading search database...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id || item.userId || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState()}
          renderItem={({ item }) => (
            <ProfileCard
              profile={item}
              type="grid"
              layout="horizontal"
              onPress={() => handleViewProfile(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFBFF",
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(59, 30, 84, 0.06)",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59, 30, 84, 0.04)",
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 30, 84, 0.04)",
    borderRadius: 15,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1A1A1A",
    ...fonts.medium,
    paddingVertical: 6,
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#7E6B8F",
    ...fonts.medium,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    paddingBottom: 40,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    ...fonts.bold,
    color: "#3B1E54",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 13,
    color: "#7E6B8F",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
});
