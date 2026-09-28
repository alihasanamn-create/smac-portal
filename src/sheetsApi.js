// ============================================================
// src/sheetsApi.js
// Google Sheets API integration for SMAC Portal
//
// HOW IT WORKS:
//   Teachers fill a Google Sheet → this file fetches it →
//   the app auto-updates student marks, grace marks, attendance.
//
// SETUP STEPS are in GOOGLE_SHEETS_SETUP.md (included in zip)
// ============================================================

// ─── PASTE YOUR VALUES HERE ─────────────────────────────────
const SHEET_ID   = "YOUR_GOOGLE_SHEET_ID";   // from the sheet URL
const API_KEY    = "YOUR_GOOGLE_API_KEY";     // from Google Cloud Console
// ─────────────────────────────────────────────────────────────

const BASE = "https://sheets.googleapis.com/v4/spreadsheets";

// ── low-level: fetch one named range from the sheet ──────────
async function fetchRange(sheetName, range = "") {
  const ref = range ? `${sheetName}!${range}` : sheetName;
  const url = `${BASE}/${SHEET_ID}/values/${encodeURIComponent(ref)}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Sheets API error ${res.status}`);
  }
  const data = await res.json();
  return data.values || [];   // array of arrays (rows × cols)
}

// ── turn raw rows into objects using first row as header ──────
function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const [headers, ...body] = rows;
  return body.map((row) =>
    Object.fromEntries(headers.map((h, i) => [h.trim(), (row[i] ?? "").trim()]))
  );
}

// ── helper: parse a number or return 0 ───────────────────────
const num = (v) => parseFloat(v) || 0;

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Fetch all student marks from the "Marks" sheet tab.
 *
 * Expected columns (row 1 = header):
 *   AdmissionNo | StudentName | Class | Subject | InternalMarks | MaxMarks
 *
 * Returns:
 *   Map<admissionNo, { name, class, subjects: [{ subject, marks, max }] }>
 */
export async function fetchMarks() {
  const rows = await fetchRange("Marks");
  const records = rowsToObjects(rows);

  const map = new Map();
  for (const r of records) {
    const id = r.AdmissionNo;
    if (!id) continue;
    if (!map.has(id)) {
      map.set(id, {
        name: r.StudentName,
        class: r.Class,
        subjects: [],
      });
    }
    map.get(id).subjects.push({
      subject: r.Subject,
      marks: num(r.InternalMarks),
      max: num(r.MaxMarks),
    });
  }
  return map;
}

/**
 * Fetch grace marks from the "GraceMarks" sheet tab.
 *
 * Expected columns:
 *   AdmissionNo | Week | Category | ObtainedMarks | MaxMarks
 *
 * Returns:
 *   Map<admissionNo, { byWeek: { weekLabel: { category: obtained } }, maxPerCategory: { category: max } }>
 */
export async function fetchGraceMarks() {
  const rows = await fetchRange("GraceMarks");
  const records = rowsToObjects(rows);

  const map = new Map();
  for (const r of records) {
    const id = r.AdmissionNo;
    if (!id) continue;
    if (!map.has(id)) map.set(id, { byWeek: {}, maxPerCategory: {} });
    const entry = map.get(id);

    const week = r.Week || "Week 1";
    if (!entry.byWeek[week]) entry.byWeek[week] = {};
    entry.byWeek[week][r.Category] = num(r.ObtainedMarks);
    entry.maxPerCategory[r.Category] = num(r.MaxMarks);
  }
  return map;
}

/**
 * Fetch attendance from "Attendance" sheet tab.
 *
 * Expected columns:
 *   AdmissionNo | TotalDays | PresentDays
 *
 * Returns:
 *   Map<admissionNo, { totalDays, presentDays, percent }>
 */
export async function fetchAttendance() {
  const rows = await fetchRange("Attendance");
  const records = rowsToObjects(rows);

  const map = new Map();
  for (const r of records) {
    const id = r.AdmissionNo;
    if (!id) continue;
    const total   = num(r.TotalDays);
    const present = num(r.PresentDays);
    map.set(id, {
      totalDays: total,
      presentDays: present,
      percent: total > 0 ? ((present / total) * 100).toFixed(1) : "0.0",
    });
  }
  return map;
}

/**
 * Fetch teacher remarks from "Remarks" sheet tab.
 *
 * Expected columns:
 *   AdmissionNo | Strengths | Improvement | Suggestions
 *
 * Returns:
 *   Map<admissionNo, { strengths, improvement, suggestions }>
 */
export async function fetchRemarks() {
  const rows = await fetchRange("Remarks");
  const records = rowsToObjects(rows);

  const map = new Map();
  for (const r of records) {
    const id = r.AdmissionNo;
    if (!id) continue;
    map.set(id, {
      strengths:   r.Strengths   || "",
      improvement: r.Improvement || "",
      suggestions: r.Suggestions || "",
    });
  }
  return map;
}

/**
 * Fetch ALL data for one student in one go.
 * Returns null if no marks row found for that admission number.
 */
export async function fetchStudentData(admissionNo) {
  const [marksMap, graceMap, attendanceMap, remarksMap] = await Promise.all([
    fetchMarks(),
    fetchGraceMarks(),
    fetchAttendance(),
    fetchRemarks(),
  ]);

  const marks      = marksMap.get(admissionNo);
  const grace      = graceMap.get(admissionNo);
  const attendance = attendanceMap.get(admissionNo);
  const remarks    = remarksMap.get(admissionNo);

  if (!marks) return null;

  // compute totals
  const totalInternal = marks.subjects.reduce((a, s) => a + s.marks, 0);
  const maxInternal   = marks.subjects.reduce((a, s) => a + s.max,   0);

  const graceObtained     = {};
  const graceMax          = grace?.maxPerCategory || {};
  const weeklyGrace       = [];

  if (grace) {
    for (const [week, cats] of Object.entries(grace.byWeek)) {
      let weekTotal = 0;
      for (const [cat, val] of Object.entries(cats)) {
        graceObtained[cat] = (graceObtained[cat] || 0) + val;
        weekTotal += val;
      }
      weeklyGrace.push({ week, marks: weekTotal });
    }
  }

  const totalGrace = Object.values(graceObtained).reduce((a, b) => a + b, 0);
  const maxGrace   = Object.values(graceMax).reduce((a, b) => a + b, 0);

  const internalPct = maxInternal > 0 ? totalInternal / maxInternal : 0;
  const gracePct    = maxGrace    > 0 ? totalGrace    / maxGrace    : 0;
  const overallPct  = Number((((internalPct + gracePct) / 2) * 100).toFixed(1));

  return {
    subjectMarks:   marks.subjects,
    totalInternal,
    maxInternal,
    graceObtained,
    graceMax,
    totalGrace,
    maxGrace,
    weeklyGrace,
    overallPct,
    attendance: attendance ?? { percent: "—" },
    remarks:    remarks   ?? { strengths: "", improvement: "", suggestions: "" },
  };
}
