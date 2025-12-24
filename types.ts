
export enum ImageAspectRatio {
  SQUARE = "1:1",
  LANDSCAPE = "16:9",
  PORTRAIT = "9:16",
  CLASSIC = "4:3",
  TALL = "3:4"
}

export enum GeminiModel {
  FLASH = "gemini-2.5-flash-image",
  PRO = "gemini-3-pro-image-preview"
}

export enum ImageResolution {
  R1K = "1K",
  R2K = "2K",
  R4K = "4K"
}

export enum ImageStyle {
  MINIMALIST = "Minimalist & Clean",
  CYBERPUNK = "Cyberpunk / Neon",
  VINTAGE = "Retro / Vintage",
  PROFESSIONAL = "Corporate / Professional",
  ARTISTIC = "Abstract / Artistic",
  PHOTOREALISTIC = "Photorealistic",
  LUXURY = "Luxury / Elegant"
}

export interface GeneratedImage {
  id: string;
  url: string;
  timestamp: number;
  style: string;
  resolution?: string;
}

export interface User {
  username: string;
  history: GeneratedImage[];
}

export interface AppState {
  currentUser: User | null;
  inspirationImages: string[];
  productImages: string[];
  prompt: string;
  selectedModel: GeminiModel;
  aspectRatio: ImageAspectRatio;
  selectedResolution: ImageResolution;
  style: ImageStyle;
  isGenerating: boolean;
  generatedImages: GeneratedImage[];
  isDarkMode: boolean;
}
