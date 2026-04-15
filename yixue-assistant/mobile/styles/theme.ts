import { Theme } from '@rneui/themed';

// 定义应用主题
const theme: Theme = {
  lightColors: {
    primary: '#4F46E5', // 主色调 - 紫色
    secondary: '#7C3AED', // 次要色调 - 深紫色
    success: '#10B981', // 成功色 - 绿色
    error: '#EF4444', // 错误色 - 红色
    warning: '#F59E0B', // 警告色 - 黄色
    info: '#3B82F6', // 信息色 - 蓝色

    // 自定义颜色
    background: '#F9FAFB', // 背景色
    surface: '#FFFFFF', // 表面色
    text: '#1F2937', // 主要文本
    textSecondary: '#6B7280', // 次要文本
    border: '#E5E7EB', // 边框色
    shadow: '#000000', // 阴影色

    // 渐变色
    gradientStart: '#6366F1',
    gradientEnd: '#8B5CF6',

    // 学习相关颜色
    study: '#4ADE80',
    review: '#FCD34D',
    mistake: '#F87171',
    completed: '#34D399',

    // 图表颜色
    chartPrimary: '#6366F1',
    chartSecondary: '#8B5CF6',
    chartSuccess: '#10B981',
    chartError: '#EF4444',
  },

  darkColors: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    // 暗色主题
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#374151',
    shadow: '#000000',

    // 渐变色
    gradientStart: '#6366F1',
    gradientEnd: '#8B5CF6',

    // 学习相关颜色
    study: '#4ADE80',
    review: '#FCD34D',
    mistake: '#F87171',
    completed: '#34D399',

    // 图表颜色
    chartPrimary: '#6366F1',
    chartSecondary: '#8B5CF6',
    chartSuccess: '#10B981',
    chartError: '#EF4444',
  },

  mode: 'light', // 默认使用浅色主题

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      light: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
      xxl: 40,
      xxxl: 48,
    },
  },

  animation: {
    duration: 300,
    easing: 'ease-in-out',
  },

  components: {
    Button: {
      titleProps: {
        fontWeight: '600',
      },
      containerStyle: {
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    },
    Card: {
      containerStyle: {
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    },
    Input: {
      inputContainerStyle: {
        borderRadius: 12,
        borderWidth: 1,
        borderBottomWidth: 1,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
      },
      inputStyle: {
        fontSize: 16,
      },
    },
    Text: {
      h1Style: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1F2937',
      },
      h2Style: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
      },
      h3Style: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
      },
      pStyle: {
        fontSize: 16,
        color: '#6B7280',
      },
    },
  },
};

export default theme;

// 额外的样式常量
export const styles = {
  // 间距
  padding: {
    tiny: theme.spacing.xs,
    small: theme.spacing.sm,
    medium: theme.spacing.md,
    large: theme.spacing.lg,
    extraLarge: theme.spacing.xl,
    doubleExtraLarge: theme.spacing.xxl,
  },

  // 圆角
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    extraLarge: 24,
    circle: 999,
  },

  // 阴影
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
  },

  // 渐变
  gradients: {
    primary: {
      colors: [theme.lightColors.gradientStart, theme.lightColors.gradientEnd],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
  },

  // 动画
  animations: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    slideUp: {
      from: { translateY: 100 },
      to: { translateY: 0 },
    },
    slideDown: {
      from: { translateY: -100 },
      to: { translateY: 0 },
    },
  },
} as const;