// ============================================================
// src/sheetsApi.js
// Google Sheets API integration for SMAC Portal
//
// Google Sheet tabs:
//   Students
//   Marks
//   GraceMarks
//   Attendance
//   Remarks
//
// Configuration is loaded from .env
// ============================================================

const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

const BASE = "https://sheets.googleapis.com/v4/spreadsheets";

// ============================================================
// CONFIGURATION CHECK
// ============================================================

export function getSheetsConfig() {
  return {
    sheetId: SHEET_ID,
    apiKeyConfigured: Boolean(API_KEY),
  };
}

function validateConfig() {
  if (!SHEET_ID) {
    throw new Error(
      "Google Sheet ID is missing. Check VITE_GOOGLE_SHEET_ID in your .env file."
    );
  }

  if (!API_KEY) {
    throw new Error(
      "Google Sheets API key is missing. Check VITE_GOOGLE_SHEETS_API_KEY in your .env file."
    );
  }
}

// ============================================================
// LOW LEVEL: FETCH ONE SHEET TAB
// ============================================================

async function fetchRange(sheetName, range = "") {
  validateConfig();

  const ref = range
    ? `${sheetName}!${range}`
    : sheetName;

  const url =
    `${BASE}/${SHEET_ID}/values/` +
    `${encodeURIComponent(ref)}` +
    `?key=${encodeURIComponent(API_KEY)}`;

  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));

    const message =
      err?.error?.message ||
      `Google Sheets API error ${res.status}`;

    throw new Error(
      `Unable to read "${sheetName}": ${message}`
    );
  }

  const data = await res.json();

  return data.values || [];
}

// ============================================================
// CONVERT ROWS → OBJECTS
// ============================================================

function rowsToObjects(rows) {
  if (!rows || rows.length < 2) {
    return [];
  }

  const [headers, ...body] = rows;

  return body.map((row) => {
    const object = {};

    headers.forEach((header, index) => {
      const key = String(header || "").trim();

      if (!key) return;

      object[key] = String(row[index] ?? "").trim();
    });

    return object;
  });
}

// ============================================================
// NUMBER HELPER
// ============================================================

const num = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// ============================================================
// STUDENTS
// ============================================================

/**
 * Fetch all students from "Students".
 *
 * Expected columns:
 *
 * AdmissionNo
 * EnrollmentNo
 * StudentName
 * Class
 * Division
 * ParentName
 * ParentPhone
 * StudentUsername
 * StudentPassword
 * Status
 */

export async function fetchStudents() {
  const rows = await fetchRange("Students");
  return rowsToObjects(rows);
}

// ============================================================
// MARKS
// ============================================================

/**
 * Fetch all student marks.
 *
 * Expected columns:
 *
 * AdmissionNo
 * StudentName
 * Class
 * Subject
 * InternalMarks
 * MaxMarks
 *
 * Returns:
 * Map<admissionNo, {
 *   name,
 *   class,
 *   subjects: []
 * }>
 */

export async function fetchMarks() {
  const rows = await fetchRange("Marks");
  const records = rowsToObjects(rows);

  const map = new Map();

  for (const record of records) {
    const id = record.AdmissionNo;

    if (!id) continue;

    if (!map.has(id)) {
      map.set(id, {
        name: record.StudentName || "",
        class: record.Class || "",
        subjects: [],
      });
    }

    map.get(id).subjects.push({
      subject: record.Subject || "",
      marks: num(record.InternalMarks),
      max: num(record.MaxMarks),
    });
  }

  return map;
}

// ============================================================
// GRACE MARKS
// ============================================================

/**
 * Expected columns:
 *
 * AdmissionNo
 * Week
 * Category
 * ObtainedMarks
 * MaxMarks
 */

export async function fetchGraceMarks() {
  const rows = await fetchRange("GraceMarks");
  const records = rowsToObjects(rows);

  const map = new Map();

  for (const record of records) {
    const id = record.AdmissionNo;

    if (!id) continue;

    if (!map.has(id)) {
      map.set(id, {
        byWeek: {},
        maxPerCategory: {},
      });
    }

    const entry = map.get(id);

    const week = record.Week || "Week 1";
    const category = record.Category || "General";

    if (!entry.byWeek[week]) {
      entry.byWeek[week] = {};
    }

    entry.byWeek[week][category] =
      num(record.ObtainedMarks);

    entry.maxPerCategory[category] =
      num(record.MaxMarks);
  }

  return map;
}

// ============================================================
// ATTENDANCE
// ============================================================

/**
 * Expected columns:
 *
 * AdmissionNo
 * TotalDays
 * PresentDays
 */

