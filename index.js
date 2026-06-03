import { AppRegistry, Text, TextInput } from 'react-native';
import App from './App';
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

