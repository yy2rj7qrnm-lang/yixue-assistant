import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import theme from '../../styles/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
  borderRadius?: number;
  backgroundColor?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  padding = 16,
  borderRadius = 12,
  backgroundColor = '#fff',
}) => {
  const cardStyle = [
    styles.card,
    {
      padding,
      borderRadius,
      backgroundColor,
    },
    onPress && styles.pressable,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 8,
  },
  pressable: {
    // 触摸反馈样式
  },
});

export default Card;
