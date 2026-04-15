import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import theme from '../../styles/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  type = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 24, fontSize: 18 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 20, fontSize: 16 };
    }
  };

  const getTypeStyle = () => {
    switch (type) {
      case 'secondary':
        return {
          backgroundColor: '#f0f0f0',
          color: theme.colors.text,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: theme.colors.primary,
          borderWidth: 1,
          borderColor: theme.colors.primary,
        };
      case 'danger':
        return {
          backgroundColor: '#FF6B6B',
          color: '#fff',
        };
      default:
        return {
          backgroundColor: theme.colors.primary,
          color: '#fff',
        };
    }
  };

  const sizeStyle = getSizeStyle();
  const typeStyle = getTypeStyle();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          backgroundColor: typeStyle.backgroundColor,
          borderWidth: typeStyle.borderWidth || 0,
          borderColor: typeStyle.borderColor,
          opacity: disabled || loading ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={typeStyle.color} />
      ) : (
        <View style={styles.content}>
          {icon && (
            <Icon
              name={icon as any}
              size={20}
              color={typeStyle.color}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.text,
              { color: typeStyle.color, fontSize: sizeStyle.fontSize },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontWeight: '600',
  },
});

export default Button;
