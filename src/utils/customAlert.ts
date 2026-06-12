import { Alert, AlertButton, AlertOptions } from 'react-native';

export type AlertConfig = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
};

type AlertListener = (config: AlertConfig | null) => void;

let activeListener: AlertListener | null = null;

export const registerAlertListener = (listener: AlertListener) => {
  activeListener = listener;
  return () => {
    activeListener = null;
  };
};

export const triggerCustomAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions
) => {
  if (activeListener) {
    activeListener({ title, message, buttons, options });
  } else {
    // Fallback to console warning if custom alert overlay isn't mounted yet
    console.warn("CustomAlert listener not registered. Title:", title, message);
  }
};

// Monkey-patch Alert.alert globally
const originalAlertAlert = Alert.alert;
Alert.alert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions
) => {
  triggerCustomAlert(title, message, buttons, options);
};

export { originalAlertAlert };
