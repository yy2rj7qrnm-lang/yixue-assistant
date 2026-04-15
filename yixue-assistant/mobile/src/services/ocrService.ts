import apiClient from './apiClient';

export interface OCRResult {
  text: string;
  analysis: {
    subject: string;
    questionType: string;
    answer: string;
  };
  confidence: number;
  imagePath: string;
}

export interface OCRError {
  message: string;
  error: string;
}

// 识别错题图片
export const recognizeMistake = async (
  imageUri: string,
  onProgress?: (progress: number) => void
): Promise<OCRResult> => {
  try {
    // 将图片URI转换为FormData
    const formData = new FormData();

    // React Native文件对象
    const file = {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'mistake.jpg',
    } as any;

    formData.append('image', file);

    const response = await apiClient.upload<{ data: OCRResult }>(
      '/ocr/recognize',
      formData,
      onProgress
    );

    return response.data;
  } catch (error) {
    console.error('OCR识别失败:', error);
    throw error;
  }
};

// 分析错题文本
export const analyzeMistake = async (params: {
  text: string;
  imagePath?: string;
  correctAnswer?: string;
}): Promise<{
  subject: string;
  grade: string;
  difficulty: string;
  questionType: string;
  knowledgePoints: string[];
  analysis: string;
  improvement: string[];
}> => {
  const response = await apiClient.post<{ data: any }>('/ocr/analyze', params);
  return response.data;
};
