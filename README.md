# MedVitals - Hospital Management System (HMS) SQL Lab

An interactive, web-based **Hospital Management System (HMS)** database and dashboard. This application is designed to help students and developers visualize, manage, and present a relational database design using SQL in real-time.

---

## 🚀 Key Features

* **Live In-Browser SQLite Engine:** Powered by `SQL.js` (SQLite compiled to WebAssembly). Run actual SQL statements right in your browser tab without any database server installation.
* **Interactive ER Diagram:** View a high-definition Entity-Relationship (ER) schematic of the database. Hover or click on tables and relationship links to inspect primary keys, foreign keys, constraints, and cascading actions in the sidebar inspector.
* **RDBMS CRUD Workspace:** Manage records visually. Adding, editing, or deleting patients, doctors, appointments, medical records, and bills executes parameterized SQL statements in the background and logs them to a live console.
* **SQL Playground Console:** Access a query editor loaded with 7 presentation-ready SQL templates (Joins, aggregations, subqueries) to query the database.
* **Built-in Presentation Slides:** A clean, 6-slide deck integrated directly into the application, explaining the database design, tables, relationships, and queries.
* **Standalone Desktop Mode:** Wrapped in Electron to run as a double-clickable standalone desktop window.

---

## 📊 Relational Database Schema

The database consists of 5 essential tables representing a standard clinical workflow:

1. **`Doctors`:** Manages specialty rosters and contact details (Checks: positive salary validation).
2. **`Patients`:** Stores demographic info (Checks: gender constraints and unique phone validations).
3. **`Appointments`:** Linking patients and doctors (Cascade-deletes mappings when a user is deleted).
4. **`MedicalRecords`:** Keeps clinical diagnosis logs and treatment plans.
5. **`Billing`:** Handles invoice totals and payment tracking (Cascade delete on patients; sets appointment references to NULL if cancelled to preserve audit logs).

---

## 🛠️ Tech Stack

* **Database Engine:** SQLite (via SQL.js WebAssembly)
* **Frontend:** HTML5, Vanilla CSS3 (Custom Glassmorphic Dark Theme), Vanilla JavaScript
* **Desktop Wrapper:** Electron framework
* **Scripting:** PowerShell (Local utility HTTP server & zipping scripts)

---

## 💻 How to Run the Project

### Option A: Local Browser (Zero Setup)
Double-click the **`index.html`** file in the root folder. The app will open in your default browser.

### Option B: Desktop App (GUI Window)
Double-click the **`run_app.bat`** file. 
*(Requires Node.js installed on your PC. It will automatically install Electron dependencies on the first run).*

### Option C: Local HTTP Server
Run the PowerShell command to start a lightweight native server on port 8080:
```powershell
powershell -ExecutionPolicy Bypass -File "server.ps1"
```
Then open: **`http://localhost:8080/`**
