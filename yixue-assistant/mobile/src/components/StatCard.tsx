import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import theme from '../../styles/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  style?: ViewStyle;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color = theme.colors.primary,
  style,
  trend,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
            <Text style={[styles.iconText, { color }]}>
              {icon.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {trend && (
        <Text style={[styles.trend, { color: trend.isPositive ? '#4CAF50' : '#FF6B6B' }]}>
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    marginHorizontal: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trend: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default StatCard;
