import { AIAnalysisResult, SceneRecord, ChatMessage, ChatAIResponse } from "../types";
import { analyzeImage as analyzeImageGemini, queryInventory as queryInventoryGemini } from "./geminiService";
import { analyzeImageQwen, queryInventoryQwen } from "./qwenService";

export type AIModelType = 'gemini' | 'qwen';

let currentModel: AIModelType = 'qwen'; // Default to Qwen as requested

export const setAIModel = (model: AIModelType) => {
  currentModel = model;
  // Save to localStorage for persistence
  localStorage.setItem('selected_ai_model', model);
};

export const getAIModel = (): AIModelType => {
  const saved = localStorage.getItem('selected_ai_model') as AIModelType;
  if (saved && (saved === 'gemini' || saved === 'qwen')) {
    currentModel = saved;
  }
  return currentModel;
};

// Initialize model from storage
getAIModel();

export const analyzeImage = async (base64Image: string): Promise<AIAnalysisResult> => {
  if (currentModel === 'qwen') {
    return analyzeImageQwen(base64Image);
  } else {
    return analyzeImageGemini(base64Image);
  }
};

export const queryInventory = async (
  query: string,
  scenes: SceneRecord[],
  chatHistory: ChatMessage[]
): Promise<any> => {
  if (currentModel === 'qwen') {
    return queryInventoryQwen(query, scenes, chatHistory);
  } else {
    return queryInventoryGemini(query, scenes, chatHistory);
  }
};
