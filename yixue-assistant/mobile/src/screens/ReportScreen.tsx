import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

// 导入服务和组件
import { getReports, generateReport as generateStudyReport, getStatistics, StudyReport } from '../services/studyService';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { useApp } from '../contexts/AppContext';

const { width } = Dimensions.get('window');

interface Statistics {
  totalQuestions: number;
  totalMistakes: number;
  solvedMistakes: number;
  correctRate: number;
  studyStreak: number;
  weeklyStudyHours: number;
  subjectDistribution: Record<string, number>;
  difficultyDistribution: Record<string, number>;
}

const ReportScreen = () => {
  const navigation = useNavigation();
  const { showNotification } = useApp();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [reports, setReports] = useState<StudyReport[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalQuestions: 0,
    totalMistakes: 0,
    solvedMistakes: 0,
    correctRate: 0,
    studyStreak: 0,
    weeklyStudyHours: 0,
    subjectDistribution: {},
    difficultyDistribution: {},
  });

  // 获取报告列表
  const fetchReports = async () => {
    try {
      const response = await getReports({ reportType: selectedPeriod });
      setReports(response.data || []);
    } catch (error: any) {
      showNotification('error', '获取报告失败');
      console.error('获取报告失败:', error);
    }
  };

  // 获取统计数据
  const fetchStatistics = async () => {
    try {
      const stats = await getStatistics();
      setStatistics(stats);
    } catch (error: any) {
      showNotification('error', '获取统计数据失败');
      console.error('获取统计数据失败:', error);
    }
  };

  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchReports(), fetchStatistics()]);
    setRefreshing(false);
  };

  // 生成新报告
  const handleGenerateReport = async () => {
    try {
      await generateStudyReport(selectedPeriod);
      showNotification('success', '报告生成成功');
      fetchReports();
    } catch (error: any) {
      showNotification('error', '生成报告失败');
      console.error('生成报告失败:', error);
    }
  };

  // 导航到报告详情
  const navigateToDetail = (reportId: string) => {
    navigation.navigate('ReportDetail', { reportId });
  };

  // 分享报告
  const shareReport = (report: StudyReport) => {
    Alert.alert('分享报告', `分享 ${report.reportType === 'daily' ? '日报' : report.reportType === 'weekly' ? '周报' : '月报'} 功能开发中...`);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchReports(), fetchStatistics()]);
      setLoading(false);
    };

    loadInitialData();
  }, [selectedPeriod]);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 格式化时间
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
  };

  // 获取正确率颜色
  const getCorrectRateColor = (rate: number) => {
    if (rate >= 90) return '#10B981';
    if (rate >= 70) return '#F59E0B';
    return '#EF4444';
  };

  // 获取科目名称
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

  return (
    <View style={styles.container}>
      <Header title="学习报告" />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 顶部统计卡片 */}
        <Card className="mb-4">
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>学习概况</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
                <Icon name="school" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>{statistics.totalQuestions}</Text>
              <Text style={styles.statLabel}>总题数</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#FEF2F2' }]}>
                <Icon name="error" size={24} color="#EF4444" />
              </View>
              <Text style={styles.statValue}>{statistics.totalMistakes}</Text>
              <Text style={styles.statLabel}>错题数</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
                <Icon name="check-circle" size={24} color="#10B981" />
              </View>
              <Text style={styles.statValue}>{statistics.correctRate}%</Text>
              <Text style={styles.statLabel}>正确率</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#FFFBEB' }]}>
                <Icon name="local-fire-department" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>{statistics.studyStreak}</Text>
              <Text style={styles.statLabel}>连续天数</Text>
            </View>
          </View>
        </Card>

        {/* 周期选择器 */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'daily' && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod('daily')}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'daily' && styles.periodButtonTextActive,
              ]}
            >
              日报
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'weekly' && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod('weekly')}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'weekly' && styles.periodButtonTextActive,
              ]}
            >
              周报
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'monthly' && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod('monthly')}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'monthly' && styles.periodButtonTextActive,
              ]}
            >
              月报
            </Text>
          </TouchableOpacity>
        </View>

        {/* 报告列表 */}
        <View style={styles.reportsHeader}>
          <Text style={styles.reportsTitle}>学习报告</Text>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateReport}
          >
            <Icon name="add" size={20} color="#FFFFFF" />
            <Text style={styles.generateButtonText}>生成</Text>
          </TouchableOpacity>
        </View>

        {reports.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="assessment" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>暂无学习报告</Text>
            <Text style={styles.emptyStateSubText}>
              开始学习后即可生成报告
            </Text>
          </View>
        ) : (
          reports.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              onPress={() => navigateToDetail(report.id)}
            >
              <View style={styles.reportHeader}>
                <View style={styles.reportPeriod}>
                  <Text style={styles.reportPeriodText}>
                    {report.reportType === 'daily' ? '日报' : report.reportType === 'weekly' ? '周报' : '月报'}
                  </Text>
                  <Text style={styles.reportDate}>
                    {formatDate(report.startDate)} - {formatDate(report.endDate)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => shareReport(report)}
                >
                  <Icon name="share" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.reportStats}>
                <View style={styles.reportStatItem}>
                  <Text style={styles.reportStatLabel}>错题</Text>
                  <Text style={styles.reportStatValue}>
                    {report.stats.mistakesSolved || 0}
                  </Text>
                </View>
                <View style={styles.reportStatItem}>
                  <Text style={styles.reportStatLabel}>做题</Text>
                  <Text style={styles.reportStatValue}>
                    {report.stats.questionsAttempted || 0}
                  </Text>
                </View>
                <View style={styles.reportStatItem}>
                  <Text style={styles.reportStatLabel}>正确率</Text>
                  <Text style={[styles.reportStatValue, { color: getCorrectRateColor(report.stats.correctRate) }]}>
                    {report.stats.correctRate.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.reportStatItem}>
                  <Text style={styles.reportStatLabel}>学习时长</Text>
                  <Text style={styles.reportStatValue}>
                    {formatTime(report.stats.studyTime)}
                  </Text>
                </View>
              </View>

              <View style={styles.recommendationsSection}>
                <Text style={styles.recommendationsTitle}>AI 建议 ({report.recommendations?.length || 0})</Text>
                {report.recommendations && report.recommendations.length > 0 && (
                  <View style={styles.recommendationsList}>
                    {report.recommendations.slice(0, 2).map((rec, index) => (
                      <View key={index} style={styles.recommendationItem}>
                        <Icon name="lightbulb" size={16} color="#F59E0B" />
                        <Text style={styles.recommendationText} numberOfLines={1}>
                          {rec.reason}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* 科目分布 */}
        {Object.keys(statistics.subjectDistribution).length > 0 && (
          <Card className="mt-4 mb-4">
            <Text style={styles.cardTitle}>科目分布</Text>
            <View style={styles.subjectDistribution}>
              {Object.entries(statistics.subjectDistribution).map(([subject, count]) => (
                <View key={subject} style={styles.subjectItem}>
                  <View style={[styles.subjectDot, { backgroundColor: subject === 'MATH' ? '#3B82F6' : subject === 'PHYSICS' ? '#10B981' : '#EF4444' }]} />
                  <Text style={styles.subjectLabel}>{getSubjectName(subject)}</Text>
                  <Text style={styles.subjectCount}>{count}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* 难度分布 */}
        {Object.keys(statistics.difficultyDistribution).length > 0 && (
          <Card className="mb-4">
            <Text style={styles.cardTitle}>难度分布</Text>
            <View style={styles.difficultyDistribution}>
              {Object.entries(statistics.difficultyDistribution).map(([difficulty, count]) => (
                <View key={difficulty} style={styles.difficultyItem}>
                  <Text style={styles.difficultyLabel}>
                    {difficulty === 'EASY' ? '简单' : difficulty === 'MEDIUM' ? '中等' : '困难'}
                  </Text>
                  <Text style={styles.difficultyCount}>{count}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}
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
  content: {
    flex: 1,
    padding: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  periodButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  periodButtonActive: {
    backgroundColor: '#4F46E5',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reportsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportPeriod: {
    flex: 1,
  },
  reportPeriodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  reportDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  shareButton: {
    padding: 8,
  },
  reportStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  reportStatItem: {
    alignItems: 'center',
  },
  reportStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  reportStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  recommendationsSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  subjectDistribution: {
    gap: 8,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subjectLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  subjectCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  difficultyDistribution: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  difficultyItem: {
    alignItems: 'center',
  },
  difficultyLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  difficultyCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default ReportScreen;
