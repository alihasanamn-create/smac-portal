# SMAC Portal — Google Sheets API Setup + Android App Packaging
============================================================

## PART 1 — GOOGLE SHEETS API SETUP
============================================================

### STEP 1 — Create the Google Sheet

1. Go to https://sheets.google.com and create a new spreadsheet.
2. Name it: **SMAC Portal Data**
3. Create these 4 tabs (click the + at the bottom to add tabs):

---

#### Tab 1: Marks
Row 1 (headers, exact spelling):
| AdmissionNo | StudentName | Class | Subject | InternalMarks | MaxMarks |

Example rows:
| 2026-001 | Muhammad Aslam | S2 | Hadith | 38 | 50 |
| 2026-001 | Muhammad Aslam | S2 | Fiqh | 45 | 50 |
| 2026-002 | Ibrahim Sadiq | S2 | Hadith | 40 | 50 |

---

#### Tab 2: GraceMarks
Row 1 (headers):
| AdmissionNo | Week | Category | ObtainedMarks | MaxMarks |

Example rows:
| 2026-001 | Week 1 | Discipline | 8 | 10 |
| 2026-001 | Week 1 | Hifz | 16 | 20 |
| 2026-001 | Week 2 | Discipline | 9 | 10 |

---

#### Tab 3: Attendance
Row 1 (headers):
| AdmissionNo | TotalDays | PresentDays |

Example rows:
| 2026-001 | 100 | 96 |
| 2026-002 | 100 | 88 |

---

#### Tab 4: Remarks
Row 1 (headers):
| AdmissionNo | Strengths | Improvement | Suggestions |

Example rows:
| 2026-001 | Consistent in Hifz... | Needs to improve... | Encourage daily... |

---

### STEP 2 — Get your Sheet ID

Look at the URL of your Google Sheet:
```
https://docs.google.com/spreadsheets/d/  1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms  /edit
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                         THIS is your SHEET_ID
```

Copy that long string. You'll paste it into the code.

---

### STEP 3 — Enable the Sheets API on Google Cloud

1. Go to: https://console.cloud.google.com
2. Click "Select a project" → "New Project"
   - Name: SMAC Portal
   - Click Create
3. In the left menu → "APIs & Services" → "Library"
4. Search: **Google Sheets API** → Click it → Click **Enable**
5. Also search: **Google Drive API** → Click it → **Enable**

---

### STEP 4 — Create an API Key

