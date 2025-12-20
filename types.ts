
export enum SceneType {
  KITCHEN = '厨房',
  CLOSET = '衣柜',
  STUDY = '书房',
  BASEMENT = '地下室',
  LIVING_ROOM = '客厅',
  BATHROOM = '浴室',
  OTHER = '其他'
}

export interface StorageItem {
  id: string;
  name: string;
  category: string;
  scene: SceneType;
  locationDetail: string;
  imageUrl: string; // This will store the cropped image
  fullImageUrl: string; // Keep original for reference
  timestamp: number;
  remarks: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface AIItem {
  itemName: string;
  category: string;
  scene: SceneType;
  preciseLocation: string;
  remarks: string;
  box_2d: number[]; // [ymin, xmin, ymax, xmax] normalized to 1000
}

export interface AIAnalysisResult {
  items: AIItem[];
}
