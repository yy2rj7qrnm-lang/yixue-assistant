import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

// 导入API服务
import { api } from '../services/api';

// 类型定义
interface Mistake {
  id: string;
  questionText: string;
  correctAnswer: string;
  analysis?: string;
  subject: string;
  grade: string;
  questionType: string;
  difficulty: string;
  isSolved: boolean;
  createdAt: string;
  reviewCount: number;
}

interface MistakeStats {
  total: number;
  solved: number;
  unsolved: number;
  bySubject: Record<string, number>;
  byDifficulty: Record<string, number>;
}

const MistakeScreen = () => {
  const navigation = useNavigation();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [stats, setStats] = useState<MistakeStats>({
    total: 0,
    solved: 0,
    unsolved: 0,
    bySubject: {},
    byDifficulty: {},
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 获取错题列表
  const fetchMistakes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/mistakes');
      if (response.data.success) {
        setMistakes(response.data.data);
      }
    } catch (error) {
      console.error('获取错题失败:', error);
      Alert.alert('错误', '获取错题列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取错题统计
  const fetchStats = async () => {
    try {
      const response = await api.get('/mistakes/analyze/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchMistakes(), fetchStats()]);
    setRefreshing(false);
  };

  // 标记错题为已解决
  const markAsSolved = async (id: string) => {
    try {
      const response = await api.post(`/mistakes/${id}/review`, {
        mastery: 100,
      });
      if (response.data.success) {
        fetchMistakes(); // 刷新列表
        fetchStats(); // 刷新统计
        Alert.alert('成功', '错题已标记为已解决');
      }
    } catch (error) {
      console.error('标记失败:', error);
      Alert.alert('错误', '标记失败，请重试');
    }
  };

  // 删除错题
  const deleteMistake = async (id: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这道错题吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/mistakes/${id}`);
              if (response.data.success) {
                fetchMistakes(); // 刷新列表
                fetchStats(); // 刷新统计
                Alert.alert('成功', '错题已删除');
              }
            } catch (error) {
              console.error('删除失败:', error);
              Alert.alert('错误', '删除失败，请重试');
            }
          },
        },
      ]
    );
  };

  // 导航到错题详情
  const navigateToDetail = (mistake: Mistake) => {
    navigation.navigate('MistakeDetail', { mistakeId: mistake.id });
  };

  // 拍照识别错题
  const captureMistake = () => {
    navigation.navigate('OCRScan');
  };

  useEffect(() => {
    fetchMistakes();
    fetchStats();
  }, []);

  // 学科颜色映射
  const getSubjectColor = (subject: string) => {
    const colors = {
      MATH: '#EF4444',
      CHINESE: '#3B82F6',
      ENGLISH: '#10B981',
      PHYSICS: '#8B5CF6',
      CHEMISTRY: '#F59E0B',
      BIOLOGY: '#EC4899',
    };
    return colors[subject as keyof typeof colors] || '#6B7280';
  };

  // 难度颜色映射
  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      EASY: '#10B981',
      MEDIUM: '#F59E0B',
      HARD: '#EF4444',
    };
    return colors[difficulty as keyof typeof colors] || '#6B7280';
  };

  // 日期格式化
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <View style={styles.container}>
      {/* 顶部统计卡片 */}
      <View style={styles.statsContainer}>
        <View style={stats.card}>
          <Text style={stats.title}>错题统计</Text>
          <View style={stats.statsRow}>
            <View style={stats.statItem}>
              <Text style={stats.statNumber}>{stats.total}</Text>
              <Text style={stats.statLabel}>总错题</Text>
            </View>
            <View style={stats.statItem}>
              <Text style={stats.statNumber}>{stats.solved}</Text>
              <Text style={stats.statLabel}>已解决</Text>
            </View>
            <View style={stats.statItem}>
              <Text style={stats.statNumber}>{stats.unsolved}</Text>
              <Text style={stats.statLabel}>待解决</Text>
            </View>
          </View>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>全部</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>未解决</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>已解决</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 拍照按钮 */}
      <TouchableOpacity
        style={styles.captureButton}
        onPress={captureMistake}
      >
        <Icon name="add-a-photo" size={24} color="#FFFFFF" />
        <Text style={styles.captureButtonText}>拍照识别错题</Text>
      </TouchableOpacity>

      {/* 错题列表 */}
      <ScrollView
        style={styles.mistakesList}
        contentContainerStyle={styles.mistakesListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator
            style={styles.loading}
            size="large"
            color="#4F46E5"
          />
        ) : mistakes.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="assignment-late" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>暂无错题</Text>
            <Text style={styles.emptyStateSubText}>
              拍照识别您的第一道错题
            </Text>
          </View>
        ) : (
          mistakes.map((mistake) => (
            <View
              key={mistake.id}
              style={[
                styles.mistakeCard,
                mistake.isSolved && styles.solvedCard,
              ]}
            >
              <View style={styles.mistakeHeader}>
                <View style={styles.subjectBadge}>
                  <Text
                    style={[
                      styles.subjectText,
                      { color: getSubjectColor(mistake.subject) },
                    ]}
                  >
                    {getSubjectLabel(mistake.subject)}
                  </Text>
                </View>
                <View style={styles.difficultyBadge}>
                  <Text
                    style={[
                      styles.difficultyText,
                      { color: getDifficultyColor(mistake.difficulty) },
                    ]}
                  >
                    {getDifficultyLabel(mistake.difficulty)}
                  </Text>
                </View>
                {mistake.isSolved && (
                  <Icon name="check-circle" size={20} color="#10B981" />
                )}
              </View>

              <Text style={styles.mistakeQuestion} numberOfLines={3}>
                {mistake.questionText}
              </Text>

              <View style={styles.mistakeActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigateToDetail(mistake)}
                >
                  <Icon namevisibility" size={16} color="#4F46E5" />
                  <Text style={styles.actionButtonText}>查看</Text>
                </TouchableOpacity>
                {!mistake.isSolved && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.solveButton]}
                    onPress={() => markAsSolved(mistake.id)}
                  >
                    <Icon name="done" size={16} color="#FFFFFF" />
                    <Text style={styles.solveButtonText}>解决</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deleteMistake(mistake.id)}
                >
                  <Icon name="delete" size={16} color="#EF4444" />
                  <Text style={styles.deleteButtonText}>删除</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.mistakeFooter}>
                <Text style={styles.mistakeDate}>
                  {formatDate(mistake.createdAt)}
                </Text>
                <Text style={styles.reviewCount}>
                  复习 {mistake.reviewCount} 次
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

// 辅助函数
function getSubjectLabel(subject: string) {
  const labels = {
    MATH: '数学',
    CHINESE: '语文',
    ENGLISH: '英语',
    PHYSICS: '物理',
    CHEMISTRY: '化学',
    BIOLOGY: '生物',
  };
  return labels[subject as keyof typeof labels] || subject;
}

function getDifficultyLabel(difficulty: string) {
  const labels = {
    EASY: '简单',
    MEDIUM: '中等',
    HARD: '困难',
  };
  return labels[difficulty as keyof typeof labels] || difficulty;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterText: {
    fontSize: 14,
    color: '#374151',
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  captureButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  mistakesList: {
    flex: 1,
  },
  mistakesListContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  loading: {
    marginTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  mistakeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  solvedCard: {
    opacity: 0.7,
    backgroundColor: '#F9FAFB',
  },
  mistakeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mistakeQuestion: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 12,
  },
  mistakeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  solveButton: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  solveButtonText: {
    color: '#FFFFFF',
  },
  deleteButton: {
    borderColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#EF4444',
  },
  mistakeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mistakeDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reviewCount: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default MistakeScreen;