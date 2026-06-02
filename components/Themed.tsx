import React from 'react';
import { Text as RNText, View as RNView, TextProps, ViewProps, StyleSheet } from 'react-native';

export function Text(props: TextProps) {
  const { style, ...otherProps } = props;
  
  // Flatten style array/object to inspect styles
  const flatStyle = StyleSheet.flatten(style) || {};
  let fontFamily = 'Quicksand-Regular';
  
  if (
    flatStyle.fontWeight === 'bold' || 
    flatStyle.fontWeight === '700' || 
    flatStyle.fontWeight === '800' || 
    flatStyle.fontWeight === '900'
  ) {
    fontFamily = 'Quicksand-Bold';
  } else if (flatStyle.fontWeight === '600' || flatStyle.fontWeight === 'semibold') {
    fontFamily = 'Quicksand-SemiBold';
  } else if (flatStyle.fontWeight === '500' || flatStyle.fontWeight === 'medium') {
    fontFamily = 'Quicksand-Medium';
  } else if (flatStyle.fontWeight === '300' || flatStyle.fontWeight === 'light') {
    fontFamily = 'Quicksand-Light';
  }

  // Override fontFamily and strip fontWeight to avoid conflict on some Android platforms
  const finalStyle = StyleSheet.compose(
    style,
    { fontFamily }
  );

  return (
    <RNText
      style={finalStyle}
      {...otherProps}
    />
  );
}

export function View(props: ViewProps) {
  return <RNView {...props} />;
}
