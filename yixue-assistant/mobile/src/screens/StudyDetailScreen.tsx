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

import { getQuestionDetail, submitAnswer, Question } from '../services/studyService';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useApp } from '../contexts/AppContext';

const { width } = Dimensions.get('window') };

export const StudyDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { showNotification } = useApp();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  const questionId = route.params?.questionId;

  useEffect(() => {
    loadQuestionDetail();
  }, [questionId]);

  const loadQuestionDetail = async () => {
    if (!questionId) {
      showNotification('error', '题目ID不存在');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const data = await getQuestionDetail(questionId);
      setQuestion(data);
    } catch (error: any) {
      showNotification('error', '加载题目详情失败');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!question) return;

    if (!selectedAnswer) {
      showNotification('warning', '请选择答案');
      return;
    }

    try {
      setSubmitting(true);
      const response = await submitAnswer(questionId, selectedAnswer, 60);
      setResult(response);
      setShowResult(true);
      showNotification(
        response.isCorrect ? 'success' : 'info',
        response.isCorrect ? '回答正确！' : '回答错误'
      );
    } catch (error: any) {
      showNotification('error', '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    // 这里可以实现下一题逻辑
    navigation.goBack();
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (!question) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>题目不存在</Text>
      </View>
    );
  }

  const isOptionQuestion = question.options && question.options.length > 0;

  return (
    <View style={styles.container}>
      <Header title="练习详情" />

      <ScrollView style={styles.content}>
        {/* 科目和难度标签 */}
        <View style={styles.tagsContainer}>
          <View style={[styles.tag, { backgroundColor: `${getSubjectColor(question.subject)}20` }]}>
            <Text style={[styles.tagText, { color: getSubjectColor(question.subject) }]}>
              {getSubjectName(question.subject)}
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: `${getDifficultyColor(question.difficulty)}20` }]}>
            <Text style={[styles.tagText, { color: getDifficultyColor(question.difficulty) }]}>
              {getDifficultyLabel(question.difficulty)}
            </Text>
          </View>
        </View>

        {/* 题目内容 */}
        <Card className="mb-4">
          <View style={styles.questionHeader}>
            <Icon name="help-outline" size={20} color="#6B7280" />
            <Text style={styles.questionType}>{question.questionType}</Text>
          </View>
          <Text style={styles.questionText}>{question.content}</Text>
        </Card>

        {/* 知识点 */}
        {question.knowledgePoints && question.knowledgePoints.length > 0 && (
          <Card className="mb-4">
            <View style={styles.sectionHeader}>
              <Icon name="school" size={20} color="#6B7280" />
              <Text style={styles.sectionTitle}>知识点</Text>
            </View>
            <View style={styles.knowledgePoints}>
              {question.knowledgePoints.map((point, index) => (
                <View key={index} style={styles.knowledgePoint}>
                  <View style={styles.knowledgePointDot} />
                  <Text style={styles.knowledgePointText}>{point}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* 答案选项 */}
        {!showResult && isOptionQuestion && (
          <Card className="mb-4">
            <View style={styles.sectionHeader}>
              <Icon name="radio-button-checked" size={20} color="#6B7280" />
              <Text style={styles.sectionTitle}>选择答案</Text>
            </View>
            <View style={styles.options}>
              {question.options!.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.option,
                    selectedAnswer === option && styles.selectedOption,
                  ]}
                  onPress={() => setSelectedAnswer(option)}
                >
                  <View style={[styles.optionIndicator, selectedAnswer === option && styles.selectedOptionIndicator]} />
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* 答案输入框 */}
        {!showResult && !isOptionQuestion && (
          <Card className="mb-4">
            <View style={styles.sectionHeader}>
              <Icon name="edit" size={20} color="#6B7280" />
              <Text style={styles.sectionTitle}>输入答案</Text>
            </View>
            <TouchableOpacity
              style={styles.answerInput}
              onPress={() => {
                showNotification('info', '答案输入功能开发中');
              }}
            >
              <Text style={styles.answerInputText}>
                {selectedAnswer || '点击输入答案...'}
              </Text>
              <Icon name="keyboard-arrow-right" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </Card>
        )}

        {/* 结果展示 */}
        {showResult && result && (
          <>
            {/* 答案结果 */}
            <Card className="mb-4">
              <View style={[styles.resultHeader, { backgroundColor: result.isCorrect ? '#D1FAE5' : '#FEE2E2' }]}>
                <Icon
                  name={result.isCorrect ? 'check-circle' : 'cancel'}
                  size={32}
                  color={result.isCorrect ? '#10B981' : '#EF4444'}
                />
                <Text style={[styles.resultTitle, { color: result.isCorrect ? '#10B981' : '#EF4444' }]}>
                  {result.isCorrect ? '回答正确！' : '回答错误'}
                </Text>
              </View>

              <View style={styles.answerComparison}>
                <View style={styles.answerItem}>
                  <Text style={styles.answerLabel}>你的答案</Text>
                  <Text style={styles.answerValue}>{result.attempt.answer}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.answerItem}>
                  <Text style={styles.answerLabel}>正确答案</Text>
                  <Text style={[styles.answerValue, styles.correctAnswerValue]}>{result.correctAnswer}</Text>
                </View>
              </View>
            </Card>

            {/* 解析 */}
            {result.analysis && (
              <Card className="mb-4">
                <View style={styles.sectionHeader}>
                  <Icon name="lightbulb-outline" size={20} color="#F59E0B" />
                  <Text style={styles.sectionTitle}>题目解析</Text>
                </View>
                <Text style={styles.analysis}>{result.analysis}</Text>
              </Card>
            )}
          </>
        )}

        {/* 操作按钮 */}
        <View style={styles.actions}>
          {!showResult ? (
            <Button
              title="提交答案"
              onPress={handleSubmit}
              loading={submitting}
              type="primary"
              disabled={!selectedAnswer}
              className="flex-1"
            />
          ) : (
            <Button
              title="下一题"
              onPress={handleNext}
              type="primary"
              className="flex-1"
            />
          )}
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
  knowledgePoints: {
    gap: 8,
  },
  knowledgePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  knowledgePointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B7280',
  },
  knowledgePointText: {
    fontSize: 14,
    color: '#374151',
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  optionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
  },
  selectedOptionIndicator: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  answerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  answerInputText: {
    fontSize: 15,
    color: '#6B7280',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  answerComparison: {
    gap: 16,
  },
  answerItem: {
    gap: 4,
  },
  answerLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  answerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  correctAnswerValue: {
    color: '#10B981',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  analysis: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  actions: {
    marginTop: 16,
  },
});

export default StudyDetailScreen;
