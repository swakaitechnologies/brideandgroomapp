import React from 'react';
import { StyleSheet, Linking, TouchableOpacity, Platform } from 'react-native';
import { Text, View } from '../../components/Themed';

export default function EditScreenInfo({ path }: { path: string }) {
  const handleLinkPress = () => {
    Linking.openURL('https://docs.expo.io/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet');
  };

  return (
    <View style={styles.container}>
      <View style={styles.getStartedContainer}>
        <Text style={styles.getStartedText}>
          Open up the code for this screen:
        </Text>

        <View style={styles.codeHighlightContainer}>
          <Text style={styles.codeText}>{path}</Text>
        </View>

        <Text style={styles.getStartedText}>
          Change any of the text, save the file, and your app will automatically update.
        </Text>
      </View>

      <View style={styles.helpContainer}>
        <TouchableOpacity onPress={handleLinkPress} style={styles.helpLink}>
          <Text style={styles.helpLinkText}>
            Tap here if your app doesn't automatically update after making changes
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  codeHighlightContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    paddingHorizontal: 4,
    marginVertical: 7,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
  },
  getStartedText: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  helpContainer: {
    marginTop: 15,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  helpLink: {
    paddingVertical: 15,
  },
  helpLinkText: {
    textAlign: 'center',
    color: '#2e78b7',
  },
});
