import { API_BASE_URL } from './api';

export const checkConnectivity = async (url: string) => {
  const targetUrl = API_BASE_URL;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`${targetUrl}/health`, {
      headers: {
        'X-Mobile-App': 'true',
      },
      signal: controller.signal,
    });
    const data = await response.json();
    clearTimeout(id);
    if (response.ok && data.status === 'healthy') {
      return { message: 'Connection successful!' };
    }
    return { message: `Server error: ${JSON.stringify(data)}` };
  } catch (error: any) {
    clearTimeout(id);
    return { message: `Connection failed: ${error.message}` };
  }
};
