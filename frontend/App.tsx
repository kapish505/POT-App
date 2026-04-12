import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet, Platform, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';
import {
  useFonts,
  Newsreader_300Light,
  Newsreader_300Light_Italic,
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_700Bold,
} from '@expo-google-fonts/newsreader';
import {
  NotoSerif_400Regular,
  NotoSerif_400Regular_Italic,
  NotoSerif_700Bold,
} from '@expo-google-fonts/noto-serif';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { useAuthStore } from './src/store/auth.store';
import { Colors } from './src/constants/theme';
import { ToastProvider } from './src/components/Toast';

import { LoginScreen, RegisterScreen } from './src/screens/AuthScreens';
import { SwipeScreen } from './src/screens/SwipeScreen';
import { GroupDetailScreen } from './src/screens/GroupDetailScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { MyGroupsScreen } from './src/screens/MyGroupsScreen';
import { ProfileCompletionScreen } from './src/screens/ProfileCompletionScreen';
import { CreateGroupScreen } from './src/screens/CreateGroupScreen';
import { FriendsScreen } from './src/screens/FriendsScreen';
import { UserProfileScreen } from './src/screens/UserProfileScreen';
import { DirectMessageScreen } from './src/screens/DirectMessageScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Velvet Noir tab labels — no icons, pure typographic tab bar
const TAB_LABELS: Record<string, string> = {
  Discover: 'TONIGHT',
  'My Groups': 'ROOMS',
  Friends: 'CIRCLE',
  Profile: 'YOU',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.navActive,
        tabBarInactiveTintColor: Colors.navInactive,
        tabBarStyle: {
          backgroundColor: Colors.navBg,
          borderTopColor: Colors.navBorder,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 82 : 64,
          paddingBottom: Platform.OS === 'ios' ? 22 : 8,
          paddingTop: 10,
        },
        tabBarLabel: ({ focused, color }) => (
          <Text style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 9,
            letterSpacing: 1.8,
            color,
            marginTop: 2,
          }}>
            {TAB_LABELS[route.name] ?? route.name.toUpperCase()}
          </Text>
        ),
        tabBarIcon: () => null,
        tabBarIconStyle: { display: 'none' },
      })}
    >
      <Tab.Screen name="Discover" component={SwipeScreen} />
      <Tab.Screen name="My Groups" component={MyGroupsScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, loadUser, user } = useAuthStore();
  const [fontsLoaded] = useFonts({
    Newsreader_300Light,
    Newsreader_300Light_Italic,
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_700Bold,
    NotoSerif_400Regular,
    NotoSerif_400Regular_Italic,
    NotoSerif_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => { loadUser(); }, []);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={styles.loader}>
        <Text style={styles.wordmark}>POT</Text>
        <ActivityIndicator size="small" color={Colors.secondary} style={{ marginTop: 32 }} />
      </View>
    );
  }

  const needsProfileCompletion = isAuthenticated && user && !user.profileComplete;

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
              </>
            ) : needsProfileCompletion ? (
              <Stack.Screen name="OnboardingProfile" component={ProfileCompletionScreen} />
            ) : (
              <>
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen
                  name="GroupDetail"
                  component={GroupDetailScreen}
                  options={{ presentation: 'card' }}
                />
                <Stack.Screen
                  name="Chat"
                  component={ChatScreen}
                  options={{ presentation: 'card' }}
                />
                <Stack.Screen
                  name="CreateGroup"
                  component={CreateGroupScreen}
                  options={{ presentation: 'modal' }}
                />
                <Stack.Screen
                  name="EditProfile"
                  component={ProfileCompletionScreen}
                  options={{ presentation: 'modal' }}
                />
                <Stack.Screen
                  name="UserProfile"
                  component={UserProfileScreen}
                  options={{ presentation: 'card' }}
                />
                <Stack.Screen
                  name="DirectMessage"
                  component={DirectMessageScreen}
                  options={{ presentation: 'card' }}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDeepest,
  },
  wordmark: {
    fontFamily: 'Newsreader_300Light',
    fontSize: 64,
    letterSpacing: 18,
    color: Colors.textPrimary,
  },
});
