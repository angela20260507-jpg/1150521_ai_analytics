import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON body parser with a generous size limit
app.use(express.json({ limit: "15mb" }));

// Lazy load Gemini AI tool to prevent crashing if GEMINI_API_KEY is not configured on startup
let aiInstance: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY 尚未設定，請使用 Settings > Secrets 面板設定金鑰。");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// System Instructions
const SYSTEM_INSTRUCTION = `你是一位專業且經驗豐富的高階數據分析師與商業策略專家（Data Analyst & Business Strategist）。
你將接收到使用者貼上的「CSV 格式」報表數據，以及使用者所選定的「分析重點」（可選）。

你的任務：
1. 深度解析與解構這些 CSV 數據。
2. 產出一份極具易讀性、結構清晰、富有商業洞察價值的專業分析報告。

請嚴格遵循以下 Markdown 輸出結構：

## 📊 數據基本資訊與特徵
- **數據集基本資訊**：分析總列數（rows）、總欄位數（columns）、關鍵指標。
- **數據品質反饋**：是否存在空值、異常數值、單位混亂等問題點。如果是乾淨的數據，也請給予肯定。

## 🔍 關鍵發現與核心趨勢
- **主要趨勢分析**：利用條列方式（配合 *粗體字* 或 \`代碼格式\`），點出數據中隱含的關鍵趨勢、週期性規律或異常波動。例如：哪個項目的成長最明顯？何時出現了銷售額的高峰與低谷？
- **異常波動/極值**：指出最大值、最小值、或是不符合常理的特殊數值（例如：某月份業績突然銳減，或某筆廣告轉換率異常高）。

## 💡 深度商業洞察 (因果分析與價值挖掘)
- 結合商業邏輯分析這些趨勢背後可能的原因。
- 例如：若「銷售額增加但利潤下滑」，可能原因為何？或者是「某渠道流量高但轉換率極低」的底層阻礙是什麼？

## 🚀 具體可行的行動與改善策略
請針對發現的問題，提供**至少 3 項**具備操作性、具體的改進策略或下一步落地行動方案（Next Steps）。請避免籠統的空話，例如「加強行銷」，應改為「針對 ROI 最高的前 2 個產品，在 Q3 集中對 25-34 歲社群受眾進行再行銷廣告投放」。

## 🔮 後續數據蒐集與追蹤建議
- 為了讓未來的分析能更加周全，建議使用者後續可以多增加記錄那些維度（例如：用戶歷史消費次數、來源渠道、特定行為點的時間戳記等）。

---
【專業分析師提醒】：
- 所有輸出內容、提示、專業術語和文字，都必須使用「繁體中文（台灣常用術語）」（例如使用「數據」而非「數據」、「欄位」而非「字段」、「專案」而非「項目」、「行銷」而非「營銷」）。
- 請保持客觀、中立且有建設性的語氣。`;

// AI Analysis API endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { csvData, focus } = req.body;

    if (!csvData || typeof csvData !== "string" || !csvData.trim()) {
      return res.status(400).json({ error: "請提供有效的 CSV 數據內容" });
    }

    const ai = getGemini();

    let userPromptString = `以下是待分析的 CSV 數據內容：\n\n\`\`\`csv\n${csvData}\n\`\`\`\n`;
    if (focus && typeof focus === "string" && focus.trim()) {
      userPromptString += `\n使用者的【分析重點設定】是：${focus}\n請特別針對這個重點維度進行更詳盡的數據鑽取與優化方案建議。`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPromptString,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // Lower temperature means more analytical and stable output
      },
    });

    const markdownResult = response.text;
    res.json({ result: markdownResult });
  } catch (err: any) {
    console.error("AI Analysis Error:", err);
    res.status(500).json({
      error: err.message || "伺服器內部發生錯誤，無法完成 AI 數據分析"
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
