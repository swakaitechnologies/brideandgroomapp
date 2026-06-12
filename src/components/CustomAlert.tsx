import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Info, AlertTriangle, CheckCircle2, X } from 'lucide-react-native';
import { palette } from '../theme/colors';
import { fonts } from '@/src/theme';
import { registerAlertListener, AlertConfig } from '../utils/customAlert';

const { width } = Dimensions.get('window');

export default function CustomAlert() {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const unsubscribe = registerAlertListener((newConfig) => {
      if (newConfig) {
        setConfig(newConfig);
        setVisible(true);
      } else {
        closeAlert();
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const closeAlert = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setConfig(null);
    });
  };

  if (!visible || !config) return null;

  const { title, message, buttons } = config;

  // Context-aware icon helper
  const getContextIcon = () => {
    const t = title.toLowerCase();
    const m = message?.toLowerCase() || '';
    if (
      t.includes('success') ||
      t.includes('verified') ||
      t.includes('done') ||
      t.includes('approved') ||
      t.includes('saved') ||
      t.includes('submitted') ||
      t.includes('sent') ||
      t.includes('updated')
    ) {
      return <CheckCircle2 size={36} color="#4CAF50" />;
    }
    if (
      t.includes('error') ||
      t.includes('fail') ||
      t.includes('denied') ||
      t.includes('block') ||
      t.includes('invalid') ||
      m.includes('required') ||
      t.includes('required')
    ) {
      return <AlertTriangle size={36} color="#FF3B30" />;
    }
    if (
      t.includes('warning') ||
      t.includes('lock') ||
      t.includes('premium') ||
      t.includes('confirm') ||
      t.includes('reset') ||
      t.includes('delete') ||
      t.includes('logout') ||
      t.includes('remove') ||
      t.includes('unblock') ||
      t.includes('clear') ||
      t.includes('sure')
    ) {
      return <AlertTriangle size={36} color={palette.gold.main} />;
    }
    return <Info size={36} color="#3B1E54" />;
  };

  const handleButtonPress = (onPress?: () => void) => {
    closeAlert();
    if (onPress) {
      setTimeout(() => {
        onPress();
      }, 50);
    }
  };

  const renderButtons = () => {
    if (!buttons || buttons.length === 0) {
      return (
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => handleButtonPress()}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>OK</Text>
        </TouchableOpacity>
      );
    }

    const shouldStack = buttons.length > 2 || buttons.some(btn => btn.text && btn.text.length > 12);

    if (buttons.length === 2 && !shouldStack) {
      const btnLeft = buttons[0];
      const btnRight = buttons[1];

      return (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonHalf,
              btnLeft.style === 'cancel' ? styles.cancelButton : styles.secondaryButton,
            ]}
            onPress={() => handleButtonPress(btnLeft.onPress)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.buttonText,
                btnLeft.style === 'cancel' ? styles.cancelButtonText : styles.secondaryButtonText,
                btnLeft.style === 'destructive' && styles.destructiveText,
              ]}
            >
              {btnLeft.text || 'Cancel'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonHalf,
              btnRight.style === 'destructive' ? styles.destructiveButton : styles.primaryButton,
            ]}
            onPress={() => handleButtonPress(btnRight.onPress)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.buttonText,
                btnRight.style === 'destructive' ? styles.destructiveButtonText : styles.primaryButtonText,
              ]}
            >
              {btnRight.text || 'OK'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.buttonStack}>
        {buttons.map((btn, idx) => {
          const isPrimary = idx === buttons.length - 1;
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.button,
                isPrimary ? styles.primaryButton : btn.style === 'cancel' ? styles.cancelButton : styles.secondaryButton,
                btn.style === 'destructive' && styles.destructiveButton,
              ]}
              onPress={() => handleButtonPress(btn.onPress)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.buttonText,
                  isPrimary ? styles.primaryButtonText : btn.style === 'cancel' ? styles.cancelButtonText : styles.secondaryButtonText,
                  btn.style === 'destructive' && styles.destructiveButtonText,
                ]}
              >
                {btn.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={() => closeAlert()}
    >
      <Animated.View 
        style={[styles.backdrop, { opacity: fadeAnim }]}
        needsOffscreenAlphaCompositing={true}
      >
        <Animated.View style={[styles.alertCard, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity style={styles.closeIconBtn} onPress={() => closeAlert()}>
            <X size={16} color="#7E6B8F" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            {getContextIcon()}
          </View>

          <Text style={styles.titleText}>{title}</Text>

          {message ? (() => {
            const parts = message.split('[NOTE]');
            const mainMessage = parts[0].trim();
            const noteMessage = parts[1] ? parts[1].trim() : null;
            return (
              <>
                {mainMessage ? <Text style={styles.messageText}>{mainMessage}</Text> : null}
                {noteMessage ? (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteText}>{noteMessage}</Text>
                  </View>
                ) : null}
              </>
            );
          })() : null}

          <View style={styles.actionsWrapper}>
            {renderButtons()}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  closeIconBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F8F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 18,
    ...fonts.bold,
    color: '#3B1E54',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  messageText: {
    fontSize: 13,
    ...fonts.medium,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  actionsWrapper: {
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  buttonStack: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  button: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  buttonHalf: {
    flex: 1,
  },
  buttonText: {
    fontSize: 14,
    ...fonts.bold,
  },
  primaryButton: {
    backgroundColor: '#3B1E54',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    ...fonts.bold,
  },
  secondaryButton: {
    backgroundColor: '#F0EAF5',
  },
  secondaryButtonText: {
    color: '#3B1E54',
    fontSize: 14,
    ...fonts.bold,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E8E5EE',
  },
  cancelButtonText: {
    color: '#7E6B8F',
    fontSize: 14,
    ...fonts.semibold,
  },
  destructiveButton: {
    backgroundColor: '#FF3B30',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    ...fonts.bold,
  },
  destructiveText: {
    color: '#FF3B30',
  },
  noteBox: {
    backgroundColor: '#FFF9E6',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  noteText: {
    fontSize: 12,
    color: '#3B1E54',
    ...fonts.semibold,
    lineHeight: 16,
    textAlign: 'center',
  },
});
