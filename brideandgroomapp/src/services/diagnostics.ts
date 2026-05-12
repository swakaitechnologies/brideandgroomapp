import axios from "axios";
import { Platform } from "react-native";

export const checkConnectivity = async (url: string) => {
  try {
    const start = Date.now();
    const response = await axios.get(`${url}/health`, { timeout: 5000 });
    const duration = Date.now() - start;
    return {
      success: true,
      message: `Connected to ${url} in ${duration}ms`,
      data: response.data
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to connect to ${url}: ${err.message}`,
      error: err
    };
  }
};
