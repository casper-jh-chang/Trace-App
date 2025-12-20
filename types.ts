
export enum SceneType {
  KITCHEN = '厨房',
  CLOSET = '衣柜',
  STUDY = '书房',
  BASEMENT = '地下室',
  LIVING_ROOM = '客厅',
  BATHROOM = '浴室',
  OTHER = '其他'
}

export interface AIItem {
  itemName: string;
  category: string;
  scene: SceneType;
  preciseLocation: string;
  remarks: string;
  box_2d: number[];
  shelfLifeDays?: number;
}

// Added StorageItem interface to support legacy inventory view and item tracking
export interface StorageItem {
  id: string;
  name: string;
  imageUrl: string;
  timestamp: number;
  expiryTimestamp?: number;
  locationDetail: string;
  scene: SceneType;
}

export interface SceneRecord {
  id: string;
  fullImageUrl: string; // 存储压缩后的全景照片
  timestamp: number;
  locationCategory: string; // 用户输入的大位置，如“主卧衣柜”
  items: AIItem[]; // 该照片中识别到的所有物体元数据
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface AIAnalysisResult {
  items: AIItem[];
}

export interface ChatAIResponse {
  answer: string;
  matchedSceneIds: string[];
  matchedItemDetails?: {
    sceneId: string;
    itemName: string;
    box_2d?: number[]; // [xmin, ymin, xmax, ymax] 0-1000 normalized
  }[];
  modelName?: string;
}
