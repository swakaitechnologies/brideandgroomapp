import { StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { Heart, Sparkles } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/store';
import { palette } from '@/src/theme/colors';

export default function MatchesScreen() {
  const { mode } = useSelector((state: RootState) => state.theme);
  const isDark = mode === 'dark';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? palette.purple.dark : '#FFFFFF' }]}>
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? '#252525' : '#FFFFFF' }]}>
          <Heart size={48} color="#D4AF37" />
        </View>
        <Text style={[styles.title, { color: isDark ? palette.purple.light : '#3B1E54' }]}>Your Matches</Text>
        <Text style={[styles.subtitle, { color: isDark ? palette.purple.muted : '#7E6B8F' }]}>
          Discover profiles curated just for you based on your preferences.
        </Text>
        
        <TouchableOpacity style={styles.button}>
          <Sparkles size={20} color="#3B1E54" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Find New Matches</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#3B1E54',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
