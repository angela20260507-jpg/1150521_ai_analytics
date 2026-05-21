import React, { useState, useEffect, useRef } from "react";
import { 
  FileSpreadsheet, 
  Trash2, 
  Copy, 
  Check, 
  Upload, 
  Sparkles, 
  HelpCircle, 
  AlertCircle, 
  ArrowRight, 
  Download, 
  BarChart3, 
  Gauge, 
  FileText, 
  Database,
  RefreshCw
} from "lucide-react";
import Markdown from "react-markdown";
import { CSV_TEMPLATES, CSVTemplate } from "./templates";
import { parseCSV } from "./utils";
import { TablePreviewData } from "./types";

export default function App() {
  const [csvContent, setCsvContent] = useState<string>("");
  const [analysisFocus, setAnalysisFocus] = useState<string>("預設全面業務診斷與優化建議");
  const [customFocus, setCustomFocus] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<TablePreviewData | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Loading steps to reassure the user
  const loadingSteps = [
    "正在檢查試算表行與列的原始格式是否完整...",
    "正在對主要數據指標進行統計與排序分析...",
    "正在安全並行打包數據傳送至 Google Gemini 引擎...",
    "Gemini 正在解算欄位之間的商業因果與關聯...",
    "正在估測峰值業績、異常波動並進行精準診斷...",
    "正在草擬至少 3 項具敏捷與執行度的商業行動建議...",
    "報告生成中，正在優化繁體中文專業出版格式..."
  ];

  // Effect to handle CSV line and column real-time parsing
  useEffect(() => {
    const parsed = parseCSV(csvContent);
    setParsedData(parsed);
  }, [csvContent]);

  // Effect for loader step simulation and stopwatch
  useEffect(() => {
    if (isLoading) {
      setElapsedTime(0);
      setLoadingStep(0);
      
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading]);

  // Cycle through loading text every 4 seconds in loading state
  useEffect(() => {
    if (!isLoading) return;
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
    }, 4000);

    return () => clearInterval(stepInterval);
  }, [isLoading]);

  // Read File utility
  const handleReadFile = (file: File) => {
    if (!file) return;
    
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setErrorMessage("不支援的檔案格式，請上傳副檔名為 .csv 的檔案。");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setCsvContent(text);
        setErrorMessage("");
      }
    };
    reader.onerror = () => {
      setErrorMessage("讀取檔案時發生錯誤。");
    };
    reader.readAsText(file);
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleReadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleReadFile(e.target.files[0]);
    }
  };

  // Pre-load CSV Template
  const loadTemplate = (template: CSVTemplate) => {
    setCsvContent(template.csv);
    setAnalysisFocus(template.defaultFocus);
    setCustomFocus("");
    setErrorMessage("");
  };

  // AI triggering action
  const handleAnalyze = async () => {
    if (!csvContent.trim()) {
      setErrorMessage("請輸入或貼上 CSV 數據，或點擊下方範例進行載入！");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setAnalysisResult("");

    const finalFocus = analysisFocus === "客製化指定重點" ? customFocus : analysisFocus;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          csvData: csvContent,
          focus: finalFocus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "連線至後端分析伺服器失敗，請稍後再試。");
      }

      setAnalysisResult(data.result || "未傳回有效的報告。");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "分析過程中發生未知錯誤。");
    } finally {
      setIsLoading(false);
    }
  };

  // Clean data utility
  const handleCleanData = () => {
    if (!csvContent) return;
    const cleaned = csvContent
      .split("\n")
      .map(line => line.trim())
      .filter(line => line !== "")
      .join("\n");
    setCsvContent(cleaned);
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download markdown file
  const handleDownload = () => {
    if (!analysisResult) return;
    const blob = new Blob([analysisResult], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Gemini_AI_數據分析報告_${new Date().toISOString().slice(0, 10)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans flex flex-col selection:bg-slate-200">
      
      {/* Editorial Header Bar */}
      <header className="sticky top-0 z-50 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#1A1A1A]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-baseline gap-4">
            <h1 className="text-3xl sm:text-4xl font-serif italic tracking-tighter">
              智析 InsightEngine
            </h1>
            <span className="hidden sm:inline-block text-[11px] uppercase tracking-[0.2em] font-bold text-slate-400">
              AI 驅動的數據洞察工具
            </span>
          </div>
          
          <div className="flex items-center gap-6 text-[11px] uppercase tracking-widest font-bold">
            <span className="border-b border-[#1A1A1A] pb-1 cursor-default">
              數據工作台
            </span>
            <div className="flex items-center gap-1.5 font-sans font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 border border-emerald-100">
              <span className="h-1.5 w-1.5 bg-emerald-500 animate-pulse"></span>
              服務連接中
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid View Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Input Controls - Span 5 */}
        <section className="lg:col-span-5 flex flex-col gap-8" id="editorialInputPanel">
          
          {/* Box 1: CSV Source */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 block">
                01. 輸入 CSV 數據來源
              </label>
              {csvContent && (
                <button
                  onClick={() => {
                    setCsvContent("");
                    setErrorMessage("");
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-600 font-bold uppercase tracking-wider flex items-center gap-1 focus:outline-none cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  清空資料
                </button>
              )}
            </div>

            {/* Drag and Drop Zone */}
            <div
              className={`border border-[#1A1A1A]/10 p-5 mb-4 flex flex-col items-center justify-center transition-colors ${
                dragActive 
                  ? "bg-[#F5F5E9] border-[#1A1A1A]/30" 
                  : "bg-white hover:bg-slate-50"
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleFileSelect}
              />
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-700 text-center">
                拖曳試算表至此處 
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 text-center">
                或{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-indigo-600 font-bold hover:underline cursor-pointer focus:outline-none"
                >
                  尋找本機 CSV 檔案
                </button>
              </p>
            </div>

            {/* Textarea Source */}
            <div className="relative flex flex-col">
              <label htmlFor="csvTextarea" className="sr-only">CSV 資料來源輸入</label>
              <textarea
                id="csvTextarea"
                className="w-full h-64 bg-white border border-slate-200 p-4 font-mono text-xs leading-relaxed focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-xs resize-none"
                placeholder="貼上您的 CSV 資料標籤。例如：&#10;日期,產品類別,銷售額,客戶滿意度,地區&#10;2024-03-10,電子產品,24500,4.5,台北..."
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
              />
              {csvContent && (
                <div className="absolute bottom-3 right-3">
                  <button
                    onClick={handleCleanData}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 hover:border-slate-300 text-[10px] text-slate-600 font-bold cursor-pointer uppercase tracking-tight"
                    title="整理 CSV 空行與間距"
                  >
                    ✨ 淨化格式
                  </button>
                </div>
              )}
            </div>

            {/* CSV Stats Details */}
            {parsedData && (
              <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-dotted border-slate-200 pt-2 bg-[#F5F5F0]/50 px-2 py-1.5">
                <span className="flex items-center gap-1 font-bold">
                  <Database className="w-3 h-3 text-slate-400" />
                  已載入數據：
                </span>
                <span>
                  欄位 / 指標: <strong>{parsedData.headers.length}</strong> | 數據行數: <strong>{parsedData.rows.length}</strong> 筆
                </span>
              </div>
            )}
          </div>

          {/* Box 2: Quick Load Demos */}
          <div className="flex flex-col bg-[#F5F5F0] p-5 border border-slate-200/50">
            <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              02. 載入專業研究報表範例
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              無現成報表？點擊下方由行銷、業務與產品專家精選的高維度數據範本進行深度效果預覽：
            </p>
            <div className="flex flex-col gap-2">
              {CSV_TEMPLATES.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => loadTemplate(tpl)}
                  className="w-full text-left p-2.5 bg-white border border-slate-200/60 hover:border-[#1A1A1A] transition flex items-center justify-between group cursor-pointer focus:outline-none"
                >
                  <span className="pr-2">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition block">
                      {tpl.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">
                      {tpl.description}
                    </span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Box 3: Optimization Goal and Action */}
          <div className="flex flex-col bg-white border border-slate-200 p-5">
            <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-4 pb-1 border-b border-slate-100 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-slate-500" />
              03. 配置 AI 分析策略重點
            </h3>
            
            <div className="flex flex-col gap-1.5 mb-4">
              {[
                "預設全面業務診斷與優化建議",
                "行銷渠道 ROI 與漏斗轉換率優化",
                "找出異常暴漲與暴跌之主因剖析",
                "時間序列中的季節性淡旺季預測",
                "客製化指定重點"
              ].map((opt, i) => (
                <label 
                  key={i} 
                  className={`flex items-center gap-2.5 px-3 py-2 border text-xs cursor-pointer transition ${
                    analysisFocus === opt 
                      ? "border-[#1A1A1A] bg-[#FAF9F6] text-[#1A1A1A] font-bold" 
                      : "border-slate-100 hover:bg-slate-50 text-slate-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="analysisFocus"
                    value={opt}
                    checked={analysisFocus === opt}
                    onChange={(e) => setAnalysisFocus(e.target.value)}
                    className="h-3 w-3 accent-[#1A1A1A]"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            {analysisFocus === "客製化指定重點" && (
              <div className="mb-4 animate-fade-in">
                <label htmlFor="customFocusInput" className="sr-only">自訂重點描述</label>
                <textarea
                  id="customFocusInput"
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white resize-y"
                  placeholder="例：請特別針對淡季度（3、4月份）毛利低落的情況，提供極致改善對策。"
                  value={customFocus}
                  onChange={(e) => setCustomFocus(e.target.value)}
                />
              </div>
            )}

            {/* Error alerts */}
            {errorMessage && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-100 text-[#1A1A1A] rounded-none text-xs flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="font-sans font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Core trigger Button */}
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !csvContent.trim()}
              className={`w-full py-4 flex items-center justify-center gap-3 transition-all cursor-pointer ${
                isLoading 
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                  : csvContent.trim()
                    ? "bg-[#1A1A1A] text-[#FAF9F6] hover:bg-slate-800 active:scale-[0.98]" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                  <span className="text-xs font-bold tracking-widest uppercase">模型數據推演中 ({elapsedTime} 秒)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current text-[#FAF9F6]" />
                  <span className="text-xs font-bold tracking-widest uppercase">開始 AI 深度分析研判</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Right Column: AI Results Display Area - Span 7 */}
        <section className="lg:col-span-7 flex flex-col gap-6" id="editorialOutputPanel">
          
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 block">
                04. AI 智能分析洞察報告
              </label>

              {analysisResult && !isLoading && (
                <div className="flex items-center gap-2">
                  {/* Action Copy */}
                  <button
                    onClick={handleCopy}
                    className="text-[10px] font-bold uppercase border border-[#1A1A1A] px-3 py-1.5 bg-white hover:bg-[#1A1A1A] hover:text-[#FAF9F6] transition-colors cursor-pointer"
                  >
                    {copied ? "已複製至剪貼簿 ✓" : "一鍵複製 Markdown"}
                  </button>

                  {/* Action Download */}
                  <button
                    onClick={handleDownload}
                    className="text-[10px] font-bold uppercase border border-slate-300 px-3 py-1.5 bg-white hover:bg-[#1A1A1A] hover:text-[#FAF9F6] transition-colors cursor-pointer"
                  >
                    下載報告檔案
                  </button>
                </div>
              )}
            </div>

            {/* Content Display Core Card */}
            <div className="flex-1 bg-white border border-slate-200 p-6 sm:p-8 lg:p-10 min-h-[500px] flex flex-col shadow-xs overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Initial Blank Screen state */}
                {!isLoading && !analysisResult && (
                  <div className="h-full flex flex-col justify-center items-center py-10 max-w-md mx-auto text-center">
                    <div className="w-2 h-2 bg-[#1A1A1A] mb-4"></div>
                    <h3 className="text-lg font-serif italic mb-2">
                      “萬物皆有數，智慧引航向。”
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6">
                      系統已備齊最新的 Google Gemini 3.5 分析模型，請在左側輸入或挑選您欲深度探索的 CSV 表格。
                    </p>
                    
                    <div className="border border-[#1A1A1A]/10 bg-[#FAF9F6] p-5 text-left w-full">
                      <h4 className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-2.5 flex items-center gap-1">
                        核心生成價值指標
                      </h4>
                      <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                        <li>
                          <strong>📊 數值動態診斷：</strong> 檢測列數、空值缺漏、隱含特徵值品質
                        </li>
                        <li>
                          <strong>🔍 主要規律洞悉：</strong> 撈取高成長拐點、週期波動、區域/客群分佈
                        </li>
                        <li>
                          <strong>💡 商業因果剖析：</strong> 將死板數據轉化為生動且合理的商業邏輯分析
                        </li>
                        <li>
                          <strong>🚀 推薦回擊策略：</strong> 指派 3 項以上、精準至細分客群或管道的改善手段
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Loading state showing steps animation */}
                {isLoading && (
                  <div className="h-full flex flex-col justify-center items-center py-8 max-w-md mx-auto text-center">
                    <div className="relative mb-6">
                      <div className="w-10 h-10 border-2 border-slate-200"></div>
                      <div className="w-10 h-10 border-2 border-[#1A1A1A] border-t-transparent absolute top-0 left-0 animate-spin"></div>
                    </div>
                    
                    <h3 className="text-base font-serif italic mb-2 animate-pulse text-[#1A1A1A]">
                      InsightEngine 正在編譯您的報表資產
                    </h3>
                    
                    <span className="text-[9px] uppercase tracking-[0.2em] font-sans font-bold bg-[#FAF9F6] border border-slate-200 px-3 py-1 text-slate-500 mb-6 block">
                      計算耗時 {elapsedTime} 秒
                    </span>

                    {/* Progress tracking wrapper */}
                    <div className="w-full bg-[#FAF9F6] border border-slate-200/60 p-4 text-left">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3 border-b border-slate-200/50 pb-1.5">
                        研判執行進度：
                      </p>
                      
                      <div className="space-y-2">
                        {loadingSteps.map((step, idx) => {
                          const isCurrent = idx === loadingStep;
                          const isDone = idx < loadingStep;
                          return (
                            <div 
                              key={idx} 
                              className={`flex items-start gap-2.5 transition-all duration-300 ${
                                isCurrent ? "translate-x-1" : ""
                              }`}
                            >
                              <span className={`w-3.5 h-3.5 mt-0.5 rounded-none flex items-center justify-center text-[9px] font-bold ${
                                isDone 
                                  ? "bg-slate-950 text-[#FAF9F6]" 
                                  : isCurrent 
                                    ? "bg-indigo-600 text-[#FAF9F6] animate-pulse" 
                                    : "bg-slate-100 text-slate-300"
                              }`}>
                                {isDone ? "✓" : idx + 1}
                              </span>
                              <span className={`text-[11px] leading-relaxed ${
                                isCurrent 
                                  ? "text-[#1A1A1A] font-bold" 
                                  : isDone 
                                    ? "text-slate-400 font-normal" 
                                    : "text-slate-300"
                              }`}>
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Successful Gemini Output Report */}
                {analysisResult && !isLoading && (
                  <div className="markdown-body prose prose-slate max-w-none text-[#1A1A1A] animate-fade-in">
                    <Markdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-2xl sm:text-3xl font-serif mb-6 border-b border-slate-900 pb-3 mt-2 tracking-tight">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg sm:text-xl font-serif italic mt-8 mb-4 pb-1.5 border-b border-slate-200/60 text-[#1A1A1A] flex items-center gap-2">
                            <span className="w-3.5 h-[1.5px] bg-[#1A1A1A] inline-block shrink-0"></span>
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-6 mb-3 tracking-wide">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-slate-600 text-xs sm:text-sm leading-loose mb-5">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-none pl-0 space-y-3 mb-6 text-slate-600 text-xs sm:text-sm">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-5 space-y-3 mb-6 text-slate-600 text-xs sm:text-sm">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="relative pl-4 text-slate-600 leading-relaxed">
                            <span className="absolute left-0 top-2.5 w-1 h-1 bg-[#1A1A1A]"></span>
                            {children}
                          </li>
                        ),
                        code: ({ children }) => (
                          <code className="bg-[#F5F5F0] border border-slate-200/50 text-[#1A1A1A] px-1.5 py-0.5 font-mono text-xs">
                            {children}
                          </code>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-[#1A1A1A] pl-5 py-2.5 italic bg-[#F5F5F0]/60 text-slate-600 my-5 text-xs sm:text-sm">
                            {children}
                          </blockquote>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-6 border border-slate-200 shadow-xxs">
                            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="px-3.5 py-2.5 bg-[#FAF9F6] text-left text-xs font-bold text-slate-800 border-b border-slate-200">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="px-3.5 py-2 text-xs text-slate-600 border-b border-slate-100 font-mono">
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {analysisResult}
                    </Markdown>
                  </div>
                )}

              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Interactive Bottom Section: Clean Editorial Datatable Preview */}
      {parsedData && (
        <section className="bg-white border-t border-[#1A1A1A]/10 mt-auto py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-[11px] font-bold text-slate-400 tracking-[0.2em] uppercase flex items-center gap-2 mb-4">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              數據實時排版網格 (僅預覽前 5 筆)：
            </h3>
            
            <div className="overflow-x-auto border border-slate-200 max-h-[220px]">
              <table className="min-w-full divide-y divide-[#1A1A1A]/10 table-fixed">
                <thead className="bg-[#FAF9F6] sticky top-0 border-b border-[#1A1A1A]/10">
                  <tr>
                    {parsedData.headers.map((header, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left text-[11px] font-bold text-slate-800 uppercase tracking-wider min-w-[130px] max-w-[200px] truncate"
                      >
                        {header || `欄位 ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 font-mono text-[11px] text-slate-600">
                  {parsedData.rows.slice(0, 5).map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-slate-50/50 transition duration-150">
                      {parsedData.headers.map((_, colIdx) => (
                        <td
                          key={colIdx}
                          className="px-4 py-3 truncate max-w-[200px]"
                        >
                          {row[colIdx] !== undefined ? row[colIdx] : ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {parsedData.rows.length > 5 && (
                    <tr>
                      <td
                        colSpan={parsedData.headers.length}
                        className="px-4 py-2.5 bg-[#FAF9F6]/50 text-left text-[11px] font-sans italic text-slate-400"
                      >
                        (其餘 {parsedData.rows.length - 5} 筆數據行未顯示於預覽中，但已全數封包準備供 AI 計算)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Structured Footer */}
      <footer className="bg-[#1A1A1A] text-[#FAF9F6]/60 border-t border-[#1A1A1A]/10 text-[10px] tracking-[0.25em] font-sans font-bold uppercase py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col gap-1.5">
            <span className="text-[#FAF9F6] font-serif italic tracking-wide text-sm normal-case">
              &copy; INSIGHT ENGINE STUDIO
            </span>
            <span className="text-[9px] text-[#FAF9F6]/40 tracking-wider">
              極限數據洞察，由 Google Gemini 技術提供全天候分析運算
            </span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4 text-[#FAF9F6]/40 font-mono">
            <span>專業版 v1.2</span>
            <span>|</span>
            <span>隱私保護安全套件</span>
            <span>|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-none inline-block"></span>
              延處 42MS
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
