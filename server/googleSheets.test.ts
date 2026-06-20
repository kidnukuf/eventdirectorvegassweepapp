/**
 * Tests for server/googleSheets.ts
 * Uses vi.mock to stub execSync so no real gws CLI calls are made.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock child_process before importing the module under test
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

import { execSync } from "child_process";
import { writeQRCodesToSheet, normalizeSquadTime } from "./googleSheets";

const mockExecSync = execSync as unknown as ReturnType<typeof vi.fn>;

// ── normalizeSquadTime ────────────────────────────────────────────────────────
describe("normalizeSquadTime", () => {
  it("converts M3 to Monday 3pm", () => {
    expect(normalizeSquadTime("M3")).toBe("Monday 3pm");
  });

  it("converts M10 to Monday 10am", () => {
    expect(normalizeSquadTime("M10")).toBe("Monday 10am");
  });

  it("converts T10 to Tuesday 10am", () => {
    expect(normalizeSquadTime("T10")).toBe("Tuesday 10am");
  });

  it("is case-insensitive", () => {
    expect(normalizeSquadTime("m3")).toBe("Monday 3pm");
    expect(normalizeSquadTime("m10")).toBe("Monday 10am");
    expect(normalizeSquadTime("t10")).toBe("Tuesday 10am");
  });

  it("returns the original value for unknown codes", () => {
    expect(normalizeSquadTime("W5")).toBe("W5");
  });

  it("returns empty string for null/undefined", () => {
    expect(normalizeSquadTime(null)).toBe("");
    expect(normalizeSquadTime(undefined)).toBe("");
  });
});

// ── writeQRCodesToSheet ───────────────────────────────────────────────────────
describe("writeQRCodesToSheet", () => {
  const APP_ORIGIN = "https://test.example.com";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when both tokens are null", async () => {
    await writeQRCodesToSheet({
      firstName: "John",
      lastName: "Doe",
      laneNumber: 5,
      banquetToken: null,
      poolPartyToken: null,
      appOrigin: APP_ORIGIN,
    });
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  it("finds the bowler row and writes QR URLs when tokens are present", async () => {
    // First call: gws values get (read all rows to find bowler)
    const fakeRows = [
      ["Phone", "Email", "Squad Time", "Lane #", "Center", "Team #", "Captain", "First Name", "Last Name"],
      ["", "", "Monday 3pm", "5", "Center A", "1", "y", "John", "Doe"],
    ];
    mockExecSync
      .mockReturnValueOnce(JSON.stringify({ values: fakeRows })) // get rows
      .mockReturnValueOnce(JSON.stringify({ totalUpdatedCells: 2 })); // batchUpdate

    await writeQRCodesToSheet({
      firstName: "John",
      lastName: "Doe",
      laneNumber: 5,
      banquetToken: "abc123",
      poolPartyToken: "xyz789",
      appOrigin: APP_ORIGIN,
    });

    // Should have called execSync twice: once to read, once to write
    expect(mockExecSync).toHaveBeenCalledTimes(2);

    // The second call should be the batchUpdate with both QR URLs
    const batchCall = mockExecSync.mock.calls[1][0] as string;
    expect(batchCall).toContain("batchUpdate");
    expect(batchCall).toContain("abc123");
    expect(batchCall).toContain("xyz789");
  });

  it("logs a warning and does not throw when bowler is not found in sheet", async () => {
    // Return rows that don't contain our bowler
    const fakeRows = [
      ["Phone", "Email", "Squad Time", "Lane #", "Center", "Team #", "Captain", "First Name", "Last Name"],
      ["", "", "Monday 3pm", "5", "Center A", "1", "y", "Jane", "Smith"],
    ];
    mockExecSync.mockReturnValueOnce(JSON.stringify({ values: fakeRows }));

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      writeQRCodesToSheet({
        firstName: "John",
        lastName: "Doe",
        laneNumber: 5,
        banquetToken: "abc123",
        poolPartyToken: null,
        appOrigin: APP_ORIGIN,
      })
    ).resolves.toBeUndefined(); // must not throw

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("not found in sheet"));
    warnSpy.mockRestore();
  });

  it("does not throw when gws CLI returns an error", async () => {
    mockExecSync.mockImplementation(() => {
      throw new Error("gws: command not found");
    });

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      writeQRCodesToSheet({
        firstName: "John",
        lastName: "Doe",
        laneNumber: 5,
        banquetToken: "abc123",
        poolPartyToken: null,
        appOrigin: APP_ORIGIN,
      })
    ).resolves.toBeUndefined(); // must not throw

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
