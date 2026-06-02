import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import EditScreenInfo from '../../components/EditScreenInfo';
import { fonts } from "@/src/theme";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modal</Text>
      <View style={styles.separator} />
      <EditScreenInfo path="src/screens/core/ModalScreen.tsx" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    ...fonts.semibold,
    color: '#000000',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
    backgroundColor: '#EEEEEE',
  },
});
