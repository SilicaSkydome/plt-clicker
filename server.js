// import express from "express";
// import { writeFileSync, readFileSync } from "fs";
// import { fileURLToPath } from "url";
// import { dirname, join } from "path";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const app = express();

// // Обслуживание статических файлов (JavaScript, CSS и т.д.)
// app.use(express.static(join(__dirname, "dist")));

// // Парсинг JSON-запросов
// app.use(express.json());

// // API для вебхука
// app.post("/webhook", (req, res) => {
//   const update = req.body;
//   console.log("Получено обновление от Telegram:", update);
//   if (update.message) {
//     const user = update.message.from;
//     console.log("Пользователь:", user);
//     const userData = {
//       telegramId: user.id,
//       firstName: user.first_name,
//       username: user.username || "",
//       lastInteraction: new Date().toISOString(),
//     };
//     writeFileSync("users.json", JSON.stringify(userData, null, 2));
//   }
//   res.sendStatus(200);
// });

// // API для сохранения данных пользователя
// app.post("/saveUser", (req, res) => {
//   const userData = req.body;
//   console.log("Сохранение данных пользователя:", userData);
//   writeFileSync("users.json", JSON.stringify(userData, null, 2));
//   res.json({ status: "success", user: userData });
// });

// // API для получения данных пользователя
// app.get("/user/:telegramId", (req, res) => {
//   const telegramId = req.params.telegramId;
//   try {
//     const userData = JSON.parse(readFileSync("users.json", "utf8"));
//     if (userData.telegramId === telegramId) {
//       res.json(userData);
//     } else {
//       res.status(404).json({ error: "Пользователь не найден" });
//     }
//   } catch (err) {
//     res.status(500).json({ error: "Ошибка сервера" });
//   }
// });

// // Обслуживание index.html для всех остальных маршрутов
// app.get("*", (req, res) => {
//   res.sendFile(join(__dirname, "index.html"));
// });

// export default app;

// //curl -X POST "https://api.telegram.org/bot<твой-токен>/setWebhook?url=<новый-ngrok-URL>/webhook"
