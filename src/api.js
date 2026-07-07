import { API_BASE_URL } from './config.js';

const FALLBACK_MESSAGE = {
  title: 'Happy Birthday,',
  body: 'To make our yearly tradition more meaningful and lasting, I decided to bring it into the virtual world and crafted a bouquet for you with my own hands — one that will never wilt. Wishing you a wonderful day filled with joy and love.',
  signature: '- With love',
};

export async function fetchGiftMessage() {
  const endpoint = `${API_BASE_URL}/api/message`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Message fetch failed with status ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.warn('Could not fetch message from API, falling back to local message:', error);
    return FALLBACK_MESSAGE;
  }
}
