import { https } from "firebase-functions";
import { initializeApp, auth } from "firebase-admin";
import { createHmac } from "crypto";

initializeApp();

const BOT_TOKEN = "your-telegram-bot-token"; // Замените на ваш токен бота Telegram

// Функция для проверки подписи initData
function verifyTelegramInitData(initData: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");

  const sortedParams = Array.from(params.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData")
    .update(BOT_TOKEN)
    .digest();
  const computedHash = createHmac("sha256", secretKey)
    .update(sortedParams)
    .digest("hex");

  return computedHash === hash;
}

// HTTPS-функция для создания кастомного токена
export const authTelegram = https.onRequest(
  async (req: https.Request, res: any) => {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ error: "initData is required" });
    }

    // Проверяем подлинность initData
    if (!verifyTelegramInitData(initData)) {
      return res.status(401).json({ error: "Invalid initData" });
    }

    // Извлекаем user.id из initData
    const params = new URLSearchParams(initData);
    const userData = params.get("user");
    if (!userData) {
      return res
        .status(400)
        .json({ error: "User data is missing in initData" });
    }

    const user = JSON.parse(userData);
    const userId = user.id.toString();

    try {
      // Создаем кастомный токен для Firebase
      const customToken = await auth().createCustomToken(userId);
      res.json({ customToken });
    } catch (error) {
      console.error("Error creating custom token:", error);
      res.status(500).json({ error: "Failed to create custom token" });
    }
  }
);
