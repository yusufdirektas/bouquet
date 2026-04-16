import { API_BASE_URL } from './config.js';

export async function fetchGiftMessage() {
  const response = await fetch(`${API_BASE_URL}/api/message`);
  if (!response.ok) {
    throw new Error(`Message fetch failed with status ${response.status}`);
  }
  return response.json();
}
