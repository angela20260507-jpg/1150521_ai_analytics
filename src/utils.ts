import { TablePreviewData } from "./types";

/**
 * Parses a simple CSV string into header columns and row data
 */
export function parseCSV(csvString: string): TablePreviewData | null {
  if (!csvString || !csvString.trim()) {
    return null;
  }

  try {
    const lines = csvString.split(/\r?\n/);
    const validLines = lines.filter((line) => line.trim().length > 0);
    
    if (validLines.length === 0) {
      return null;
    }

    // Helper to parse each CSV line handling simple quotes
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(validLines[0]);
    const rows = validLines.slice(1).map((line) => parseLine(line));

    return {
      headers,
      rows,
    };
  } catch (error) {
    console.error("Error parsing CSV:", error);
    return null;
  }
}
