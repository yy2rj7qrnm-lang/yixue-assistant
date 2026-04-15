import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// 类型定义
interface LearningData {
  todayStudyTime: number;
  todayMistakes: number;
  streakDays: number;
  correctRate: number;
  weeklyData: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
  subjectDistribution: {
    [key: string]: number;
  };
}

const HomeScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [learningData, setLearningData] = useState<LearningData>({
    todayStudyTime: 0,
    todayMistakes: 0,
    streakDays: 0,
    correctRate: 0,
    weeklyData: {
      labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      datasets: [{ data: [30, 45, 30, 60, 45, 30, 0] }],
    },
    subjectDistribution: {
      数学: 12,
      物理: 8,
      化学: 5,
    },
  });

  // 模拟数据加载
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // 功能卡片数据
  const features = [
    {
      id: 'mistake',
      icon: 'assignment-late',
      title: '错题本',
      description: '智能识别，归类整理',
      color: '#EF4444',
      onPress: () => navigation.navigate('Mistake'),
    },
    {
      id: 'study',
      icon: 'school',
      title: '学习',
      description: '个性化学习路径',
      color: '#4F46E5',
      onPress: () => navigation.navigate('Study'),
    },
    {
      id: 'report',
      icon: 'assessment',
      title: '学习报告',
      description: '深度分析学习状况',
      color: '#10B981',
      onPress: () => navigation.navigate('Report'),
    },
    {
      id: 'knowledge',
      icon: 'auto-graph',
      title: '知识图谱',
      description: '构建知识体系',
      color: '#F59E0B',
      onPress: () => {},
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 顶部问候 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>你好！</Text>
            <Text style={styles.userName}>今天也要努力学习</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => {}}
          >
            <Icon name="notifications" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* 今日数据卡片 */}
        <View style={styles.todayCard}>
          <View style={styles.todayStats}>
            <View style={styles.todayStatItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <Icon name="schedule" size={24} color="#3B82F6" />
              </View>
              <View style={styles.statText}>
                <Text style={styles.statValue}>{learningData.todayStudyTime}分钟</Text>
                <Text style={styles.statLabel}>今日学习</Text>
              </View>
            </View>

            <View style={styles.todayStatItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEF2F2' }]}>
                <Icon name="error" size={24} color="#EF4444" />
              </View>
              <View style={styles.statText}>
                <Text style={styles.statValue}>{learningData.todayMistakes}道</Text>
                <Text style={styles.statLabel}>今日错题</Text>
              </View>
            </View>

            <View style={styles.todayStatItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#F0FDF4' }]}>
                <Icon name="local-fire-department" size={24} color="#10B981" />
              </View>
              <View style={styles.statText}>
                <Text style={styles.statValue}>{learningData.streakDays}天</Text>
                <Text style={styles.statLabel}>连续学习</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 功能网格 */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>核心功能</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={styles.featureCard}
                onPress={feature.onPress}
              >
                <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '20' }]}>
                  <Icon name={feature.icon as any} size={32} color={feature.color} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 学习曲线 */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>本周学习趋势</Text>
          <LineChart
            data={learningData.weeklyData}
            width={width - 32}
            height={200}
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '3',
                stroke: '#4F46E5',
              },
              propsForBackgroundLines: {
                strokeDasharray: '0',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* 学科分布 */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>学科分布</Text>
          <PieChart
            data={Object.entries(learningData.subjectDistribution).map(([key, value], index) => ({
              name: key,
              population: value,
              color: ['#EF4444', '#4F46E5', '#F59E0B'][index],
              legendFontColor: '#7F7F7F',
              legendFontSize: 12,
            }))}
            width={width - 32}
            height={200}
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>

        {/* 学习建议 */}
        <View style={styles.suggestionCard}>
          <View style={styles.suggestionHeader}>
            <Icon name="lightbulb" size={24} color="#F59E0B" />
            <Text style={styles.suggestionTitle}>AI学习建议</Text>
          </View>
          <Text style={styles.suggestionText}>
            根据您的学习数据，建议今天重点复习数学错题，您在函数概念方面仍有提升空间。
          </Text>
          <TouchableOpacity style={styles.suggestionButton}>
            <Text style={styles.suggestionButtonText}>开始学习</Text>
            <Icon name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 快捷操作 */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>快捷操作</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('OCRScan')}
            >
              <Icon name="add-a-photo" size={28} color="#FFFFFF" />
              <Text style={styles.quickActionText}>拍照识别</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Mistake')}
            >
              <Icon name="assignment-late" size={28} color="#FFFFFF" />
              <Text style={styles.quickActionText}>错题练习</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Report')}
            >
              <Icon name="assessment" size={28} color="#FFFFFF" />
              <Text style={styles.quickActionText}>学习报告</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  todayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  todayStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  todayStatItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statText: {
    alignItems: 'center',
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
  featuresContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 16,
  },
  suggestionCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    padding: 12,
  },
  suggestionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
});

export default HomeScreen;