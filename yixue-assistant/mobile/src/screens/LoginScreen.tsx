import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

// API配置
const API_BASE_URL = 'http://localhost:8000/api';

interface LoginData {
  email: string;
  password: string;
}

const LoginScreen = () => {
  const navigation = useNavigation();
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: keyof LoginData, value: string) => {
    setLoginData({ ...loginData, [field]: value });
  };

  const handleLogin = async () => {
    // 验证输入
    if (!loginData.email || !loginData.password) {
      Alert.alert('提示', '请填写完整的登录信息');
      return;
    }

    if (!loginData.email.includes('@')) {
      Alert.alert('提示', '请输入有效的邮箱地址');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 保存token到本地存储
        // AsyncStorage.setItem('auth_token', result.data.token);
        // AsyncStorage.setItem('user_info', JSON.stringify(result.data.user));

        Alert.alert('成功', '登录成功！', [
          {
            text: '确定',
            onPress: () => navigation.navigate('Main'),
          },
        ]);
      } else {
        Alert.alert('登录失败', result.message || '请检查用户名和密码');
      }
    } catch (error) {
      console.error('登录错误:', error);
      Alert.alert('网络错误', '请检查网络连接后重试');
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Logo和标题 */}
        <View style={styles.header}>
          <Icon name="school" size={80} color="#4F46E5" />
          <Text style={styles.title}>意学助手</Text>
          <Text style={styles.subtitle}>AI赋能个性化学习</Text>
        </View>

        {/* 登录表单 */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Icon name="email" size={24} color="#6B7280" />
            <TextInput
              style={styles.input}
              placeholder="请输入邮箱"
              value={loginData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={24} color="#6B7280" />
            <TextInput
              style={styles.input}
              placeholder="请输入密码"
              value={loginData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
            >
              <Icon
                name={showPassword ? 'visibility-off' : 'visibility'}
                size={24}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          {/* 登录按钮 */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>登录</Text>
            )}
          </TouchableOpacity>

          {/* 注册链接 */}
          <View style={styles.registerLink}>
            <Text style={styles.registerText}>还没有账号？</Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text style={styles.registerButton}>立即注册</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 底部提示 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            登录即表示同意《用户协议》和《隐私政策》
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  passwordToggle: {
    padding: 8,
  },
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: '#6B7280',
    fontSize: 16,
  },
  registerButton: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LoginScreen;