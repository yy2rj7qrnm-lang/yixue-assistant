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

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  grade: string;
  subject: string;
}

const grades = ['七年级', '八年级', '九年级', '高一', '高二', '高三'];
const subjects = ['数学', '语文', '英语', '物理', '化学', '生物'];

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [registerData, setRegisterData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    grade: '',
    subject: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    setRegisterData({ ...registerData, [field]: value });
  };

  const handleRegister = async () => {
    // 验证输入
    if (!registerData.name || !registerData.email || !registerData.password) {
      Alert.alert('提示', '请填写完整的注册信息');
      return;
    }

    if (!registerData.email.includes('@')) {
      Alert.alert('提示', '请输入有效的邮箱地址');
      return;
    }

    if (registerData.password.length < 6) {
      Alert.alert('提示', '密码长度至少为6位');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return;
    }

    if (!registerData.grade || !registerData.subject) {
      Alert.alert('提示', '请选择年级和科目');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...userData } = registerData;
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Alert.alert('注册成功', '账号创建成功，请登录', [
          {
            text: '确定',
            onPress: () => navigation.navigate('Login'),
          },
        ]);
      } else {
        Alert.alert('注册失败', result.message || '注册失败，请稍后重试');
      }
    } catch (error) {
      console.error('注册错误:', error);
      Alert.alert('网络错误', '请检查网络连接后重试');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
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
          <Text style={styles.title}>注册意学助手</Text>
          <Text style={styles.subtitle}>开启您的AI学习之旅</Text>
        </View>

        {/* 注册表单 */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Icon name="person" size={24} color="#6B7280" />
            <TextInput
              style={styles.input}
              placeholder="请输入姓名"
              value={registerData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="email" size={24} color="#6B7280" />
            <TextInput
              style={styles.input}
              placeholder="请输入邮箱"
              value={registerData.email}
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
              value={registerData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={24} color="#6B7280" />
            <TextInput
              style={styles.input}
              placeholder="请确认密码"
              value={registerData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* 年级选择 */}
          <View style={styles.pickerContainer}>
            <Icon name="school" size={24} color="#6B7280" />
            <TextInput
              style={[styles.input, styles.pickerInput]}
              placeholder="请选择年级"
              value={registerData.grade}
              onChangeText={(value) => handleInputChange('grade', value)}
              editable={false}
              onPressIn={() => {
                // 这里应该打开一个picker组件
                Alert.alert('选择年级', grades.join('\n'), [
                  ...grades.map(grade => ({
                    text: grade,
                    onPress: () => handleInputChange('grade', grade),
                  })),
                  { text: '取消', style: 'cancel' },
                ]);
              }}
            />
          </View>

          {/* 科目选择 */}
          <View style={styles.pickerContainer}>
            <Icon name="menu-book" size={24} color="#6B7280" />
            <TextInput
              style={[styles.input, styles.pickerInput]}
              placeholder="请选择科目"
              value={registerData.subject}
              onChangeText={(value) => handleInputChange('subject', value)}
              editable={false}
              onPressIn={() => {
                // 这里应该打开一个picker组件
                Alert.alert('选择科目', subjects.join('\n'), [
                  ...subjects.map(subject => ({
                    text: subject,
                    onPress: () => handleInputChange('subject', subject),
                  })),
                  { text: '取消', style: 'cancel' },
                ]);
              }}
            />
          </View>

          {/* 注册按钮 */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>注册</Text>
            )}
          </TouchableOpacity>

          {/* 登录链接 */}
          <View style={styles.loginLink}>
            <Text style={styles.loginText}>已有账号？</Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.loginButton}>立即登录</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 用户协议 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            注册即表示您同意《用户协议》和《隐私政策》
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
  pickerContainer: {
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
  pickerInput: {
    color: '#6B7280',
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
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#6B7280',
    fontSize: 16,
  },
  loginButton: {
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

export default RegisterScreen;