
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GeminiModel, ImageAspectRatio, ImageStyle, ImageResolution } from "../types";

export const generateBannerImages = async (
  inspirationImages: string[],
  productImages: string[],
  prompt: string,
  model: GeminiModel,
  aspectRatio: ImageAspectRatio,
  resolution: ImageResolution,
  style: ImageStyle
): Promise<string[]> => {
  // Khởi tạo AI với Key từ môi trường
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const basePrompt = `Create a professional high-end marketing banner. 
  STYLE: ${style}. 
  ASPECT RATIO: ${aspectRatio}.
  RESOLUTION TARGET: ${resolution}.
  LAYOUT INSTRUCTION: Follow the composition and mood of the inspiration images.
  PRODUCT INSTRUCTION: Place the provided product images naturally into the design. 
  The final result must be a complete, ready-to-use advertisement.
  ${prompt ? `SPECIFIC DETAILS: ${prompt}` : ''}`;

  const parts: any[] = [{ text: basePrompt }];

  // Thêm ảnh mẫu (Inspiration)
  inspirationImages.forEach((base64) => {
    const data = base64.includes(',') ? base64.split(',')[1] : base64;
    parts.push({
      inlineData: {
        data: data,
        mimeType: 'image/png'
      }
    });
  });

  // Thêm ảnh sản phẩm
  productImages.forEach((base64) => {
    const data = base64.includes(',') ? base64.split(',')[1] : base64;
    parts.push({
      inlineData: {
        data: data,
        mimeType: 'image/png'
      }
    });
  });

  const generateSingle = async (index: number) => {
    try {
      // Cấu hình imageConfig, chỉ dùng imageSize cho model PRO
      const imageConfig: any = {
        aspectRatio: aspectRatio,
      };
      
      if (model === GeminiModel.PRO) {
        imageConfig.imageSize = resolution;
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: { parts },
        config: {
          imageConfig: imageConfig
        }
      });

      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("API không trả về kết quả (có thể do bộ lọc an toàn).");
      }

      const candidate = response.candidates[0];
      if (candidate.finishReason === 'SAFETY') {
        throw new Error("Nội dung bị chặn bởi bộ lọc an toàn của Google.");
      }

      let imageUrl = '';
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }
      
      if (!imageUrl) throw new Error("Không tìm thấy dữ liệu ảnh trong phản hồi.");
      return imageUrl;
    } catch (err: any) {
      console.error(`Lỗi tại variant ${index}:`, err);
      throw err;
    }
  };

  // Thử tạo 4 ảnh
  const results = await Promise.allSettled([
    generateSingle(1),
    generateSingle(2),
    generateSingle(3),
    generateSingle(4)
  ]);

  const successfulImages = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
    .map(r => r.value);

  if (successfulImages.length === 0) {
    const firstError = (results[0] as PromiseRejectedResult).reason;
    throw new Error(firstError.message || "Tất cả các lần thử tạo ảnh đều thất bại.");
  }

  return successfulImages;
};
