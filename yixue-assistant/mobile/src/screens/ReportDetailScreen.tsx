import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';

import { getReports, StudyReport } from '../services/studyService';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useApp } from '../contexts/AppContext';

const { width } = Dimensions.get('window') };

export const ReportDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { showNotification } = useApp();

  const [report, setReport] = useState<StudyReport | null>(null);
  const [loading, setLoading] = useState(true);

  const reportId = route.params?.reportId;

  useEffect(() => {
    loadReportDetail();
  }, [reportId]);

  const loadReportDetail = async () => {
    if (!reportId) {
      showNotification('error', '报告ID不存在');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const response = await getReports({});
      const foundReport = response.data.find((r) => r.id === reportId);
      if (foundReport) {
        setReport(foundReport);
      } else {
        showNotification('error', '报告不存在');
        navigation.goBack();
      }
    } catch (error: any) {
      showNotification('error', '加载报告详情失败');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!report) return;

    try {
      await Share.share({
        message: `我在意学助手的学习报告：
${report.reportType === 'daily' ? '日报' : report.reportType === 'weekly' ? '周报' : '月报'}
做题数量：${report.stats.questionsAttempted}
正确率：${report.stats.correctRate.toFixed(1)}%
学习时长：${Math.floor(report.stats.studyTime / 60)}小时${report.stats.studyTime % 60}分钟

来意学助手一起学习吧！`,
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'daily':
        return '日报';
      case 'weekly':
        return '周报';
      case 'monthly':
        return '月报';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>报告不存在</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="报告详情"
        rightComponent={
          <TouchableOpacity onPress={handleShare}>
            <Icon name="share" size={24} color="#6B7280" />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content}>
        {/* 报告标题卡片 */}
        <Card className="mb-4">
          <View style={styles.reportHeader}>
            <View style={styles.reportTypeBadge}>
              <Text style={styles.reportTypeText}>{getReportTypeLabel(report.reportType)}</Text>
            </View>
            <Text style={styles.reportDate}>
              {formatDate(report.startDate)} - {formatDate(report.endDate)}
            </Text>
          </View>
        </Card>

        {/* 学习时长统计 */}
        <Card className="mb-4">
          <View style={styles.sectionHeader}>
            <Icon name="access-time" size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>学习时长</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(report.stats.studyTime)}</Text>
            <Text style={styles.statLabel}>总学习时长</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              {report.stats.mistakesSolved}
            </Text>
            <Text style={styles.statLabel}>解决错题数</Text>
          </View>
        </Card>

        {/* 做题统计 */}
        <Card className="mb-4">
          <View style={styles.sectionHeader}>
            <Icon name="assignment" size={20} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>做题统计</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{report.stats.questionsAttempted}</Text>
            <Text style={styles.statLabel}>总做题数</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: report.stats.correctRate >= 80 ? '#10B981' : report.stats.correctRate >= 60 ? '#F59E0B' : '#EF4444' }]}>
              {report.stats.correctRate.toFixed(1)}%
            </Text>
            <Text style={styles.statLabel}>正确率</Text>
          </View>
        </Card>

        {/* AI 学习建议 */}
        {report.recommendations && report.recommendations.length > 0 && (
          <Card className="mb-4">
            <View style={styles.sectionHeader}>
              <Icon name="psychology" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>AI 学习建议</Text>
            </View>
            <View style={styles.recommendations}>
              {report.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <View style={[styles.recommendationPriority, { backgroundColor: rec.priority >= 8 ? '#EF4444' : rec.priority >= 5 ? '#F59E0B' : '#10B981' }]}>
                    <Text style={styles.recommendationPriorityText}>{rec.priority}</Text>
                  </View>
                  <View style={styles.recommendationContent}>
                    <Text style={styles.recommendationType}>
                      {rec.type === 'question' ? '推荐题目' : rec.type === 'knowledge' ? '知识点' : '复习'}
                    </Text>
                    <Text style={styles.recommendationReason}>{rec.reason}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* 学习评价 */}
        <Card className="mb-4">
          <View style={styles.sectionHeader}>
            <Icon name="emoji-events" size={20} color="#F59E0B" />
            <Text style={styles.sectionTitle}>学习评价</Text>
          </View>
          <View style={styles.evaluation}>
            {report.stats.correctRate >= 90 ? (
              <View style={styles.evaluationItem}>
                <Icon name="star" size={24} color="#F59E0B" />
                <Text style={styles.evaluationText}>优秀！你的学习表现非常出色</Text>
              </View>
            ) : report.stats.correctRate >= 80 ? (
              <View style={styles.evaluationItem}>
                <Icon name="thumb-up" size={24} color="#10B981" />
                <Text style={styles.evaluationText}>良好！继续保持努力</Text>
              </View>
            ) : report.stats.correctRate >= 60 ? (
              <View style={styles.evaluationItem}>
                <Icon name="trending-up" size={24} color="#3B82F6" />
                <Text style={styles.evaluationText}>进步空间很大，加油！</Text>
              </View>
            ) : (
              <View style={styles.evaluationItem}>
                <Icon name="notifications-active" size={24} color="#EF4444" />
                <Text style={styles.evaluationText}>需要加强基础，多加练习</Text>
              </View>
            )}

            {report.stats.mistakesSolved > 0 && (
              <View style={styles.evaluationItem}>
                <Icon name="check-circle" size={24} color="#10B981" />
                <Text style={styles.evaluationText}>
                  解决了 {report.stats.mistakesSolved} 道错题，值得称赞！
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* 操作按钮 */}
        <View style={styles.actions}>
          <Button
            title="返回"
            onPress={() => navigation.goBack()}
            type="secondary"
            className="flex-1"
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportTypeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  reportTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  reportDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statItem: {
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  recommendations: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
  },
  recommendationPriority: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationPriorityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationType: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  recommendationReason: {
    fontSize: 14,
    color: '#1F2937',
  },
  evaluation: {
    gap: 12,
  },
  evaluationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  evaluationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  actions: {
    marginTop: 16,
  },
});

export default ReportDetailScreen;