1. Left menu → "APIs & Services" → "Credentials"
2. Click **+ Create Credentials** → **API Key**
3. Copy the key shown (looks like: AIzaSyB_xxxxx...)
4. Click "Edit API Key" to restrict it:
   - Under "API restrictions" → select "Restrict key"
   - Choose: Google Sheets API, Google Drive API
   - Under "Application restrictions" → HTTP referrers
   - Add your domain (e.g. smac.school.com/* or localhost:5173/*)
5. Click Save

---

### STEP 5 — Make the sheet publicly readable (read-only)

> Teachers can still edit the sheet normally. This just lets
> the app read data without logging in as a Google user.

1. Open your Google Sheet
2. Click **Share** (top right)
3. Under "General access" → change to **Anyone with the link**
4. Set permission to **Viewer** (NOT Editor — keeps it read-only)
5. Click Done

---

### STEP 6 — Paste your credentials into the code

Open `src/sheetsApi.js` and replace the two placeholder lines:

```js
const SHEET_ID = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms";  // your real ID
const API_KEY  = "AIzaSyB_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";          // your real key
```

---

### STEP 7 — Wire the API into the app

In `src/App.jsx`, find the `LoginScreen` submit handler for parent login
and replace the mock data lookup with a real API call:

```jsx
// Inside loginParent(), after the student is found:
import { fetchStudentData } from "./sheetsApi";

async function loginParent(student) {
  setActiveStudent(student);
  setUser("parent");
  setTab("overview");

  // Fetch live data from Google Sheets
  try {
    setSheetLoading(true);
    const data = await fetchStudentData(student.admissionNo);
    if (data) setSheetData(data);   // store in state, use in MarksTable etc.
  } catch (err) {
    console.error("Sheets fetch failed:", err.message);
    // Falls back to demo data already shown
  } finally {
    setSheetLoading(false);
  }
}
```

Add to App state:
```jsx
const [sheetData, setSheetData] = useState(null);
const [sheetLoading, setSheetLoading] = useState(false);
```

Then in `MarksTable`, use `sheetData?.subjectMarks ?? SUBJECT_MARKS` so it
shows live data when loaded and falls back to demo data otherwise.

---

### STEP 8 — Auto-refresh (optional)

To keep data live while the portal is open, add a refresh interval:

```jsx
useEffect(() => {
  if (!activeStudent) return;
  const id = setInterval(() => {
    fetchStudentData(activeStudent.admissionNo)
      .then((data) => data && setSheetData(data))
      .catch(console.error);
  }, 5 * 60 * 1000); // refresh every 5 minutes
  return () => clearInterval(id);
}, [activeStudent]);
```

---

### IMPORTANT — What teachers should do

Teachers open the Google Sheet normally in their browser and:
- Add/update rows in the Marks tab when internal exams finish
- Add rows in GraceMarks tab weekly (one row per student per category per week)
- Update Attendance tab each month
- Update Remarks tab each term

The portal reads the sheet automatically — no upload or button press needed.

---

============================================================
## PART 2 — BUILD AS AN ANDROID APP (Step by Step)
============================================================

The easiest way to turn your web app into a real Android app is using
**Capacitor** — it wraps your React build inside a native Android shell.
No separate Android codebase. No Java. One command.

---

### Prerequisites (install these first)

1. **Node.js 18+** — already installed if you ran the portal
2. **Android Studio** — free download from:
   https://developer.android.com/studio
   - During install, also install: Android SDK, Android Virtual Device (AVD)
3. **Java 17** (bundled with Android Studio — no separate install needed)

---

### STEP 1 — Install Capacitor into your project

In your `smac-portal` folder:

```bash
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli
```

---

### STEP 2 — Initialize Capacitor

```bash
npx cap init
```

It will ask:
- App name: **SMAC Portal**
- App ID: **com.smac.portal**  ← use this format (reverse domain style)
- Web dir: **dist**            ← this is where Vite builds to

---

### STEP 3 — Build your React app

```bash
npm run build
```

This creates a `dist/` folder with the compiled app.

---

### STEP 4 — Add the Android platform

```bash
npx cap add android
```

This creates an `android/` folder — a full Android Studio project.

---

### STEP 5 — Copy web build into Android

```bash
npx cap sync android
```

Run this every time you change your React code and rebuild.

---

### STEP 6 — Open in Android Studio

```bash
npx cap open android
```

Android Studio opens automatically.

---

### STEP 7 — Run on a device or emulator

**On an emulator:**
1. In Android Studio → click the phone icon (AVD Manager)
2. Create a virtual device (Pixel 6, API 33 recommended)
3. Start it, then click the green ▶ Run button

**On a real Android phone:**
1. On the phone → Settings → About Phone → tap "Build Number" 7 times
2. Go back → Developer Options → enable "USB Debugging"
3. Connect phone via USB → allow the connection prompt
4. Select your phone in Android Studio → click ▶ Run

---

### STEP 8 — Build a release APK (to share/install)

In Android Studio:
1. Menu → Build → Generate Signed Bundle / APK
2. Choose APK
3. Create a new keystore (save the file and remember the passwords!)
4. Fill in the alias and passwords → Next
5. Choose "release" → Finish

The APK appears in:
`android/app/build/outputs/apk/release/app-release.apk`

Send this file to any Android phone — they can install it directly.

---

### STEP 9 — Publish to Google Play Store (optional)

1. Go to: https://play.google.com/console
2. Create a developer account (one-time $25 USD fee)
3. Create a new app → fill in the details
4. Upload the APK (or AAB — Android App Bundle, use that for Play Store)
   - To build AAB: Build → Generate Signed Bundle → choose "Android App Bundle"
5. Fill in store listing (description, screenshots, icon)
6. Submit for review (usually takes 1–3 days)

---

### Quick summary of commands

```bash
# One-time setup
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli
npx cap init          # App name: SMAC Portal, ID: com.smac.portal, dir: dist

# Every time you update the app
npm run build
npx cap sync android
npx cap open android  # then press Run in Android Studio
```

---

### Add an app icon

Replace these files with your SMAC logo (PNG):
```
android/app/src/main/res/mipmap-hdpi/ic_launcher.png        (72×72)
android/app/src/main/res/mipmap-mdpi/ic_launcher.png        (48×48)
android/app/src/main/res/mipmap-xhdpi/ic_launcher.png       (96×96)
android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png      (144×144)
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png     (192×192)
```

Or use this tool to generate all sizes automatically:
https://easyappicon.com  (upload your logo → download → unzip into res/)

---

### Notes
- The `android/` folder is gitignore'd by default — that's fine.
- Every time you edit `src/sheetsApi.js` credentials or any React code,
  run `npm run build && npx cap sync android` before testing again.
- The Google Sheets API calls work inside the Android app the same way
  they work in the browser — no extra Android permissions needed.
