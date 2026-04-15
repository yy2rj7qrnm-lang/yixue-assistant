import React from 'react';
import {
  NavigationContainer,
  NavigationIndependentTree,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ThemeProvider, Button } from '@rneui/themed';
import { StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// 导入主题
import theme from './styles/theme';

// 导入页面
import {
  HomeScreen,
  MistakeScreen,
  StudyScreen,
  ReportScreen,
  ProfileScreen,
  MistakeDetailScreen,
  StudyDetailScreen,
  ReportDetailScreen,
} from './src/screens';

// 创建导航器
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 主标签导航
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Icon.glyphMap;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Mistake') {
            iconName = 'assignment-late';
          } else if (route.name === 'Study') {
            iconName = 'school';
          } else if (route.name === 'Report') {
            iconName = 'assessment';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 10,
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '首页',
        }}
      />
      <Tab.Screen
        name="Mistake"
        component={MistakeScreen}
        options={{
          title: '错题',
        }}
      />
      <Tab.Screen
        name="Study"
        component={StudyScreen}
        options={{
          title: '学习',
        }}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{
          title: '报告',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: '我的',
        }}
      />
    </Tab.Navigator>
  );
};

// 主应用组件
const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <NavigationIndependentTree>
        <NavigationContainer>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={theme.colors.background}
          />
          <Stack.Navigator
            initialRouteName="Main"
            screenOptions={{
              headerStyle: {
                backgroundColor: theme.colors.background,
                elevation: 0,
                shadowOpacity: 0,
              },
              headerTintColor: theme.colors.text,
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
            }}
          >
            <Stack.Screen
              name="Main"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MistakeDetail"
              component={MistakeDetailScreen}
              options={{ title: '错题详情' }}
            />
            <Stack.Screen
              name="StudyDetail"
              component={StudyDetailScreen}
              options={{ title: '学习详情' }}
            />
            <Stack.Screen
              name="ReportDetail"
              component={ReportDetailScreen}
              options={{ title: '报告详情' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </NavigationIndependentTree>
    </ThemeProvider>
  );
};

export default App;