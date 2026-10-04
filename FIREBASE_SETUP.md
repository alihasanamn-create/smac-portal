# Firebase setup for SMAC Portal

The project uses Cloud Firestore for shared student and staff profiles and Firebase Authentication for sign-in. Student passwords belong in Firebase Authentication; do not add them to Firestore documents.

## Finish project setup

1. In **Firestore Database → Rules**, paste the contents of `firestore.rules` and publish them. These rules let signed-in students read their own profile and let the designated admin manage portal profiles.
2. In **Authentication → Users**, add the initial admin account:
   - Email: `admin@<your-firebase-project-id>.firebaseapp.com`
   - Password: choose a strong password and keep it private.
3. Copy that account's UID. In **Firestore Data**, create a collection named `accounts`, then a document whose ID is that UID. Add these fields:
   - `role` (string): `admin`
   - `username` (string): `admin`
4. In the `loginIndex` collection, create a document with ID `admin` and fields:
   - `uid` (string): the admin Auth UID
   - `email` (string): the admin Auth email
   - `role` (string): `admin`

The username index contains no passwords and is readable before sign-in so the portal can resolve a username to its Firebase Auth account. The Firestore rules limit changes to that index to the designated admin.

## Data model

- `accounts/{uid}` — role and account metadata, no passwords
- `students/{uid}` — student profile, no passwords
- `staff/{uid}` — staff profile, no passwords
- `loginIndex/{lowercase-username}` — Auth UID and Auth email for username lookup

The Firebase web configuration in `src/firebase.js` is client configuration, not a service-account key. Never put a service-account private key in the web app.
