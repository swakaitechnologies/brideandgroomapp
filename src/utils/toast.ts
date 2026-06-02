import Toast from 'react-native-toast-message';

/**
 * Display a global toast notification with auto-resolved status types
 * @param msg The message to show inside the toast
 * @param title Optional title. If not provided, it maps to the message.
 */
export const showToast = (msg: string, title?: string) => {
  if (!msg) return;

  const lowercaseMsg = msg.toLowerCase();
  let type: 'success' | 'error' | 'info' | 'warning' = 'info';

  if (
    lowercaseMsg.includes('success') ||
    lowercaseMsg.includes('sent') ||
    lowercaseMsg.includes('updated') ||
    lowercaseMsg.includes('approved') ||
    lowercaseMsg.includes('verified')
  ) {
    type = 'success';
  } else if (
    lowercaseMsg.includes('fail') ||
    lowercaseMsg.includes('error') ||
    lowercaseMsg.includes('wrong') ||
    lowercaseMsg.includes('required') ||
    lowercaseMsg.includes('invalid') ||
    lowercaseMsg.includes('cannot')
  ) {
    type = 'error';
  } else if (
    lowercaseMsg.includes('premium') ||
    lowercaseMsg.includes('upgrade') ||
    lowercaseMsg.includes('gold') ||
    lowercaseMsg.includes('diamond') ||
    lowercaseMsg.includes('platinum')
  ) {
    type = 'info';
  } else if (
    lowercaseMsg.includes('warn') ||
    lowercaseMsg.includes('limit') ||
    lowercaseMsg.includes('locked')
  ) {
    type = 'warning';
  }

  Toast.show({
    type,
    text1: title || msg,
    text2: title ? msg : undefined,
    position: 'bottom',
    bottomOffset: 90,
  });
};