export async function fetchAttendance() {
  const rows = await fetchRange("Attendance");
  const records = rowsToObjects(rows);

  const map = new Map();

  for (const record of records) {
    const id = record.AdmissionNo;

    if (!id) continue;

    const total = num(record.TotalDays);
    const present = num(record.PresentDays);

    map.set(id, {
      totalDays: total,
      presentDays: present,
      percent:
        total > 0
          ? ((present / total) * 100).toFixed(1)
          : "0.0",
    });
  }

  return map;
}

// ============================================================
// REMARKS
// ============================================================

/**
 * Expected columns:
 *
 * AdmissionNo
 * Strengths
 * Improvement
 * Suggestions
 */

export async function fetchRemarks() {
  const rows = await fetchRange("Remarks");
  const records = rowsToObjects(rows);

  const map = new Map();

  for (const record of records) {
    const id = record.AdmissionNo;

    if (!id) continue;

    map.set(id, {
      strengths: record.Strengths || "",
      improvement: record.Improvement || "",
      suggestions: record.Suggestions || "",
    });
  }

  return map;
}

// ============================================================
// FETCH ALL PORTAL DATA
// ============================================================

export async function fetchAllSheetData() {
  const [
    students,
    marks,
    graceMarks,
    attendance,
    remarks,
  ] = await Promise.all([
    fetchStudents(),
    fetchMarks(),
    fetchGraceMarks(),
    fetchAttendance(),
    fetchRemarks(),
  ]);

  return {
    students,
    marks,
    graceMarks,
    attendance,
    remarks,
  };
}

// ============================================================
// FETCH ONE STUDENT
// ============================================================

export async function fetchStudentData(admissionNo) {
  const [
    marksMap,
    graceMap,
    attendanceMap,
    remarksMap,
  ] = await Promise.all([
    fetchMarks(),
    fetchGraceMarks(),
    fetchAttendance(),
    fetchRemarks(),
  ]);

  const id = String(admissionNo).trim();

  const marks = marksMap.get(id);
  const grace = graceMap.get(id);
  const attendance = attendanceMap.get(id);
  const remarks = remarksMap.get(id);

  if (!marks) {
    return null;
  }

  // ----------------------------------------------------------
  // INTERNAL MARKS
  // ----------------------------------------------------------

  const totalInternal = marks.subjects.reduce(
    (total, subject) => total + subject.marks,
    0
  );

  const maxInternal = marks.subjects.reduce(
    (total, subject) => total + subject.max,
    0
  );

  // ----------------------------------------------------------
  // GRACE MARKS
  // ----------------------------------------------------------

  const graceObtained = {};
  const graceMax = grace?.maxPerCategory || {};
  const weeklyGrace = [];

  if (grace) {
    for (const [week, categories] of Object.entries(
      grace.byWeek
    )) {
      let weekTotal = 0;

      for (const [category, value] of Object.entries(
        categories
      )) {
        graceObtained[category] =
          (graceObtained[category] || 0) + value;

        weekTotal += value;
      }

      weeklyGrace.push({
        week,
        marks: weekTotal,
      });
    }
  }

  const totalGrace = Object.values(graceObtained).reduce(
    (total, value) => total + value,
    0
  );

  const maxGrace = Object.values(graceMax).reduce(
    (total, value) => total + value,
    0
  );

  // ----------------------------------------------------------
  // PERCENTAGES
  // ----------------------------------------------------------

  const internalPct =
    maxInternal > 0
      ? totalInternal / maxInternal
      : 0;

  const gracePct =
    maxGrace > 0
      ? totalGrace / maxGrace
      : 0;

  const overallPct = Number(
    (((internalPct + gracePct) / 2) * 100).toFixed(1)
  );

  // ----------------------------------------------------------
  // FINAL STUDENT DATA
  // ----------------------------------------------------------

  return {
    admissionNo: id,

    studentName: marks.name,
    class: marks.class,

    subjectMarks: marks.subjects,

    totalInternal,
    maxInternal,

    graceObtained,
    graceMax,

    totalGrace,
    maxGrace,

    weeklyGrace,

    overallPct,

    attendance:
      attendance || {
        totalDays: 0,
        presentDays: 0,
        percent: "—",
      },

    remarks:
      remarks || {
        strengths: "",
        improvement: "",
        suggestions: "",
      },
  };
}

// ============================================================
// TEST CONNECTION
// ============================================================

export async function testSheetsConnection() {
  try {
    validateConfig();

    await fetchRange("Students", "A1:H2");

    return {
      success: true,
      message: "Google Sheets connected successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error?.message ||
        "Unable to connect to Google Sheets.",
    };
  }
}
