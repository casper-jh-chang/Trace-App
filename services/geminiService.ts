
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

export const queryInventory = async (
  query: string, 
  inventory: StorageItem[], 
  chatHistory: ChatMessage[]
): Promise<string> => {
  const inventoryContext = JSON.stringify(inventory.map(i => ({
    name: i.name,
    scene: i.scene,
    location: i.locationDetail,
    category: i.category,
    remarks: i.remarks
  })));

  const systemInstruction = `你是一个名为“抽屉”的智能收纳管家助手。你的任务是帮助用户在他们的家庭库存中查找物品。
  
  以下是用户的当前所有物品及其位置信息：
  ${inventoryContext}
  
  请根据用户的问题，在上述库存中查找。
  如果找到了，请详细告诉用户位置及相关备注信息。
  如果没有找到，请礼貌地说明目前没有记录该物品。
  回答要自然、友好、简洁。使用中文回答。`;

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
    },
  });

  return response.text;
};
