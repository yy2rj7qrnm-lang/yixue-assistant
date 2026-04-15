import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

// 导入API服务
import { api } from '../services/api';

// 类型定义
interface Recommendation {
  id: string;
  type: 'question' | 'knowledge' | 'review';
  targetId: string;
  priority: number;
  reason: string;
}

interface LearningPlan {
  dailyGoals: string[];
  weeklyGoals: string[];
  suggestedTopics: string[];
  estimatedDuration: string;
}

const StudyScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [learningPlan, setLearningPlan] = useState<LearningPlan>({
    dailyGoals: [],
    weeklyGoals: [],
    suggestedTopics: [],
    estimatedDuration: '7天',
  });
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // 获取学习推荐
  const fetchRecommendations = async () => {
    try {
      const response = await api.get('/recommendations');
      if (response.data.success) {
        setRecommendations(response.data.data);
      }
    } catch (error) {
      console.error('获取学习推荐失败:', error);
    }
  };

  // 获取学习计划
  const fetchLearningPlan = async () => {
    try {
      const response = await api.post('/ai/generate-learning-plan');
      if (response.data.success) {
        setLearningPlan(response.data.data);
      }
    } catch (error) {
      console.error('获取学习计划失败:', error);
    }
  };

  // 生成AI推荐
  const generateAIRecommendations = async () => {
    try {
      const response = await api.post('/ai/generate-recommendations');
      if (response.data.success) {
        setRecommendations(response.data.data);
        Alert.alert('成功', 'AI学习推荐已生成');
      }
    } catch (error) {
      console.error('生成推荐失败:', error);
      Alert.alert('错误', '生成推荐失败，请稍后重试');
    }
  };

  // AI问答
  const handleAISubmit = async () => {
    if (!aiMessage.trim()) return;

    setAiLoading(true);
    try {
      const response = await api.post('/ai/ask-question', {
        question: aiMessage,
      });
      if (response.data.success) {
        setAiResponse(response.data.data.answer);
      }
    } catch (error) {
      console.error('AI问答失败:', error);
      Alert.alert('错误', 'AI回答失败，请稍后重试');
    } finally {
      setAiLoading(false);
    }
  };

  // 导航到推荐内容
  const navigateToRecommendation = (rec: Recommendation) => {
    switch (rec.type) {
      case 'question':
        navigation.navigate('QuestionDetail', { questionId: rec.targetId });
        break;
      case 'knowledge':
        navigation.navigate('KnowledgeDetail', { knowledgeId: rec.targetId });
        break;
      case 'review':
        navigation.navigate('MistakeDetail', { mistakeId: rec.targetId });
        break;
    }
  };

  // 开始学习
  const startStudy = (goal: string) => {
    Alert.alert('开始学习', `确定要开始学习"${goal}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '开始',
        onPress: () => navigation.navigate('StudySession', { goal }),
      },
    ]);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchRecommendations(),
        fetchLearningPlan(),
      ]);
      setLoading(false);
    };

    loadInitialData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* AI助手按钮 */}
      <TouchableOpacity
        style={styles.aiAssistantButton}
        onPress={() => setShowAIChat(true)}
      >
        <Icon name="psychology" size={24} color="#FFFFFF" />
        <Text style={styles.aiAssistantText}>AI助手</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 学习进度卡片 */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>今日学习进度</Text>
            <TouchableOpacity onPress={generateAIRecommendations}>
              <Icon name="refresh" size={24} color="#4F46E5" />
            </TouchableOpacity>
          </View>
          <View style={styles.progressStats}>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>60</Text>
              <Text style={styles.progressLabel}>分钟</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>8</Text>
              <Text style={styles.progressLabel}>题目</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>2</Text>
              <Text style={styles.progressLabel}>错题</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '60%' }]} />
          </View>
          <Text style={styles.progressText}>今日目标完成度: 60%</Text>
        </View>

        {/* 今日学习计划 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>今日学习计划</Text>
          {learningPlan.dailyGoals.map((goal, index) => (
            <TouchableOpacity
              key={index}
              style={styles.goalItem}
              onPress={() => startStudy(goal)}
            >
              <View style={styles.goalCheckbox}>
                <Icon name="check-box-outline-blank" size={24} color="#9CA3AF" />
              </View>
              <Text style={styles.goalText}>{goal}</Text>
              <Icon name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* AI学习推荐 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>AI学习推荐</Text>
            <Text style={styles.cardSubtitle}>根据您的学习情况智能生成</Text>
          </View>
          {recommendations.length === 0 ? (
            <View style={styles.emptyRecommendation}>
              <Icon name="auto-awesome" size={48} color="#9CA3AF" />
              <Text style={styles.emptyRecommendationText}>
                点击刷新生成个性化推荐
              </Text>
              <TouchableOpacity
                style={styles.generateButton}
                onPress={generateAIRecommendations}
              >
                <Text style={styles.generateButtonText}>生成推荐</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recommendations.slice(0, 5).map((rec) => (
              <TouchableOpacity
                key={rec.id}
                style={styles.recommendationItem}
                onPress={() => navigateToRecommendation(rec)}
              >
                <View style={styles.recommendationIcon}>
                  <Icon
                    name={
                      rec.type === 'question'
                        ? 'quiz'
                        : rec.type === 'knowledge'
                        ? 'school'
                        : 'assignment'
                    }
                    size={24}
                    color="#4F46E5"
                  />
                </View>
                <View style={styles.recommendationContent}>
                  <Text style={styles.recommendationTitle}>{rec.reason}</Text>
                  <View style={styles.recommendationMeta}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(rec.priority) }]}>
                      <Text style={styles.priorityText}>优先级 {rec.priority}</Text>
                    </View>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* 建议学习主题 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>建议学习主题</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicsContainer}
          >
            {learningPlan.suggestedTopics.map((topic, index) => (
              <TouchableOpacity
                key={index}
                style={styles.topicChip}
                onPress={() => startStudy(topic)}
              >
                <Text style={styles.topicText}>{topic}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 学习统计 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>本周学习统计</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>3.5小时</Text>
              <Text style={styles.statLabel}>学习时长</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>45题</Text>
              <Text style={styles.statLabel}>完成题目</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>8题</Text>
              <Text style={styles.statLabel}>错题回顾</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>92%</Text>
              <Text style={styles.statLabel}>正确率</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* AI聊天对话框 */}
      <Modal
        visible={showAIChat}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAIChat(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI学习助手</Text>
              <TouchableOpacity onPress={() => setShowAIChat(false)}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.chatContainer}>
              <Text style={styles.chatMessage}>
                你好！我是你的AI学习助手，有什么问题可以问我？
              </Text>
              {aiResponse && (
                <View style={styles.responseMessage}>
                  <Text style={styles.responseText}>{aiResponse}</Text>
                </View>
              )}
            </View>

            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="输入你的问题..."
                value={aiMessage}
                onChangeText={setAiMessage}
                multiline={true}
                numberOfLines={4}
              />
              <TouchableOpacity
                style={[styles.sendButton, !aiMessage.trim() && styles.sendButtonDisabled]}
                onPress={handleAISubmit}
                disabled={!aiMessage.trim() || aiLoading}
              >
                {aiLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Icon name="send" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// 辅助函数
function getPriorityColor(priority: number) {
  if (priority >= 8) return '#FEF2F2';
  if (priority >= 5) return '#FFFBEB';
  return '#F0FDF4';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  aiAssistantButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  aiAssistantText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  goalCheckbox: {
    marginRight: 12,
  },
  goalText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  emptyRecommendation: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyRecommendationText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
  },
  recommendationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 12,
    color: '#374151',
  },
  topicsContainer: {
    gap: 8,
  },
  topicChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  topicText: {
    fontSize: 14,
    color: '#374151',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  chatContainer: {
    flex: 1,
    padding: 20,
  },
  chatMessage: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    color: '#1F2937',
  },
  responseMessage: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  responseText: {
    color: '#1F2937',
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'flex-end',
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#F9FAFB',
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
});

export default StudyScreen;