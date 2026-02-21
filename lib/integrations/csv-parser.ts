/**
 * CSV Parser — task 7.8
 *
 * Handles real-world factory CSV exports:
 *  - Quoted fields containing commas, newlines, and escaped quotes ("")
 *  - Auto-detects delimiter: comma, semicolon, tab, pipe
 *  - Strips UTF-8 BOM
 *  - Windows (\r\n) and Unix (\n) line endings
 *  - Optional header normalisation (trim, lowercase, collapse spaces)
 *  - Skips blank lines
 */

export type CsvRow = Record<string, string>;

export type CsvParseOptions = {
  delimiter?: "," | ";" | "\t" | "|" | "auto";
  normalizeHeaders?: boolean; // trim + lowercase headers (default: true)
  skipEmptyLines?: boolean;   // default: true
};

// ─── Delimiter detection ──────────────────────────────────────────────────────

function detectDelimiter(firstLine: string): "," | ";" | "\t" | "|" {
  const candidates: Array<["," | ";" | "\t" | "|", number]> = [
    [",",  (firstLine.match(/,/g) ?? []).length],
    [";",  (firstLine.match(/;/g) ?? []).length],
    ["\t", (firstLine.match(/\t/g) ?? []).length],
    ["|",  (firstLine.match(/\|/g) ?? []).length],
  ];
  return candidates.sort((a, b) => b[1] - a[1])[0][0];
}

// ─── Core tokeniser ───────────────────────────────────────────────────────────

/**
 * Splits a single CSV line into tokens respecting RFC 4180 quoting.
 * Handles: "field with, comma", "field with ""escaped"" quotes"
 */
function tokenize(line: string, delimiter: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        // Peek ahead — doubled quote is an escaped quote
        if (line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (line.slice(i, i + delimiter.length) === delimiter) {
        tokens.push(current);
        current = "";
        i += delimiter.length;
      } else {
        current += ch;
        i++;
      }
    }
  }

  tokens.push(current);
  return tokens;
}

// ─── Multi-line aware splitter ────────────────────────────────────────────────

/**
 * Splits raw CSV text into logical lines, keeping quoted newlines intact.
 */
function splitLines(raw: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (!inQuotes && ch === "\n") {
      lines.push(current.replace(/\r$/, ""));
      current = "";
    } else {
      current += ch;
    }
  }

  if (current.trim()) lines.push(current.replace(/\r$/, ""));
  return lines;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parses a CSV string into an array of row objects keyed by header name.
 *
 * @example
 * const rows = parseCsv(fileContent);
 * // [{ po_number: "PO-001", status: "in_progress", ... }, ...]
 */
export function parseCsv(raw: string, options: CsvParseOptions = {}): CsvRow[] {
  const {
    delimiter = "auto",
    normalizeHeaders = true,
    skipEmptyLines = true,
  } = options;

  // Strip UTF-8 BOM
  const cleaned = raw.replace(/^\uFEFF/, "");

  const allLines = splitLines(cleaned);
  const lines = skipEmptyLines ? allLines.filter((l) => l.trim() !== "") : allLines;

  if (lines.length < 2) return [];

  const sep = delimiter === "auto" ? detectDelimiter(lines[0]) : delimiter;

  const rawHeaders = tokenize(lines[0], sep);
  const headers = normalizeHeaders
    ? rawHeaders.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"))
    : rawHeaders.map((h) => h.trim());

  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = tokenize(lines[i], sep);
    const row: CsvRow = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] ?? "").trim();
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Converts an array of objects to a CSV string.
 * Useful for export features (task 3.11 / future procurement exports).
 */
export function toCsv(rows: CsvRow[], delimiter: "," | ";" | "\t" = ","): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const escape = (val: string) =>
    val.includes(delimiter) || val.includes('"') || val.includes("\n")
      ? `"${val.replace(/"/g, '""')}"`
      : val;

  const headerLine = headers.map(escape).join(delimiter);
  const dataLines = rows.map((row) =>
    headers.map((h) => escape(row[h] ?? "")).join(delimiter)
  );

  return [headerLine, ...dataLines].join("\n");
}
