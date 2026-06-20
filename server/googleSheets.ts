/**
 * Google Sheets integration helper
 * Uses the gws CLI (Google Workspace CLI) which is pre-authenticated via the
 * Google Drive connector in Manus. No API keys or service account JSON needed.
 *
 * Sheet: TeamChallenge2026_Ledger_Final
 * Spreadsheet ID: 1Azwl5Lmj4BK69htTXB0PmWO8ww6jY_zz7OtmJjHSiFg
 *
 * Column layout (1-indexed):
 *   A=Phone, B=Email, C=Squad Time, D=Lane #, E=Center,
 *   F=Team #, G=Captain, H=First Name, I=Last Name, ...
 *   W=Banquet QR URL, X=Pool Party QR URL
 */

import { execSync } from "child_process";

const SPREADSHEET_ID = "1Azwl5Lmj4BK69htTXB0PmWO8ww6jY_zz7OtmJjHSiFg";
const SHEET_NAME = "TeamChallenge2026_Ledger_Final";

// Column indices (0-based for array, 1-based for sheet)
const COL_FIRST_NAME = 7;  // H (0-based: 7)
const COL_LAST_NAME  = 8;  // I (0-based: 8)
const COL_LANE       = 3;  // D (0-based: 3)
const COL_BANQUET_QR = 22; // W (0-based: 22)
const COL_POOL_QR    = 23; // X (0-based: 23)

function gws(params: object, body?: object): unknown {
  const args = ["gws", "sheets", "spreadsheets", "values"];
  if (body) {
    args.push("batchUpdate");
    args.push("--params", JSON.stringify({ spreadsheetId: SPREADSHEET_ID }));
    args.push("--json", JSON.stringify(body));
  } else {
    args.push("get");
    args.push("--params", JSON.stringify({ spreadsheetId: SPREADSHEET_ID, ...params }));
  }
  const result = execSync(args.join(" "), { encoding: "utf-8", timeout: 15000 });
  return JSON.parse(result);
}

/**
 * Find the row number (1-indexed) for a bowler by first name, last name, and lane number.
 * Returns null if not found.
 */
async function findBowlerRow(
  firstName: string,
  lastName: string,
  laneNumber: number | null
): Promise<number | null> {
  try {
    // Read all rows: columns H (First Name), I (Last Name), D (Lane #)
    const data = gws({ range: `${SHEET_NAME}!A1:Z` }) as { values?: string[][] };
    const rows = data.values ?? [];

    for (let i = 1; i < rows.length; i++) { // skip header row
      const row = rows[i];
      const rowFirst = (row[COL_FIRST_NAME] ?? "").trim().toLowerCase();
      const rowLast  = (row[COL_LAST_NAME]  ?? "").trim().toLowerCase();
      const rowLane  = parseInt(row[COL_LANE] ?? "0", 10);

      const nameMatch = rowFirst === firstName.trim().toLowerCase()
                     && rowLast  === lastName.trim().toLowerCase();
      const laneMatch = laneNumber == null || rowLane === laneNumber;

      if (nameMatch && laneMatch) {
        return i + 1; // 1-indexed sheet row
      }
    }
    return null;
  } catch (err) {
    console.error("[googleSheets] findBowlerRow error:", err);
    return null;
  }
}

/**
 * Write the Banquet QR URL and Pool Party QR URL into the bowler's row.
 * Called after a bowler successfully submits contact info (sign-up confirmed).
 *
 * @param firstName      Bowler's legal first name
 * @param lastName       Bowler's legal last name
 * @param laneNumber     Bowler's lane number (used to disambiguate same-name bowlers)
 * @param banquetQRUrl   Full URL for the banquet QR code (e.g. https://…/scan/banquet/TOKEN)
 * @param poolPartyQRUrl Full URL for the pool party QR code (e.g. https://…/scan/pool/TOKEN)
 */
export async function writeQRCodesToSheet(params: {
  firstName: string;
  lastName: string;
  laneNumber: number | null;
  banquetToken: string | null;
  poolPartyToken: string | null;
  appOrigin: string;
}): Promise<void> {
  const { firstName, lastName, laneNumber, banquetToken, poolPartyToken, appOrigin } = params;

  const banquetQRUrl   = banquetToken   ? `${appOrigin}/scan/banquet/${banquetToken}`   : null;
  const poolPartyQRUrl = poolPartyToken ? `${appOrigin}/scan/pool/${poolPartyToken}`     : null;

  if (!banquetQRUrl && !poolPartyQRUrl) return; // nothing to write

  try {
    const rowNum = await findBowlerRow(firstName, lastName, laneNumber);
    if (!rowNum) {
      console.warn(`[googleSheets] Bowler not found in sheet: ${firstName} ${lastName} lane ${laneNumber}`);
      return;
    }

    // Build batch update — write W and X columns
    const updateData: { range: string; values: string[][] }[] = [];

    if (banquetQRUrl) {
      updateData.push({
        range: `${SHEET_NAME}!W${rowNum}`,
        values: [[banquetQRUrl]],
      });
    }
    if (poolPartyQRUrl) {
      updateData.push({
        range: `${SHEET_NAME}!X${rowNum}`,
        values: [[poolPartyQRUrl]],
      });
    }

    const body = {
      valueInputOption: "RAW",
      data: updateData,
    };

    gws({}, body);
    console.log(`[googleSheets] QR URLs written for ${firstName} ${lastName} (row ${rowNum})`);
  } catch (err) {
    // Never throw — sheet write-back must never block the user flow
    console.error("[googleSheets] writeQRCodesToSheet error (non-fatal):", err);
  }
}

/**
 * Normalize squad time codes to human-readable labels.
 * Used for display in the app UI.
 */
export function normalizeSquadTime(raw: string | null): string {
  if (!raw) return "";
  const map: Record<string, string> = {
    M3:  "Monday 3pm",
    M10: "Monday 10am",
    T10: "Tuesday 10am",
  };
  return map[raw.trim().toUpperCase()] ?? raw;
}
