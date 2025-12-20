
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, SceneRecord, ChatMessage, SceneType } from "../types";

export const analyzeImage = async (base64Image: string): Promise<AIAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const MAX_REPETITIONS = 4;

  const scanTask = async () => {
    try {
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
                text: `你是一个极度细致的收纳识别专家。请扫描这张照片，找出其中所有的**独立小物品**。
                【铁律】不要识别容器（如抽屉、盒子、柜子本身），只识别里面的内容物。
                请返回物品名称、分类、位置描述、2D坐标[ymin, xmin, ymax, xmax]以及预计保质期（如果是食品）。`,
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
                    itemName: { type: Type.STRING },
                    category: { type: Type.STRING },
                    scene: { type: Type.STRING, enum: Object.values(SceneType) },
                    preciseLocation: { type: Type.STRING },
                    remarks: { type: Type.STRING },
                    shelfLifeDays: { type: Type.NUMBER },
                    box_2d: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                  },
                  required: ["itemName", "category", "scene", "preciseLocation", "remarks", "box_2d"],
                },
              },
            },
            required: ["items"],
          },
        },
      });
      return JSON.parse(response.text) as AIAnalysisResult;
    } catch (e) {
      return { items: [] };
    }
  };

  const allResults = await Promise.all(Array(MAX_REPETITIONS).fill(null).map(() => scanTask()));
  return allResults.reduce((best, current) => (current.items?.length || 0) > (best.items?.length || 0) ? current : best, { items: [] } as AIAnalysisResult);
};

export const queryInventory = async (
  query: string,
  scenes: SceneRecord[],
  chatHistory: ChatMessage[]
): Promise<ChatAIResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const memoryContext = scenes.length > 0
    ? scenes.map(s => `[场景ID:${s.id}, 位置:${s.locationCategory}] 包含物品: ${s.items.map(i => i.itemName).join(', ')}`).join('\n')
    : "当前没有任何视觉记忆记录。";

  const systemInstruction = `你是一个“视觉记忆”管家。你的回答必须基于用户提供的“场景记忆”。
  
  【回答规则】
  1. 如果用户找某个东西，检查哪些“场景ID”中包含它。
  2. 你的回答必须非常简短：告知它在哪个位置，做了什么标记。
  3. 如果记忆中没有，直接说“我不记得见过这个”。
  4. 必须返回 matchedSceneIds。
  5. **关键点**：必须返回 matchedItemDetails 列表，明确指明在哪个场景里匹配到了哪个具体物品名称（必须与原始数据完全一致）。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      ...chatHistory.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
      { role: "user", parts: [{ text: `用户提问: ${query}\n\n我的视觉记忆内容:\n${memoryContext}` }] }
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: { type: Type.STRING },
          matchedSceneIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          matchedItemDetails: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneId: { type: Type.STRING },
                itemName: { type: Type.STRING }
              }
            }
          }
        },
        required: ["answer", "matchedSceneIds", "matchedItemDetails"]
      }
    },
  });

  return JSON.parse(response.text);
};
