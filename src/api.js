import { API_BASE_URL } from './config.js';

const FALLBACK_MESSAGE = {
  title: 'İyi ki Doğdunuz Ayşe Latife Hocam',
  body: 'Bazı çiçekler toprakta, bazıları kalplerde büyür. 6 yıllık geleneğimizin bu seneki fidesi dijital dünyada, ama kökleri her zamanki gibi kalbimde. Sizi çok seviyorum, iyi ki varsınız...',
  signature: '- Yusuf Sait',
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
    console.warn('API mesajı alınamadı, yerel mesaja dönülüyor:', error);
    return FALLBACK_MESSAGE;
  }
}
