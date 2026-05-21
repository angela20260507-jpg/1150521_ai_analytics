import { GoogleGenAI } from "@google/genai";
import type { Config } from "@netlify/functions";

// System Instructions
const SYSTEM_INSTRUCTION = `你是一位專業的資料分析師。
你的任務是接收一段 CSV 或表格結構的原始數據，理解其欄位意義，並提出精確的摘要報告與洞察。

請務必嚴格遵循以下 Markdown 輸出格式：

### 1. 📊 資料概況與欄位理解
簡要說明這份資料的主題是什麼，並列出關鍵欄位的意義。

### 2. ⚠️ 異常與缺值檢查
檢查資料中是否有空白（例如缺少數量或金額）、極端值（例如不合理的高價），並將發現的異常項目條列出來。若無異常，說明「未發現明顯異常」。

### 3. 📈 統計與趨勢洞察
請回答以下問題的總結：
- **總計概況**：銷售數量或總金額的大概加總。
- **分類表現**：哪個業務員或哪項產品表現最好？
- **業務建議**：從數據中給出 1-2 個可以執行的商業建議。

請以 Markdown 格式輸出，所有繁體中文部分必須使用**繁體中文**回覆，不要包含任何額外的問候語或結語。`;

let aiInstance: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY 尚未設定，請使用 Settings > Secrets 面板或環境變數設定金鑰。");
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

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { csvData, focus } = await req.json();

    if (!csvData || typeof csvData !== "string" || !csvData.trim()) {
      return new Response(JSON.stringify({ error: "請提供有效的 CSV 數據內容" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
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
        temperature: 0.2,
      },
    });

    const markdownResult = response.text;
    return new Response(JSON.stringify({ result: markdownResult }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("AI Analysis Error:", err);
    return new Response(JSON.stringify({ error: err.message || "伺服器內部發生錯誤，無法完成 AI 數據分析" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/api/analyze",
};
