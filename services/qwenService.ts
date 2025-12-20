import { AIAnalysisResult, SceneRecord, ChatMessage, SceneType, ChatAIResponse } from "../types";

const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY || "sk-05437c944b084b288c3948746c58630e";

// Qwen VL Max API endpoint
const QWEN_API_URL = import.meta.env.DEV
  ? "/dashscope-api/api/v1/services/aigc/multimodal-generation/generation"
  : "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

export const analyzeImageQwen = async (base64Image: string): Promise<AIAnalysisResult> => {
  const prompt = `你是一个极度细致的收纳识别专家。请扫描这张照片，找出其中所有的**独立小物品**。
【铁律】不要识别容器（如抽屉、盒子、柜子本身），只识别里面的内容物。
请返回物品名称、分类、位置描述、2D坐标[xmin, ymin, xmax, ymax]（0-1000归一化）以及预计保质期（如果是食品）。
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
      "box_2d": [0, 0, 1000, 1000] // [xmin, ymin, xmax, ymax] 对应 [左上角x, 左上角y, 右下角x, 右下角y]，必须是0-1000的归一化坐标
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

const locateItemInScene = async (sceneImage: string, itemName: string): Promise<number[] | undefined> => {
  try {
    const prompt = `请在图中精准框选出"${itemName}"。请返回该物品的2D坐标[xmin, ymin, xmax, ymax]（0-1000归一化）。请直接返回JSON格式：{"box_2d": [x1, y1, x2, y2]}`;

    let dataUri = sceneImage;
    if (!sceneImage.startsWith('data:')) {
      dataUri = `data:image/jpeg;base64,${sceneImage}`;
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

    const response = await fetch(QWEN_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) return undefined;

    const data = await response.json();
    const content = data.output?.choices?.[0]?.message?.content?.[0]?.text || data.output?.choices?.[0]?.message?.content;

    if (!content) return undefined;

    const cleanContent = content.replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(cleanContent);
    return parsed.box_2d;
  } catch (e) {
    console.error("Re-location failed:", e);
    return undefined;
  }
};

export const queryInventoryQwen = async (
  query: string,
  scenes: SceneRecord[],
  chatHistory: ChatMessage[]
): Promise<ChatAIResponse> => {
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
  
  【重要】你必须只输出标准的 JSON 格式，严禁输出任何其他文本或 Markdown 标记。
  请以JSON格式返回，格式如下：
  {
    "answer": "回答内容",
    "matchedSceneIds": ["场景ID1", "场景ID2"],
    "matchedItemDetails": [{"sceneId": "场景ID", "itemName": "物品名"}]
  }`;

  const messages = [
    {
      role: "system",
      content: systemInstruction
    },
    ...chatHistory.map(m => ({
      role: m.role === 'model' ? 'assistant' : m.role,
      content: m.content
    })),
    {
      role: "user",
      content: `用户提问: ${query}\n\n我的视觉记忆内容:\n${memoryContext}`
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
      const errorText = await response.text();
      console.error("Qwen Text API Error Body:", errorText);
      throw new Error(`Qwen Text API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.output?.choices?.[0]?.message?.content;

    // Robust JSON extraction
    let cleanContent = content.replace(/```json\n?|```/g, "").trim();

    // Attempt to extract JSON if there's extra text
    const firstBrace = cleanContent.indexOf('{');
    const lastBrace = cleanContent.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
    }

    let parsedResponse: ChatAIResponse;
    try {
      parsedResponse = JSON.parse(cleanContent) as ChatAIResponse;
    } catch (parseError) {
      console.warn("JSON parse failed, falling back to raw text:", cleanContent);
      // Fallback: treat the entire content as the answer
      parsedResponse = {
        answer: content, // Use original content
        matchedSceneIds: [],
        matchedItemDetails: []
      };
    }

    // --- RE-VERIFICATION LOGIC ---
    // If we have matched items, try to get a better bounding box using the visual model on-demand
    if (parsedResponse.matchedItemDetails && parsedResponse.matchedItemDetails.length > 0) {
      // Limit to first 3 items to avoid excessive API calls
      const itemsToVerify = parsedResponse.matchedItemDetails.slice(0, 3);

      await Promise.all(itemsToVerify.map(async (detail) => {
        const scene = scenes.find(s => s.id === detail.sceneId);
        if (scene && scene.fullImageUrl) {
          // Call Qwen VL Max to re-locate
          const newBox = await locateItemInScene(scene.fullImageUrl, detail.itemName);
          if (newBox) {
            detail.box_2d = newBox;
          }
        }
      }));
    }

    return parsedResponse;

  } catch (e) {
    console.error("Qwen Chat Error:", e);
    return {
      answer: "抱歉，我暂时无法连接到大脑（Qwen服务出错）。",
      matchedSceneIds: [],
      matchedItemDetails: []
    };
  }
};
