import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

import LogoutButton from '@/components/logoutButton';
import { useAuthStore } from '@/storage/useAuthStorage';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="PersonalPage"
        options={{
          title: 'Gastos Personales',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          headerRight: () => (
            <LogoutButton />
          ),
        }}
      />
      <Tabs.Screen
        name="GroupsPage"
        options={{
          title: 'Grupos y Ahorros',
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
                 headerRight: () => (
                  <LogoutButton />
          ),
        }}
      />
    </Tabs>
  );
}
