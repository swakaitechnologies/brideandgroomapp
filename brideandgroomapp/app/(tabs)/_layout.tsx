import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Home, Heart, Mail, MessageSquare, Crown, Menu, Bell } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/src/store';

import { palette } from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';
import SideDrawer from '@/components/SideDrawer';
import { openDrawer, closeDrawer } from '@/src/store/uiSlice';

export default function TabLayout() {
  const { mode } = useSelector((state: RootState) => state.theme);
  const { isDrawerOpen } = useSelector((state: RootState) => state.ui);
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const isDark = mode === 'dark';
  const theme = isDark ? palette.purple.dark : palette.purple.light;
  const activeColor = palette.gold.main;
  const inactiveColor = palette.purple.deep;
  const textColor = isDark ? palette.purple.light : palette.purple.deep;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarHideOnKeyboard: true,
        headerTransparent: false,
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#FFFFFF' }} />
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          paddingTop: 5,
        },
        tabBarStyle: {
          backgroundColor: isDark ? '#121212' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#333333' : '#E0E0E0',
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 5,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerStyle: {
          backgroundColor: isDark ? '#121212' : '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          color: textColor,
          fontWeight: 'bold',
        },
        headerShown: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: () => null,
          headerLeft: () => {
            const { user } = useSelector((state: RootState) => state.auth);
            const hour = new Date().getHours();
            let greeting = 'Good Morning';
            if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
            else if (hour >= 17) greeting = 'Good Evening';

            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 15 }}>
                <TouchableOpacity onPress={() => dispatch(openDrawer())}>
                  <Menu size={28} color={textColor} />
                </TouchableOpacity>
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ fontSize: 12, color: inactiveColor }}>{greeting},</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>
                    {user?.firstName || 'User'} 👋
                  </Text>
                </View>
              </View>
            );
          },
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
              <TouchableOpacity onPress={() => router.push('/(tabs)/inbox')}>
                <Bell size={28} color={textColor} />
              </TouchableOpacity>
            </View>
          ),
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color }) => <Heart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          headerTitle: 'Inbox',
          headerLeft: () => (
            <TouchableOpacity onPress={() => dispatch(openDrawer())} style={{ marginLeft: 15 }}>
              <Menu size={28} color={textColor} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/(tabs)/inbox')} style={{ marginRight: 15 }}>
              <Bell size={28} color={textColor} />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color }) => <Mail size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="premium"
        options={{
          title: 'Premium',
          tabBarIcon: ({ color }) => <Crown size={24} color={color} />,
        }}
      />
      </Tabs>
      <SideDrawer isOpen={isDrawerOpen} onClose={() => dispatch(closeDrawer())} />
    </View>
  );
}
