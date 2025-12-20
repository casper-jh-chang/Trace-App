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

export const analyzeImage = async (base64Image: string, knownSpaces: string[] = []): Promise<AIAnalysisResult> => {
  if (currentModel === 'qwen') {
    return analyzeImageQwen(base64Image, knownSpaces);
  } else {
    return analyzeImageGemini(base64Image, knownSpaces);
  }
};

export const queryInventory = async (
  query: string,
  scenes: SceneRecord[],
  chatHistory: ChatMessage[]
): Promise<ChatAIResponse> => {
  let response;
  if (currentModel === 'qwen') {
    response = await queryInventoryQwen(query, scenes, chatHistory);
  } else {
    response = await queryInventoryGemini(query, scenes, chatHistory);
  }

  return {
    ...response,
    modelName: currentModel === 'qwen' ? '通义千问 (Qwen)' : 'Gemini 3 Flash'
  };
};
