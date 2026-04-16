import { API_BASE_URL } from './config.js';

const FALLBACK_MESSAGE = {
  title: 'İyi ki doğdunuz Latife Hocam,',
  body: 'Her yılki geleneğimizin bu sene daha anlamlı ve kalıcı olması için, bu geleneği sanal dünyaya taşımaya karar verdim ve kendi ellerimle size asla solmayacak bir buket hazırladım. Dehşet verici olaylar yaşadığımız şu günlerde, bir öğrenciniz olarak sonsuz saygı ve sevgimi sunuyorum. İyi ki doğdunuz, iyi ki öğretmenim oldunuz...',
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
