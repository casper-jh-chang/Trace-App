import { AIAnalysisResult, SceneRecord, ChatMessage, SceneType } from "../types";

const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY || "sk-05437c944b084b288c3948746c58630e";

// Qwen VL Max API endpoint
const QWEN_API_URL = import.meta.env.DEV
  ? "/dashscope-api/api/v1/services/aigc/multimodal-generation/generation"
  : "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

export const analyzeImageQwen = async (base64Image: string): Promise<AIAnalysisResult> => {
  const prompt = `你是一个极度细致的收纳识别专家。请扫描这张照片，找出其中所有的**独立小物品**。
【铁律】不要识别容器（如抽屉、盒子、柜子本身），只识别里面的内容物。
请返回物品名称、分类、位置描述、2D坐标[ymin, xmin, ymax, xmax]以及预计保质期（如果是食品）。
请以JSON格式返回，不要包含Markdown格式标记（如 \`\`\`json）。
返回格式示例：
{
  "items": [
    {
      "itemName": "物品名称",
      "category": "分类",
      "scene": "厨房", // 必须是以下之一：厨房, 衣柜, 书房, 地下室, 客厅, 浴室, 其他
      "preciseLocation": "位置描述",
      "remarks": "备注",
      "shelfLifeDays": 365,
      "box_2d": [0, 0, 100, 100] // [ymin, xmin, ymax, xmax] 归一化或像素坐标均可，最好是[0-1000]范围
    }
  ]
}`;

  // Qwen VL supports base64 image data
  // Format: "data:image/png;base64,..."
  // Ensure base64Image has the prefix or add it. 
  // The user's code in geminiService.ts does: base64Image.split(',')[1] || base64Image
  // Here we likely need the full data URI for Qwen if we pass it as 'image' field?
  // Checking Qwen docs: "image": "https://..." or "data:image/jpg;base64,xxxx"

  let dataUri = base64Image;
  if (!base64Image.startsWith('data:')) {
    dataUri = `data:image/jpeg;base64,${base64Image}`;
  }

  const payload = {
    model: "qwen-vl-max",
    input: {
      messages: [
        {
          role: "user",
          content: [
            { image: dataUri },
            { text: prompt }
          ]
        }
      ]
    },
    parameters: {
      result_format: "message"
    }
  };

  try {
    const response = await fetch(QWEN_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Qwen API Error:", errText);
      throw new Error(`Qwen API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.output?.choices?.[0]?.message?.content?.[0]?.text || data.output?.choices?.[0]?.message?.content;

    if (!content) {
      console.error("Qwen Empty Response", data);
      return { items: [] };
    }

    // Clean up markdown code blocks if present
    const cleanContent = content.replace(/```json\n?|```/g, "").trim();

    try {
      const parsed = JSON.parse(cleanContent);
      // Ensure scene is valid enum
      if (parsed.items) {
        parsed.items.forEach((item: any) => {
          if (!Object.values(SceneType).includes(item.scene)) {
            item.scene = SceneType.OTHER;
          }
          // Ensure box_2d is present
          if (!item.box_2d) {
            item.box_2d = [0, 0, 0, 0];
          }
        });
      }
      return parsed as AIAnalysisResult;
    } catch (e) {
      console.error("Failed to parse Qwen JSON:", content);
      return { items: [] };
    }

  } catch (error) {
    console.error("Qwen Service Error:", error);
    return { items: [] };
  }
};

export const queryInventoryQwen = async (
  query: string,
  scenes: SceneRecord[],
  chatHistory: ChatMessage[]
): Promise<any> => {
  // Similar implementation for chat
  const memoryContext = scenes.length > 0
    ? scenes.map(s => `[场景ID:${s.id}, 位置:${s.locationCategory}] 包含物品: ${s.items.map(i => i.itemName).join(', ')}`).join('\n')
    : "当前没有任何视觉记忆记录。";

  const systemInstruction = `你是一个“视觉记忆”管家。你的回答必须基于用户提供的“场景记忆”。
  
  【回答规则】
  1. 如果用户找某个东西，检查哪些“场景ID”中包含它。
  2. 你的回答必须非常简短：告知它在哪个位置，做了什么标记。
  3. 如果记忆中没有，直接说“我不记得见过这个”。
  4. 必须返回 matchedSceneIds。
  5. **关键点**：必须返回 matchedItemDetails 列表，明确指明在哪个场景里匹配到了哪个具体物品名称（必须与原始数据完全一致）。
  
  请以JSON格式返回，格式如下：
  {
    "answer": "回答内容",
    "matchedSceneIds": ["场景ID1", "场景ID2"],
    "matchedItemDetails": [{"sceneId": "场景ID", "itemName": "物品名"}]
  }`;

  const messages = [
    {
      role: "system",
      content: [{ text: systemInstruction }]
    },
    ...chatHistory.map(m => ({
      role: m.role,
      content: [{ text: m.content }]
    })),
    {
      role: "user",
      content: [{ text: `用户提问: ${query}\n\n我的视觉记忆内容:\n${memoryContext}` }]
    }
  ];

  const payload = {
    model: "qwen-plus", // Use qwen-plus for text/chat tasks, or qwen-max
    input: {
      messages: messages
    },
    parameters: {
      result_format: "message"
    }
  };

  try {
    // Qwen text generation endpoint is different: 
    // Actually qwen-vl models can handle text only too, but qwen-plus is better for pure text logic.
    // Endpoint: https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
    const TEXT_API_URL = import.meta.env.DEV
      ? "/dashscope-api/api/v1/services/aigc/text-generation/generation"
      : "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

    const response = await fetch(TEXT_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Qwen Text API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.output?.choices?.[0]?.message?.content;

    const cleanContent = content.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(cleanContent);

  } catch (e) {
    console.error("Qwen Chat Error:", e);
    return {
      answer: "抱歉，我暂时无法连接到大脑（Qwen服务出错）。",
      matchedSceneIds: [],
      matchedItemDetails: []
    };
  }
};
