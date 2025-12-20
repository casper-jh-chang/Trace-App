
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, StorageItem, ChatMessage, SceneType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const analyzeImage = async (base64Image: string): Promise<AIAnalysisResult> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: "请像目标检测模型（如YOLO）一样，识别这张照片中所有独立的物品。对于每一个物品，返回其名称、分类、典型场景、具体位置、备注信息，以及它的 2D 检测框 [ymin, xmin, ymax, xmax]（坐标需归一化到 0-1000 之间）。请以 JSON 格式返回物品列表。",
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                itemName: { type: Type.STRING, description: "物品名称" },
                category: { type: Type.STRING, description: "物品分类" },
                scene: { 
                  type: Type.STRING, 
                  enum: Object.values(SceneType),
                  description: "所在的典型家庭场景" 
                },
                preciseLocation: { type: Type.STRING, description: "具体的存放位置描述" },
                remarks: { type: Type.STRING, description: "备注信息" },
                box_2d: { 
                  type: Type.ARRAY, 
                  items: { type: Type.NUMBER }, 
                  description: "检测框坐标 [ymin, xmin, ymax, xmax]，范围 0-1000" 
                },
              },
              required: ["itemName", "category", "scene", "preciseLocation", "remarks", "box_2d"],
            },
          },
        },
        required: ["items"],
      },
    },
  });

  return JSON.parse(response.text);
};

export interface ChatAIResponse {
  answer: string;
  matchedItemIds: string[];
}

export const queryInventory = async (
  query: string, 
  inventory: StorageItem[], 
  chatHistory: ChatMessage[]
): Promise<ChatAIResponse> => {
  const inventoryContext = JSON.stringify(inventory.map(i => ({
    id: i.id,
    name: i.name,
    scene: i.scene,
    location: i.locationDetail,
    category: i.category,
    remarks: i.remarks
  })));

  const systemInstruction = `你是一个名为“抽屉”的智能收纳管家。
  
  任务：
  1. 根据用户的问题在库存中查找物品。
  2. 如果用户描述的是特征（颜色、材质、形状、备注信息），请尝试在 remarks 和 category 中联想匹配。
  3. 如果找到多个可能匹配的物品，请在回答中列出它们并询问用户。
  4. 如果找到物品，回答中不要包含 ID，只需描述位置。
  
  库存数据结构：
  ${inventoryContext}
  
  必须以 JSON 格式返回：
  {
    "answer": "你的自然语言回复内容",
    "matchedItemIds": ["匹配到的物品ID1", "匹配到的物品ID2"]
  }
  如果没找到任何匹配，matchedItemIds 请返回空数组 []。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      ...chatHistory.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      })),
      { role: "user", parts: [{ text: query }] }
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: { type: Type.STRING },
          matchedItemIds: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          }
        },
        required: ["answer", "matchedItemIds"]
      }
    },
  });

  return JSON.parse(response.text);
};
