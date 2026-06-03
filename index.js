import { AppRegistry, Text, TextInput, Platform } from 'react-native';
import App from './App';
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';

// Force OTA updates to resolve local image assets from the APK drawables
resolveAssetSource.setCustomSourceTransformer((resolver) => {
  if (Platform.OS === 'android' && resolver.isLoadedFromFileSystem()) {
    return resolver.resourceIdentifierWithoutScale();
  }
  return resolver.defaultAsset();
});
import { name as appName } from './app.json';

// Global Quicksand Font — set default fontFamily on all Text and TextInput
const defaultTextStyle = { fontFamily: 'Quicksand-Regular' };

if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.style = defaultTextStyle;
Text.defaultProps.allowFontScaling = false;

if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.style = defaultTextStyle;
TextInput.defaultProps.allowFontScaling = false;

AppRegistry.registerComponent(appName, () => App);

