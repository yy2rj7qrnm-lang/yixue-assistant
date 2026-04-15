import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';

import { getMistakeDetail, reviewMistake, deleteMistake, Mistake } from '../services/mistakeService';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useApp } from '../contexts/AppContext';

const { width } = Dimensions.get('window');

export const MistakeDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { showNotification } = useApp();

  const [mistake, setMistake] = useState<Mistake | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');

  const mistakeId = route.params?.mistakeId;

  useEffect(() => {
    loadMistakeDetail();
  }, [mistakeId]);

  const loadMistakeDetail = async () => {
    if (!mistakeId) {
      showNotification('error', '错题ID不存在');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const data = await getMistakeDetail(mistakeId);
      setMistake(data);
      setUserAnswer(data.answer || '');
    } catch (error: any) {
      showNotification('error', '加载错题详情失败');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!mistake) return;

    try {
      setReviewing(true);
      await reviewMistake(mistake.id, {
        answer: userAnswer,
        timeSpent: 60,
      });
      showNotification('success', '复习完成');
      loadMistakeDetail();
    } catch (error: any) {
      showNotification('error', '复习失败');
    } finally {
      setReviewing(false);
    }
  };

  const handleDelete = () => {
    if (!mistake) return;

    Alert.alert(
      '删除错题',
      '确定要删除这道错题吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMistake(mistake.id);
              showNotification('success', '删除成功');
              navigation.goBack();
            } catch (error: any) {
              showNotification('error', '删除失败');
            }
          },
        },
      ]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return '#10B981';
      case 'MEDIUM':
        return '#F59E0B';
      case 'HARD':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return '简单';
      case 'MEDIUM':
        return '中等';
      case 'HARD':
        return '困难';
      default:
        return difficulty;
    }
  };

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case 'MATH':
        return '#3B82F6';
      case 'PHYSICS':
        return '#10B981';
      case 'CHEMISTRY':
        return '#8B5CF6';
      case 'BIOLOGY':
        return '#EC4899';
      default:
        return '#6B7280';
    }
  };

  const getSubjectName = (subject: string) => {
    const names: Record<string, string> = {
      MATH: '数学',
      PHYSICS: '物理',
      CHEMISTRY: '化学',
      BIOLOGY: '生物',
      ENGLISH: '英语',
      CHINESE: '语文',
    };
    return names[subject] || subject;
  };

  const getMistakeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      calculation_error: '计算错误',
      concept_error: '概念错误',
      method_error: '方法错误',
      careless_error: '粗心错误',
      other_error: '其他错误',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (!mistake) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>错题不存在</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="错题详情" />

      <ScrollView style={styles.content}>
        {/* 科目和难度标签 */}
        <View style={styles.tagsContainer}>
          <View style={[styles.tag, { backgroundColor: `${getSubjectColor(mistake.subject)}20` }]}>
            <Text style={[styles.tagText, { color: getSubjectColor(mistake.subject) }]}>
              {getSubjectName(mistake.subject)}
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: `${getDifficultyColor(mistake.difficulty)}20` }]}>
            <Text style={[styles.tagText, { color: getDifficultyColor(mistake.difficulty) }]}>
              {getDifficultyLabel(mistake.difficulty)}
            </Text>
          </View>
          {mistake.isSolved && (
            <View style={[styles.tag, { backgroundColor: '#10B98120' }]}>
              <Icon name="check-circle" size={14} color="#10B981" />
              <Text style={[styles.tagText, { color: '#10B981', marginLeft: 4 }]}>已解决</Text>
            </View>
          )}
        </View>

        {/* 题目内容 */}
        <Card className="mb-4">
          <View style={styles.questionHeader}>
            <Icon name="help-outline" size={20} color="#6B7280" />
            <Text style={styles.questionType}>{mistake.questionType}</Text>
          </View>
          <Text style={styles.questionText}>{mistake.questionText}</Text>
        </Card>

        {/* 题目图片 */}
        {mistake.questionImage && (
          <Card className="mb-4">
            <Text style={styles.sectionTitle}>题目图片</Text>
            <View style={styles.imagePlaceholder}>
              <Icon name="image" size={48} color="#9CA3AF" />
              <Text style={styles.imagePlaceholderText}>题目图片</Text>
            </View>
          </Card>
        )}

        {/* 你的答案 */}
        <Card className="mb-4">
          <View style={styles.sectionHeader}>
            <Icon name="edit" size={20} color="#6B7280" />
            <Text style={styles.sectionTitle}>你的答案</Text>
          </View>
          <View style={styles.answerBox}>
            <Text style={styles.answerText}>{userAnswer || '未填写'}</Text>
          </View>
        </Card>

        {/* 正确答案 */}
        <Card className="mb-4">
          <View style={styles.sectionHeader}>
            <Icon name="check-circle" size={20} color="#10B981" />
            <Text style={styles.sectionTitle}>正确答案</Text>
          </View>
          <Text style={styles.correctAnswer}>{mistake.correctAnswer}</Text>
        </Card>

        {/* 解析 */}
        <Card className="mb-4">
          <View style={styles.sectionHeader}>
            <Icon name="lightbulb-outline" size={20} color="#F59E0B" />
            <Text style={styles.sectionTitle}>题目解析</Text>
          </View>
          <Text style={styles.analysis}>{mistake.analysis}</Text>
        </Card>

        {/* 知识点 */}
        {mistake.knowledgePoints && mistake.knowledgePoints.length > 0 && (
          <Card className="mb-4">
            <View style={styles.sectionHeader}>
              <Icon name="school" size={20} color="#6B7280" />
              <Text style={styles.sectionTitle}>涉及知识点</Text>
            </View>
            <View style={styles.knowledgePoints}>
              {mistake.knowledgePoints.map((point, index) => (
                <View key={index} style={styles.knowledgePoint}>
                  <Icon name="arrow-right" size={16} color="#6B7280" />
                  <Text style={styles.knowledgePointText}>{point}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* 错误类型 */}
        {mistake.mistakeType && mistake.mistakeType.length > 0 && (
          <Card className="mb-4">
            <View style={styles.sectionHeader}>
              <Icon name="report-problem" size={20} color="#EF4444" />
              <Text style={styles.sectionTitle}>错误类型</Text>
            </View>
            <View style={styles.mistakeTypes}>
              {mistake.mistakeType.map((type, index) => (
                <View key={index} style={styles.mistakeType}>
                  <View style={[styles.mistakeTypeDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.mistakeTypeText}>{getMistakeTypeLabel(type)}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* 复习次数和掌握度 */}
        <Card className="mb-4">
          <View style={styles.sectionHeader}>
            <Icon name="history" size={20} color="#6B7280" />
            <Text style={styles.sectionTitle}>学习记录</Text>
          </View>
          <View style={styles.learningRecord}>
            <View style={styles.recordItem}>
              <Text style={styles.recordLabel}>复习次数</Text>
              <Text style={styles.recordValue}>{mistake.reviewCount} 次</Text>
            </View>
            <View style={styles.recordItem}>
              <Text style={styles.recordLabel}>掌握度</Text>
              <Text style={[styles.recordValue, { color: mistake.mastery > 70 ? '#10B981' : mistake.mastery > 40 ? '#F59E0B' : '#EF4444' }]}>
                {mistake.mastery}%
              </Text>
            </View>
          </View>
          {mistake.mastery > 0 && (
            <View style={styles.masteryBar}>
              <View style={[styles.masteryProgress, { width: `${mistake.mastery}%` }]} />
            </View>
          )}
        </Card>

        {/* 操作按钮 */}
        <View style={styles.actions}>
          <Button
            title="复习"
            onPress={handleReview}
            loading={reviewing}
            type="primary"
            className="flex-1 mr-2"
          />
          <Button
            title="删除"
            onPress={handleDelete}
            type="danger"
            className="flex-1 ml-2"
          />
        </View>
      </ScrollView>
    </View>
  );
};

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionType: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  answerBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  answerText: {
    fontSize: 14,
    color: '#374151',
  },
  correctAnswer: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  analysis: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  knowledgePoints: {
    gap: 8,
  },
  knowledgePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  knowledgePointText: {
    fontSize: 14,
    color: '#374151',
  },
  mistakeTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mistakeType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mistakeTypeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mistakeTypeText: {
    fontSize: 14,
    color: '#374151',
  },
  learningRecord: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  recordItem: {
    alignItems: 'center',
  },
  recordLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  recordValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  masteryBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  masteryProgress: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
});

export default MistakeDetailScreen;
