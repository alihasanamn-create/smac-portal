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

const normalizeSheetName = (value) =>
  String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

function getField(record, ...names) {
  const wanted = new Set(names.map(normalizeSheetName));
  const entry = Object.entries(record || {}).find(([key]) => wanted.has(normalizeSheetName(key)));
  return entry?.[1] ?? "";
}

function recordsForTab(tabs, ...aliases) {
  const wanted = new Set(aliases.map(normalizeSheetName));
  const tab = tabs.find((item) => wanted.has(normalizeSheetName(item.name)));
  return rowsToObjects(tab?.rawRows || []);
}

function listValues(value) {
  return String(value || "").split(/[;,|]/).map((item) => item.trim()).filter(Boolean);
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

function buildMarksMap(records) {
  const map = new Map();

  for (const record of records) {
    const id = String(getField(record, "AdmissionNo", "AdmissionNumber")).trim();

    if (!id) continue;

    if (!map.has(id)) {
      map.set(id, {
        name: getField(record, "StudentName", "Name"),
        class: getField(record, "Class", "Grade"),
        subjects: [],
      });
    }

    map.get(id).subjects.push({
      subject: getField(record, "Subject"),
      marks: num(getField(record, "InternalMarks", "Marks", "ObtainedMarks")),
      max: num(getField(record, "MaxMarks", "MaximumMarks")),
    });
  }

  return map;
}

export async function fetchMarks() {
  return buildMarksMap(rowsToObjects(await fetchRange("Marks")));
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

function buildGraceMap(records) {
  const map = new Map();

  for (const record of records) {
    const id = String(getField(record, "AdmissionNo", "AdmissionNumber")).trim();

    if (!id) continue;

    if (!map.has(id)) {
      map.set(id, {
        byWeek: {},
        maxPerCategory: {},
      });
    }

    const entry = map.get(id);

    const week = getField(record, "Week") || "Week 1";
    const category = getField(record, "Category") || "General";

    if (!entry.byWeek[week]) {
      entry.byWeek[week] = {};
    }

    entry.byWeek[week][category] =
      num(getField(record, "ObtainedMarks", "GraceMarks", "Marks"));

    entry.maxPerCategory[category] =
      num(getField(record, "MaxMarks", "MaximumMarks"));
  }

  return map;
}

export async function fetchGraceMarks() {
  return buildGraceMap(rowsToObjects(await fetchRange("GraceMarks")));
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

function buildAttendanceMap(records) {
  const map = new Map();

  for (const record of records) {
    const id = String(getField(record, "AdmissionNo", "AdmissionNumber")).trim();

    if (!id) continue;

    const total = num(getField(record, "TotalDays", "SchoolDays"));
    const present = num(getField(record, "PresentDays", "DaysPresent"));

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

export async function fetchAttendance() {
  return buildAttendanceMap(rowsToObjects(await fetchRange("Attendance")));
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

function buildRemarksMap(records) {
  const map = new Map();

  for (const record of records) {
    const id = String(getField(record, "AdmissionNo", "AdmissionNumber")).trim();

    if (!id) continue;

    map.set(id, {
      strengths: getField(record, "Strengths"),
      improvement: getField(record, "Improvement", "AreasForImprovement"),
      suggestions: getField(record, "Suggestions", "TeacherRemarks", "Remarks"),
    });
  }

  return map;
}

export async function fetchRemarks() {
  return buildRemarksMap(rowsToObjects(await fetchRange("Remarks")));
}

// ============================================================
// FETCH ALL PORTAL DATA
// ============================================================

function quoteTabRange(title) {
  return `'${String(title).replace(/'/g, "''")}'!A:ZZ`;
}

async function fetchWorkbookTabs() {
  validateConfig();
  const metadataUrl = `${BASE}/${encodeURIComponent(SHEET_ID)}?fields=sheets.properties.title&key=${encodeURIComponent(API_KEY)}`;
  const metadataResponse = await fetch(metadataUrl);
  if (!metadataResponse.ok) {
    const error = await metadataResponse.json().catch(() => ({}));
    throw new Error(error?.error?.message || `Unable to list workbook tabs (${metadataResponse.status}).`);
  }

  const metadata = await metadataResponse.json();
  const titles = (metadata.sheets || []).map((sheet) => sheet.properties?.title).filter(Boolean);
  if (!titles.length) throw new Error("The connected workbook has no readable tabs.");

  const tabs = [];
  for (let offset = 0; offset < titles.length; offset += 20) {
    const batchTitles = titles.slice(offset, offset + 20);
    const params = new URLSearchParams({
      key: API_KEY,
      majorDimension: "ROWS",
      valueRenderOption: "FORMATTED_VALUE",
    });
    batchTitles.forEach((title) => params.append("ranges", quoteTabRange(title)));

    const valuesUrl = `${BASE}/${encodeURIComponent(SHEET_ID)}/values:batchGet?${params.toString()}`;
    const valuesResponse = await fetch(valuesUrl);
    if (!valuesResponse.ok) {
      const error = await valuesResponse.json().catch(() => ({}));
      throw new Error(error?.error?.message || `Unable to read workbook tabs (${valuesResponse.status}).`);
    }

    const result = await valuesResponse.json();
    batchTitles.forEach((title, index) => {
      const rawRows = result.valueRanges?.[index]?.values || [];
      tabs.push({
        name: title,
        headers: (rawRows[0] || []).map((header) => String(header || "").trim()),
        rawRows,
        rows: rowsToObjects(rawRows),
      });
    });
  }

  return tabs;
}

function buildStaff(records) {
  const staffByKey = new Map();
  const classes = ["S1", "S2", "S3", "S4"];

  for (const record of records) {
    const username = String(getField(record, "Username", "StaffUsername")).trim();
    const id = String(getField(record, "StaffID", "ID", "EmployeeID") || username || getField(record, "Name", "StaffName")).trim();
    if (!id) continue;

    const key = username || id;
    const entry = staffByKey.get(key) || {
      id,
      name: getField(record, "Name", "StaffName"),
      phone: getField(record, "Phone", "PhoneNumber"),
      photo: getField(record, "Photo", "PhotoURL") || null,
      username,
      password: getField(record, "Password", "StaffPassword"),
      positions: [],
      classTeacherOf: "",
      duties: [],
      teachingSubjects: Object.fromEntries(classes.map((className) => [className, []])),
    };

    entry.positions = [...new Set([...entry.positions, ...String(getField(record, "Positions", "Position", "Role")).split(/[;,|]/).map((value) => value.trim()).filter(Boolean)])];
    entry.duties = [...new Set([...entry.duties, ...String(getField(record, "Duties")).split(/[;,|]/).map((value) => value.trim()).filter(Boolean)])];
    entry.classTeacherOf = entry.classTeacherOf || String(getField(record, "ClassTeacherOf", "ClassTeacher")).trim();

    for (const className of classes) {
      const subjects = String(getField(record, `${className}Subjects`, `${className}TeachingSubjects`)).split(/[;,|]/).map((value) => value.trim()).filter(Boolean);
      entry.teachingSubjects[className] = [...new Set([...entry.teachingSubjects[className], ...subjects])];
    }

    const className = String(getField(record, "Class", "Grade")).trim();
    const subject = String(getField(record, "Subject", "TeachingSubject")).trim();
    if (classes.includes(className) && subject) {
      entry.teachingSubjects[className] = [...new Set([...entry.teachingSubjects[className], subject])];
    }

    staffByKey.set(key, entry);
  }

  return [...staffByKey.values()];
}

export async function fetchAllSheetData() {
  const tabs = await fetchWorkbookTabs();
  const students = recordsForTab(tabs, "Students", "Student");
  const staff = buildStaff(recordsForTab(tabs, "Staff", "Teachers", "Teacher", "Faculty"));
  const marks = buildMarksMap(recordsForTab(tabs, "Marks", "Mark", "Grades", "InternalMarks"));
  const graceMarks = buildGraceMap(recordsForTab(tabs, "GraceMarks", "GraceMark", "Grace Marks"));
  const attendance = buildAttendanceMap(recordsForTab(tabs, "Attendance", "Attendances"));
  const remarks = buildRemarksMap(recordsForTab(tabs, "Remarks", "Remark", "TeacherRemarks"));
  return { tabs, students, staff, marks, graceMarks, attendance, remarks };
}

// ============================================================
// FETCH ONE STUDENT
// ============================================================

export function buildStudentSheetData(admissionNo, workbookData) {
  const id = String(admissionNo).trim();

  const marks = workbookData?.marks?.get(id);
  const grace = workbookData?.graceMarks?.get(id);
  const attendance = workbookData?.attendance?.get(id);
  const remarks = workbookData?.remarks?.get(id);
  const sensitiveField = (header) => /(password|secret|api.?key|token)/i.test(String(header || ""));
  const workbookRecords = (workbookData?.tabs || []).map((tab) => {
    const headers = tab.headers.filter((header) => !sensitiveField(header));
    const rows = tab.rows
      .filter((row) => String(getField(row, "AdmissionNo", "AdmissionNumber")).trim() === id)
      .map((row) => Object.fromEntries(Object.entries(row).filter(([key]) => !sensitiveField(key))));
    return { name: tab.name, headers, rows };
  }).filter((tab) => tab.rows.length > 0);

  if (!id || (!marks && !grace && !attendance && !remarks && !workbookRecords.length)) return null;

  // ----------------------------------------------------------
  // INTERNAL MARKS
  // ----------------------------------------------------------

  const subjectMarks = marks?.subjects || [];
  const totalInternal = subjectMarks.reduce(
    (total, subject) => total + subject.marks,
    0
  );

  const maxInternal = subjectMarks.reduce(
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

    studentName: marks?.name || "",
    class: marks?.class || "",

    subjectMarks,

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
    workbookRecords,
  };
}

export async function fetchStudentData(admissionNo) {
  return buildStudentSheetData(admissionNo, await fetchAllSheetData());
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
