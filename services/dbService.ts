import { SceneRecord } from "../types";

export const initDB = async (): Promise<void> => {
  // No-op for API
  return;
};

export const getCategories = async (): Promise<string[]> => {
  const response = await fetch('/api/categories');
  if (!response.ok) throw new Error('Fetch categories error');
  return response.json();
};

export const addCategory = async (name: string): Promise<void> => {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!response.ok) throw new Error('Add category error');
};

export const updateCategoryOrder = async (categories: string[]): Promise<void> => {
  const response = await fetch('/api/categories/order', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categories })
  });
  if (!response.ok) throw new Error('Update category order error');
};

export const getAllScenes = async (): Promise<SceneRecord[]> => {
  const response = await fetch('/api/scenes');
  if (!response.ok) throw new Error('Fetch scenes error');
  return response.json();
};

export const addScene = async (scene: SceneRecord): Promise<void> => {
  const response = await fetch('/api/scenes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scene)
  });
  if (!response.ok) throw new Error('Add scene error');
};

export const updateScene = async (scene: SceneRecord): Promise<void> => {
  const response = await fetch(`/api/scenes/${scene.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scene)
  });
  if (!response.ok) throw new Error('Update scene error');
};

export const deleteScene = async (id: string): Promise<void> => {
  const response = await fetch(`/api/scenes/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Delete scene error');
};

export const getChatHistory = async (): Promise<any[]> => {
  const response = await fetch('/api/chats');
  if (!response.ok) throw new Error('Fetch chats error');
  return response.json();
};

export const addChatMessage = async (message: any): Promise<void> => {
  const response = await fetch('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });
  if (!response.ok) throw new Error('Add chat error');
};

export const clearChatHistory = async (): Promise<void> => {
  const response = await fetch('/api/chats', {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Clear chat error');
};

export const deleteCategory = async (name: string): Promise<void> => {
  const response = await fetch(`/api/categories/${encodeURIComponent(name)}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Delete category error');
};

export const updateCategoryName = async (oldName: string, newName: string): Promise<void> => {
  if (oldName === newName) return;
  const response = await fetch(`/api/categories/${encodeURIComponent(oldName)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newName })
  });
  if (!response.ok) throw new Error('Update category name error');
};
