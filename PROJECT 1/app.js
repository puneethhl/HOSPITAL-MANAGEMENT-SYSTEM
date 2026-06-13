// =====================================================================
// MEDVITALS - HOSPITAL MANAGEMENT SYSTEM DATABASE ENGINE & INTERFACE
// =====================================================================

// Global references
let db = null;
let currentTable = 'Patients';
let currentSlide = 1;
const totalSlides = 6;

// Fallback Schema SQL (Ensures local double-click execution without CORS blocks)
const SCHEMA_SQL_FALLBACK = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Doctors (
    DoctorID INTEGER PRIMARY KEY AUTOINCREMENT,
    FullName VARCHAR(100) NOT NULL,
    Specialization VARCHAR(100) NOT NULL,
    Phone VARCHAR(15) UNIQUE NOT NULL,
    Email VARCHAR(100) UNIQUE,
    Salary DECIMAL(10, 2) CHECK (Salary > 0)
);

CREATE TABLE IF NOT EXISTS Patients (
    PatientID INTEGER PRIMARY KEY AUTOINCREMENT,
    FullName VARCHAR(100) NOT NULL,
    Gender CHAR(1) CHECK (Gender IN ('M', 'F', 'O')),
    DateOfBirth DATE NOT NULL,
    Phone VARCHAR(15) UNIQUE NOT NULL,
    Address TEXT,
    EmergencyContact VARCHAR(15)
);

CREATE TABLE IF NOT EXISTS Appointments (
    AppointmentID INTEGER PRIMARY KEY AUTOINCREMENT,
    PatientID INTEGER NOT NULL,
    DoctorID INTEGER NOT NULL,
    AppointmentDate DATE NOT NULL,
    AppointmentTime TIME NOT NULL,
    Status VARCHAR(20) DEFAULT 'Scheduled' CHECK (Status IN ('Scheduled', 'Completed', 'Cancelled')),
    FOREIGN KEY (PatientID) REFERENCES Patients(PatientID) ON DELETE CASCADE,
    FOREIGN KEY (DoctorID) REFERENCES Doctors(DoctorID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS MedicalRecords (
    RecordID INTEGER PRIMARY KEY AUTOINCREMENT,
    PatientID INTEGER NOT NULL,
    DoctorID INTEGER NOT NULL,
    VisitDate DATE NOT NULL,
    Diagnosis TEXT NOT NULL,
    Treatment TEXT NOT NULL,
    Prescription TEXT,
    FOREIGN KEY (PatientID) REFERENCES Patients(PatientID) ON DELETE CASCADE,
    FOREIGN KEY (DoctorID) REFERENCES Doctors(DoctorID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Billing (
    BillID INTEGER PRIMARY KEY AUTOINCREMENT,
    PatientID INTEGER NOT NULL,
    AppointmentID INTEGER,
    TotalAmount DECIMAL(10, 2) NOT NULL CHECK (TotalAmount >= 0),
    PaymentStatus VARCHAR(10) DEFAULT 'Unpaid' CHECK (PaymentStatus IN ('Paid', 'Unpaid', 'Pending')),
    BillingDate DATE NOT NULL,
    FOREIGN KEY (PatientID) REFERENCES Patients(PatientID) ON DELETE CASCADE,
    FOREIGN KEY (AppointmentID) REFERENCES Appointments(AppointmentID) ON DELETE SET NULL
);

INSERT INTO Doctors (FullName, Specialization, Phone, Email, Salary) VALUES
('Dr. Sarah Jenkins', 'Cardiology', '555-0199', 'sjenkins@hospital.com', 125000.00),
('Dr. Robert Chen', 'Pediatrics', '555-0122', 'rchen@hospital.com', 95000.00),
('Dr. Emily Watson', 'Dermatology', '555-0143', 'ewatson@hospital.com', 110000.00),
('Dr. Marcus Aurelius', 'Neurology', '555-0187', 'maurelius@hospital.com', 140000.00),
('Dr. Alisha Patel', 'General Medicine', '555-0155', 'apatel@hospital.com', 85000.00);

INSERT INTO Patients (FullName, Gender, DateOfBirth, Phone, Address, EmergencyContact) VALUES
('John Doe', 'M', '1985-04-12', '555-1001', '123 Pine St, New York', '555-9001'),
('Jane Smith', 'F', '1992-09-24', '555-1002', '456 Oak Ave, Brooklyn', '555-9002'),
('Michael Johnson', 'M', '1978-11-02', '555-1003', '789 Maple Rd, Queens', '555-9003'),
('Sophia Martinez', 'F', '2005-06-15', '555-1004', '321 Elm Blvd, Bronx', '555-9004'),
('William Davies', 'M', '1963-01-30', '555-1005', '654 Cedar Ln, Manhattan', '555-9005');

INSERT INTO Appointments (PatientID, DoctorID, AppointmentDate, AppointmentTime, Status) VALUES
(1, 1, '2026-06-15', '09:00:00', 'Scheduled'),
(2, 2, '2026-06-15', '10:30:00', 'Scheduled'),
(3, 5, '2026-06-16', '14:00:00', 'Scheduled'),
(4, 3, '2026-06-17', '11:15:00', 'Scheduled'),
(5, 4, '2026-06-18', '16:00:00', 'Scheduled');

INSERT INTO MedicalRecords (PatientID, DoctorID, VisitDate, Diagnosis, Treatment, Prescription) VALUES
(1, 1, '2026-06-10', 'Hypertension', 'Regular monitoring & low-sodium diet', 'Lisinopril 10mg daily'),
(2, 2, '2026-06-11', 'Acute Tonsillitis', 'Rest and hydration', 'Amoxicillin 500mg tid'),
(3, 5, '2026-06-12', 'Type 2 Diabetes', 'Metformin regimen & exercise plan', 'Metformin 850mg bid'),
(4, 3, '2026-06-13', 'Eczema Flare-up', 'Topical application of steroid cream', 'Hydrocortisone 1% cream'),
(5, 4, '2026-06-14', 'Chronic Migraines', 'Stress reduction & abortive therapy', 'Sumatriptan 50mg as needed');

INSERT INTO Billing (PatientID, AppointmentID, TotalAmount, PaymentStatus, BillingDate) VALUES
(1, 1, 150.00, 'Paid', '2026-06-15'),
(2, 2, 85.00, 'Paid', '2026-06-15'),
(3, 3, 75.00, 'Unpaid', '2026-06-16'),
(4, 4, 120.00, 'Pending', '2026-06-17'),
(5, 5, 250.00, 'Unpaid', '2026-06-18');
`;

// =====================================================================
// DB INITIALIZATION & SETUP
// =====================================================================
window.addEventListener('DOMContentLoaded', async () => {
    // 1. Load SQL.js
    try {
        const sqlPromise = initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        const SQL = await sqlPromise;
        db = new SQL.Database();
        
        // Execute initialization schema
        db.run(SCHEMA_SQL_FALLBACK);
        logConsole("Database initialized successfully. 5 tables ready.", "system");
        
        // Load initial system state
        updateSystemState();
        setupEventListeners();
        loadTableData(currentTable);
        
    } catch (err) {
        console.error("Failed to load SQL.js: ", err);
        alert("SQL.js initialization failed. Check your network or developer console.");
    }
});

// =====================================================================
// DATA RETRIEVAL HELPERS
// =====================================================================
function queryAll(sql, params = {}) {
    try {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
            rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
    } catch (e) {
        console.error("SQL Error in queryAll:", e);
        return [];
    }
}

function runSqlStatement(sql) {
    const startTime = performance.now();
    try {
        const results = db.exec(sql);
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(1);
        
        logConsole(sql, "sql");
        updateSystemState();
        
        return {
            success: true,
            results: results,
            duration: duration
        };
    } catch (err) {
        logConsole(`SQL Error: ${err.message}`, "error");
        return {
            success: false,
            error: err.message
        };
    }
}

function logConsole(message, type = "system") {
    const logsContainer = document.getElementById("recent-logs");
    if (!logsContainer) return;
    
    const div = document.createElement("div");
    div.classList.add("log-line", `text-${type}`);
    
    if (type === "sql") {
        div.innerText = `> ${message}`;
    } else if (type === "error") {
        div.innerText = `[ERROR] ${message}`;
    } else {
        div.innerText = `-- ${message} --`;
    }
    
    logsContainer.appendChild(div);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

// =====================================================================
// DYNAMIC VIEW UPDATER
// =====================================================================
function updateSystemState() {
    // 1. Read counters
    const patientsCount = queryAll("SELECT COUNT(*) as c FROM Patients")[0]?.c || 0;
    const doctorsCount = queryAll("SELECT COUNT(*) as c FROM Doctors")[0]?.c || 0;
    const appointmentsCount = queryAll("SELECT COUNT(*) as c FROM Appointments")[0]?.c || 0;
    const totalRev = queryAll("SELECT SUM(TotalAmount) as s FROM Billing")[0]?.s || 0;
    
    document.getElementById("stat-patients-count").innerText = patientsCount;
    document.getElementById("stat-doctors-count").innerText = doctorsCount;
    document.getElementById("stat-appointments-count").innerText = appointmentsCount;
    document.getElementById("stat-revenue").innerText = `$${parseFloat(totalRev).toFixed(2)}`;
    
    // 2. Load today's appointments table
    const appQuery = `
        SELECT 
            a.AppointmentID, 
            p.FullName AS Patient, 
            d.FullName AS Doctor, 
            d.Specialization,
            a.AppointmentTime AS Time, 
            a.Status
        FROM Appointments a
        JOIN Patients p ON a.PatientID = p.PatientID
        JOIN Doctors d ON a.DoctorID = d.DoctorID
        ORDER BY a.AppointmentDate ASC, a.AppointmentTime ASC
        LIMIT 5
    `;
    const todayApps = queryAll(appQuery);
    const tbody = document.querySelector("#dashboard-appointments-table tbody");
    tbody.innerHTML = '';
    
    if (todayApps.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No appointments booked</td></tr>`;
    } else {
        todayApps.forEach(app => {
            const tr = document.createElement("tr");
            let statusClass = 'badge-primary';
            if (app.Status === 'Completed') statusClass = 'badge-success';
            if (app.Status === 'Cancelled') statusClass = 'badge-accent';
            
            tr.innerHTML = `
                <td>#${app.AppointmentID}</td>
                <td><strong>${escapeHTML(app.Patient)}</strong></td>
                <td>${escapeHTML(app.Doctor)}</td>
                <td><span class="text-secondary-sm">${escapeHTML(app.Specialization)}</span></td>
                <td>${app.Time}</td>
                <td><span class="badge ${statusClass}">${app.Status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    // 3. Load Specialty Revenue Chart
    const specRevQuery = `
        SELECT 
            d.Specialization,
            SUM(b.TotalAmount) AS Revenue
        FROM Billing b
        JOIN Appointments a ON b.AppointmentID = a.AppointmentID
        JOIN Doctors d ON a.DoctorID = d.DoctorID
        GROUP BY d.Specialization
        ORDER BY Revenue DESC
    `;
    const specialtyRevenue = queryAll(specRevQuery);
    const specChart = document.getElementById("revenue-specialty-list");
    specChart.innerHTML = '';
    
    if (specialtyRevenue.length === 0) {
        specChart.innerHTML = `<div class="text-muted text-center py-4">No billing data available</div>`;
    } else {
        const maxRev = specialtyRevenue[0].Revenue || 1; // Used to compute percentage width
        specialtyRevenue.forEach(item => {
            const percent = ((item.Revenue / maxRev) * 100).toFixed(0);
            const row = document.createElement("div");
            row.classList.add("specialty-revenue-row");
            row.innerHTML = `
                <div class="specialty-meta">
                    <span class="specialty-name">${escapeHTML(item.Specialization)}</span>
                    <span class="specialty-val">$${parseFloat(item.Revenue).toFixed(2)}</span>
                </div>
                <div class="specialty-bar-bg">
                    <div class="specialty-bar-fill" style="width: 0%"></div>
                </div>
            `;
            specChart.appendChild(row);
            // Trigger animation in next tick
            setTimeout(() => {
                row.querySelector(".specialty-bar-fill").style.width = `${percent}%`;
            }, 50);
        });
    }
    
    // Update active table view if currently looking at Table tab
    loadTableData(currentTable);
    populateDropdowns();
}

// =====================================================================
// TABLE GRID / CRUD DATA LOADER
// =====================================================================
function loadTableData(tableName, filterText = '') {
    const tableHeader = document.querySelector("#crud-data-table thead");
    const tableBody = document.querySelector("#crud-data-table tbody");
    
    if (!tableHeader || !tableBody) return;
    
    document.getElementById("current-table-title").innerText = `${tableName} Table`;
    
    // Read columns and primary key details based on table
    const tableRows = queryAll(`SELECT * FROM ${tableName}`);
    
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';
    
    if (tableRows.length === 0) {
        tableHeader.innerHTML = `<tr><th>Data</th></tr>`;
        tableBody.innerHTML = `<tr><td class="text-center text-muted">Table is empty. Add a record on the right.</td></tr>`;
        return;
    }
    
    // Extrapolate columns
    const columns = Object.keys(tableRows[0]);
    const pkColumn = getPrimaryKeyName(tableName);
    
    // Render columns header
    const headerTr = document.createElement("tr");
    columns.forEach(col => {
        const th = document.createElement("th");
        th.innerText = col;
        headerTr.appendChild(th);
    });
    // Add Actions column
    const actionsTh = document.createElement("th");
    actionsTh.innerText = "Actions";
    headerTr.appendChild(actionsTh);
    tableHeader.appendChild(headerTr);
    
    // Render rows
    tableRows.forEach(row => {
        // Filter match logic
        if (filterText) {
            const matches = Object.values(row).some(val => 
                String(val).toLowerCase().includes(filterText.toLowerCase())
            );
            if (!matches) return;
        }
        
        const tr = document.createElement("tr");
        columns.forEach(col => {
            const td = document.createElement("td");
            const val = row[col];
            if (col === pkColumn) {
                td.innerHTML = `<span class="badge badge-primary">#${val}</span>`;
            } else if (col === 'TotalAmount' || col === 'Salary') {
                td.innerText = `$${parseFloat(val).toFixed(2)}`;
            } else {
                td.innerText = val !== null ? val : '--';
            }
            tr.appendChild(td);
        });
        
        // Actions cell
        const actionsTd = document.createElement("td");
        actionsTd.innerHTML = `
            <div class="table-row-actions">
                <button class="btn-icon btn-edit" data-id="${row[pkColumn]}" title="Edit Record">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="btn-icon btn-delete" data-id="${row[pkColumn]}" title="Delete Record">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
        
        // Event listeners for Edit/Delete buttons
        actionsTd.querySelector(".btn-edit").addEventListener('click', () => editRecord(tableName, row[pkColumn]));
        actionsTd.querySelector(".btn-delete").addEventListener('click', () => deleteRecord(tableName, row[pkColumn]));
        
        tr.appendChild(actionsTd);
        tableBody.appendChild(tr);
    });
}

function getPrimaryKeyName(tableName) {
    switch(tableName) {
        case 'Patients': return 'PatientID';
        case 'Doctors': return 'DoctorID';
        case 'Appointments': return 'AppointmentID';
        case 'MedicalRecords': return 'RecordID';
        case 'Billing': return 'BillID';
        default: return 'ID';
    }
}

// Populate FK Select Dropdowns dynamically
function populateDropdowns() {
    const patients = queryAll("SELECT PatientID, FullName FROM Patients ORDER BY FullName");
    const doctors = queryAll("SELECT DoctorID, FullName, Specialization FROM Doctors ORDER BY FullName");
    const appointments = queryAll(`
        SELECT a.AppointmentID, p.FullName AS Patient, a.AppointmentDate 
        FROM Appointments a 
        JOIN Patients p ON a.PatientID = p.PatientID
        ORDER BY a.AppointmentDate DESC
    `);
    
    // Select targets
    const appPatient = document.getElementById("a-patient");
    const appDoctor = document.getElementById("a-doctor");
    const mrPatient = document.getElementById("mr-patient");
    const mrDoctor = document.getElementById("mr-doctor");
    const bPatient = document.getElementById("b-patient");
    const bApp = document.getElementById("b-app");
    
    if (appPatient) {
        appPatient.innerHTML = patients.map(p => `<option value="${p.PatientID}">${escapeHTML(p.FullName)} (ID: ${p.PatientID})</option>`).join('');
    }
    if (appDoctor) {
        appDoctor.innerHTML = doctors.map(d => `<option value="${d.DoctorID}">${escapeHTML(d.FullName)} - ${escapeHTML(d.Specialization)}</option>`).join('');
    }
    if (mrPatient) {
        mrPatient.innerHTML = patients.map(p => `<option value="${p.PatientID}">${escapeHTML(p.FullName)} (ID: ${p.PatientID})</option>`).join('');
    }
    if (mrDoctor) {
        mrDoctor.innerHTML = doctors.map(d => `<option value="${d.DoctorID}">${escapeHTML(d.FullName)}</option>`).join('');
    }
    if (bPatient) {
        bPatient.innerHTML = patients.map(p => `<option value="${p.PatientID}">${escapeHTML(p.FullName)} (ID: ${p.PatientID})</option>`).join('');
    }
    if (bApp) {
        bApp.innerHTML = '<option value="">-- None --</option>' + appointments.map(a => `<option value="${a.AppointmentID}">Appt #${a.AppointmentID} - ${escapeHTML(a.Patient)} (${a.AppointmentDate})</option>`).join('');
    }
}

// =====================================================================
// FORM & RECORD OPERATIONS (CRUD WRITE/DELETE)
// =====================================================================
function editRecord(tableName, id) {
    const pkName = getPrimaryKeyName(tableName);
    const record = queryAll(`SELECT * FROM ${tableName} WHERE ${pkName} = :id`, { ':id': id })[0];
    if (!record) return;
    
    // Switch action title
    document.getElementById("form-action-title").innerText = `Edit ${tableName.slice(0,-1)} #${id}`;
    
    // Populate form fields
    const form = document.getElementById(`form-${tableName}`);
    if (!form) return;
    
    // Reset form first
    form.reset();
    
    // Loop keys
    Object.keys(record).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            input.value = record[key] !== null ? record[key] : '';
        }
    });
}

function deleteRecord(tableName, id) {
    const pkName = getPrimaryKeyName(tableName);
    const confirmDelete = confirm(`Are you sure you want to delete this record from ${tableName}? (Any cascading foreign keys will be deleted or set null)`);
    
    if (confirmDelete) {
        const sql = `DELETE FROM ${tableName} WHERE ${pkName} = ${id};`;
        const res = runSqlStatement(sql);
        if (res.success) {
            logConsole(`Deleted row #${id} from ${tableName} successfully.`, "system");
            updateSystemState();
        } else {
            alert(`Delete failed: ${res.error}`);
        }
    }
}

// Form submit handler
function handleFormSubmit(tableName, form) {
    const formData = new FormData(form);
    const dataObj = {};
    formData.forEach((val, key) => {
        dataObj[key] = val;
    });
    
    const pkName = getPrimaryKeyName(tableName);
    const isEdit = !!dataObj[pkName];
    
    let sql = '';
    
    if (isEdit) {
        // Construct UPDATE statement
        const setClauses = [];
        Object.keys(dataObj).forEach(key => {
            if (key !== pkName) {
                const val = dataObj[key];
                if (val === '') {
                    setClauses.push(`${key} = NULL`);
                } else {
                    setClauses.push(`${key} = '${escapeSQLValue(val)}'`);
                }
            }
        });
        sql = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE ${pkName} = ${dataObj[pkName]};`;
    } else {
        // Construct INSERT statement
        const columns = [];
        const values = [];
        Object.keys(dataObj).forEach(key => {
            if (key !== pkName) { // Skip PK for auto-increment inserts
                const val = dataObj[key];
                columns.push(key);
                if (val === '') {
                    values.push('NULL');
                } else {
                    values.push(`'${escapeSQLValue(val)}'`);
                }
            }
        });
        sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
    }
    
    const res = runSqlStatement(sql);
    if (res.success) {
        logConsole(`${isEdit ? 'Updated' : 'Created'} record in ${tableName} successfully.`, "system");
        form.reset();
        document.getElementById("form-action-title").innerText = `Add New ${tableName.endsWith('s') ? tableName.slice(0, -1) : tableName}`;
        // Clear hidden ID field explicitly
        const pkInput = form.querySelector(`[name="${pkName}"]`);
        if (pkInput) pkInput.value = '';
        
        updateSystemState();
    } else {
        alert(`Database execution failed: ${res.error}`);
    }
}

// =====================================================================
// SQL PLAYGROUND HANDLERS
// =====================================================================
const SQL_TEMPLATES = {
    "1": `SELECT 
    a.AppointmentID,
    p.FullName AS PatientName,
    d.FullName AS DoctorName,
    d.Specialization,
    a.AppointmentDate,
    a.AppointmentTime,
    a.Status
FROM Appointments a
JOIN Patients p ON a.PatientID = p.PatientID
JOIN Doctors d ON a.DoctorID = d.DoctorID
WHERE a.Status = 'Scheduled'
ORDER BY a.AppointmentDate, a.AppointmentTime;`,

    "2": `SELECT 
    d.Specialization,
    SUM(b.TotalAmount) AS TotalRevenue,
    COUNT(b.BillID) AS InvoicesCount
FROM Billing b
JOIN Appointments a ON b.AppointmentID = a.AppointmentID
JOIN Doctors d ON a.DoctorID = d.DoctorID
GROUP BY d.Specialization
ORDER BY TotalRevenue DESC;`,

    "3": `SELECT 
    PatientID, 
    FullName, 
    Phone 
FROM Patients 
WHERE PatientID IN (
    SELECT PatientID 
    FROM Billing 
    WHERE TotalAmount > (SELECT AVG(TotalAmount) FROM Billing)
);`,

    "4": `SELECT 
    mr.RecordID,
    p.FullName AS PatientName,
    d.FullName AS DoctorName,
    mr.VisitDate,
    mr.Diagnosis,
    mr.Treatment,
    mr.Prescription
FROM MedicalRecords mr
JOIN Patients p ON mr.PatientID = p.PatientID
JOIN Doctors d ON mr.DoctorID = d.DoctorID
WHERE p.PatientID = 1;`,

    "5": `SELECT 
    d.FullName AS DoctorName,
    d.Specialization,
    COUNT(a.AppointmentID) AS ConsultationCount
FROM Doctors d
LEFT JOIN Appointments a ON d.DoctorID = a.DoctorID
GROUP BY d.DoctorID;`,

    "6": `INSERT INTO Doctors (FullName, Specialization, Phone, Email, Salary)
VALUES ('Dr. Gregory House', 'Diagnostic Medicine', '555-4812', 'ghouse@hospital.com', 185000.00);`,

    "7": `UPDATE Billing 
SET PaymentStatus = 'Paid' 
WHERE PaymentStatus = 'Pending' AND BillingDate < '2026-06-18';`
};

function executePlaygroundQuery() {
    const sqlText = document.getElementById("sql-editor-textarea").value.trim();
    const errorBox = document.getElementById("sql-error-box");
    const resultTable = document.getElementById("sql-result-table");
    const resultMeta = document.getElementById("result-meta");
    
    errorBox.classList.add("hidden");
    resultTable.innerHTML = '';
    
    if (!sqlText) {
        errorBox.innerText = "Please write or select a SQL statement first.";
        errorBox.classList.remove("hidden");
        return;
    }
    
    const res = runSqlStatement(sqlText);
    
    if (!res.success) {
        errorBox.innerText = res.error;
        errorBox.classList.remove("hidden");
        resultMeta.innerText = "Execution failed";
        return;
    }
    
    // Check if query returned rows (e.g. SELECT)
    if (res.results && res.results.length > 0) {
        const columns = res.results[0].columns;
        const values = res.results[0].values;
        
        resultMeta.innerText = `${values.length} rows returned (${res.duration}ms)`;
        
        // Render Header
        const thead = document.createElement("thead");
        const headerTr = document.createElement("tr");
        columns.forEach(col => {
            const th = document.createElement("th");
            th.innerText = col;
            headerTr.appendChild(th);
        });
        thead.appendChild(headerTr);
        resultTable.appendChild(thead);
        
        // Render Body
        const tbody = document.createElement("tbody");
        values.forEach(row => {
            const tr = document.createElement("tr");
            row.forEach(cell => {
                const td = document.createElement("td");
                td.innerText = cell !== null ? cell : 'NULL';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        resultTable.appendChild(tbody);
        
    } else {
        // Command execution success (INSERT/UPDATE/DELETE/DDL)
        resultMeta.innerText = `Command completed successfully (${res.duration}ms)`;
        resultTable.innerHTML = `<tbody><tr><td class="text-center text-success"><i class="fa-solid fa-circle-check"></i> Query executed successfully. Database state updated.</td></tr></tbody>`;
    }
}

// =====================================================================
// ER DIAGRAM RELATION INSPECTOR
// =====================================================================
const ER_INSPECTOR_DATA = {
    "Patients": {
        title: "Patients Entity Table",
        desc: "Stores core demographic profiling details for patients. The Phone field carries a UNIQUE key constraint to prevent duplicate entry files.",
        fields: [
            { name: "PatientID", type: "INTEGER (PK, AUTO)", key: "pk" },
            { name: "FullName", type: "VARCHAR(100) NOT NULL", key: "" },
            { name: "Gender", type: "CHAR(1) CHECK (M/F/O)", key: "" },
            { name: "DateOfBirth", type: "DATE NOT NULL", key: "" },
            { name: "Phone", type: "VARCHAR(15) UNIQUE", key: "" },
            { name: "Address", type: "TEXT", key: "" },
            { name: "EmergencyContact", type: "VARCHAR(15)", key: "" }
        ]
    },
    "Doctors": {
        title: "Doctors Entity Table",
        desc: "Maintains clinical rosters. Salary details require a positive value check validation constraint.",
        fields: [
            { name: "DoctorID", type: "INTEGER (PK, AUTO)", key: "pk" },
            { name: "FullName", type: "VARCHAR(100) NOT NULL", key: "" },
            { name: "Specialization", type: "VARCHAR(100)", key: "" },
            { name: "Phone", type: "VARCHAR(15) UNIQUE", key: "" },
            { name: "Email", type: "VARCHAR(100) UNIQUE", key: "" },
            { name: "Salary", type: "DECIMAL CHECK (>0)", key: "" }
        ]
    },
    "Appointments": {
        title: "Appointments Associative Table",
        desc: "Establishes a many-to-many link between Patients and Doctors to coordinate scheduling schedules. Utilizes cascade deletion rules.",
        fields: [
            { name: "AppointmentID", type: "INTEGER (PK, AUTO)", key: "pk" },
            { name: "PatientID", type: "INTEGER (FK) NOT NULL", key: "fk" },
            { name: "DoctorID", type: "INTEGER (FK) NOT NULL", key: "fk" },
            { name: "AppointmentDate", type: "DATE NOT NULL", key: "" },
            { name: "AppointmentTime", type: "TIME NOT NULL", key: "" },
            { name: "Status", type: "VARCHAR DEFAULT 'Scheduled'", key: "" }
        ]
    },
    "MedicalRecords": {
        title: "Medical Records Table",
        desc: "Tracks the historical clinical logs written by attending doctors detailing diagnostic assessments.",
        fields: [
            { name: "RecordID", type: "INTEGER (PK, AUTO)", key: "pk" },
            { name: "PatientID", type: "INTEGER (FK) NOT NULL", key: "fk" },
            { name: "DoctorID", type: "INTEGER (FK) NOT NULL", key: "fk" },
            { name: "VisitDate", type: "DATE NOT NULL", key: "" },
            { name: "Diagnosis", type: "TEXT NOT NULL", key: "" },
            { name: "Treatment", type: "TEXT NOT NULL", key: "" },
            { name: "Prescription", type: "TEXT", key: "" }
        ]
    },
    "Billing": {
        title: "Billing Transactional Table",
        desc: "Maintains invoice data. Cascade delete handles Patient removals, while Appointment removals set the connection to NULL to keep invoices intact.",
        fields: [
            { name: "BillID", type: "INTEGER (PK, AUTO)", key: "pk" },
            { name: "PatientID", type: "INTEGER (FK) NOT NULL", key: "fk" },
            { name: "AppointmentID", type: "INTEGER (FK) DEFAULT NULL", key: "fk" },
            { name: "TotalAmount", type: "DECIMAL CHECK (>=0)", key: "" },
            { name: "PaymentStatus", type: "VARCHAR DEFAULT 'Unpaid'", key: "" },
            { name: "BillingDate", type: "DATE NOT NULL", key: "" }
        ]
    }
};

function inspectERElement(id, type = "node") {
    const container = document.getElementById("er-inspector-content");
    if (!container) return;
    
    // Clear active classes
    document.querySelectorAll('.er-node, .er-edge').forEach(el => el.classList.remove('active'));
    
    // Add active class to selected element
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    
    if (type === "node") {
        const nodeName = id.replace("node-", "");
        const info = ER_INSPECTOR_DATA[nodeName];
        if (!info) return;
        
        let fieldsHtml = info.fields.map(f => `
            <div class="inspector-field-item">
                <span class="inspect-f-name">${f.name}</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="inspect-f-type">${f.type}</span>
                    ${f.key ? `<span class="inspect-f-key key-${f.key}">${f.key.toUpperCase()}</span>` : ''}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = `
            <div class="inspector-entity">
                <h4>${info.title}</h4>
                <p class="inspector-desc">${info.desc}</p>
                <h5 style="font-size: 13px; margin-bottom: 12px; color: var(--text-secondary);">Fields Definition:</h5>
                <div class="inspector-field-list">
                    ${fieldsHtml}
                </div>
            </div>
        `;
    } else {
        // Edge relationship description
        const desc = el.getAttribute("data-desc") || "Relationship connection.";
        container.innerHTML = `
            <div class="inspector-entity">
                <h4>Relationship Link</h4>
                <div class="alert-info-slide" style="margin-top: 16px;">
                    <i class="fa-solid fa-circle-info"></i> ${desc}
                </div>
                <p class="inspector-desc" style="margin-top: 16px;">
                    This link represents relational integrity checked automatically by SQLite. Deletion triggers follow the configured cascading policies (ON DELETE CASCADE / ON DELETE SET NULL).
                </p>
            </div>
        `;
    }
}

// =====================================================================
// PRESENTATION NAVIGATION (SLIDESHOW)
// =====================================================================
function changeSlide(direction) {
    let nextSlide = currentSlide + direction;
    if (nextSlide < 1 || nextSlide > totalSlides) return;
    
    // Hide active slide
    document.getElementById(`slide-${currentSlide}`).classList.remove('active');
    // Show new slide
    document.getElementById(`slide-${nextSlide}`).classList.add('active');
    
    currentSlide = nextSlide;
    
    // Update indicator
    document.getElementById("current-slide-num").innerText = currentSlide;
    // Update progress bar
    const percent = (currentSlide / totalSlides) * 100;
    document.querySelector(".slide-progress-fill").style.width = `${percent}%`;
}

// =====================================================================
// CORE EVENT LISTENERS SETUP
// =====================================================================
function setupEventListeners() {
    // 1. Sidebar Tabs Navigation
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = btn.getAttribute("data-tab");
            
            // Switch tabs active classes
            document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove('active'));
            document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Header titles update
            const titleEl = document.getElementById("page-title");
            const descEl = document.getElementById("page-desc");
            
            switch (tabId) {
                case 'dashboard':
                    titleEl.innerText = "Dashboard Overview";
                    descEl.innerText = "Real-time metrics and live operations of the hospital network.";
                    updateSystemState();
                    break;
                case 'tables':
                    titleEl.innerText = "Database RDBMS Workspace";
                    descEl.innerText = "Direct UI for adding, modifying, and deleting records inside SQLite tables.";
                    loadTableData(currentTable);
                    break;
                case 'playground':
                    titleEl.innerText = "Interactive SQL Playground";
                    descEl.innerText = "Run raw, custom SQL statements against the virtual SQLite database in real-time.";
                    break;
                case 'er-diagram':
                    titleEl.innerText = "Database ER Diagram Overview";
                    descEl.innerText = "Interactive schematic mapping relationships and field properties.";
                    break;
                case 'presentation':
                    titleEl.innerText = "Project Slide Presentation";
                    descEl.innerText = "Pre-configured slides tailored for student project reviews.";
                    break;
            }
        });
    });

    // 2. CRUD Sub-tabs management switcher
    document.querySelectorAll(".table-tab-btn").forEach(btn => {
        btn.addEventListener('click', () => {
            const table = btn.getAttribute("data-table");
            document.querySelectorAll(".table-tab-btn").forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTable = table;
            
            // Switch active form
            document.querySelectorAll(".crud-form").forEach(f => f.classList.remove('active'));
            const form = document.getElementById(`form-${table}`);
            if (form) form.classList.add('active');
            
            // Reset action form title
            document.getElementById("form-action-title").innerText = `Add New ${table.endsWith('s') ? table.slice(0, -1) : table}`;
            
            loadTableData(table);
        });
    });

    // Search input
    document.getElementById("table-search").addEventListener('input', (e) => {
        loadTableData(currentTable, e.target.value);
    });

    // Forms reset/clear button
    document.querySelectorAll(".clear-form-btn").forEach(btn => {
        btn.addEventListener('click', (e) => {
            const form = btn.closest('form');
            form.reset();
            const pkName = getPrimaryKeyName(currentTable);
            const pkInput = form.querySelector(`[name="${pkName}"]`);
            if (pkInput) pkInput.value = '';
            document.getElementById("form-action-title").innerText = `Add New ${currentTable.endsWith('s') ? currentTable.slice(0, -1) : currentTable}`;
        });
    });

    // Forms submission dispatcher
    document.querySelectorAll(".crud-form").forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const tableName = form.id.replace("form-", "");
            handleFormSubmit(tableName, form);
        });
    });

    // 3. SQL Editor Run Statement
    document.getElementById("run-sql-btn").addEventListener('click', executePlaygroundQuery);
    document.getElementById("clear-editor-btn").addEventListener('click', () => {
        document.getElementById("sql-editor-textarea").value = '';
    });

    // SQL Template selection
    document.querySelectorAll(".template-item").forEach(item => {
        item.addEventListener('click', () => {
            const queryId = item.getAttribute("data-query");
            const sqlText = SQL_TEMPLATES[queryId];
            if (sqlText) {
                document.getElementById("sql-editor-textarea").value = sqlText;
                // Move view tab to editor viewport if scroll is needed
                document.getElementById("sql-editor-textarea").focus();
            }
        });
    });

    // 4. ER Diagram Hover & Click events
    document.querySelectorAll(".er-node").forEach(node => {
        node.addEventListener('click', () => {
            inspectERElement(node.id, "node");
        });
    });
    
    document.querySelectorAll(".er-edge").forEach(edge => {
        edge.addEventListener('click', () => {
            inspectERElement(edge.id, "edge");
        });
    });

    // 5. Presentation Controls
    document.getElementById("prev-slide-btn").addEventListener('click', () => changeSlide(-1));
    document.getElementById("next-slide-btn").addEventListener('click', () => changeSlide(1));
    
    // Code tabs inside presentation Slide 5
    document.querySelectorAll(".slide-code-btn").forEach(btn => {
        btn.addEventListener('click', () => {
            const codeTab = btn.getAttribute("data-tab-code");
            document.querySelectorAll(".slide-code-btn").forEach(b => b.classList.remove('active'));
            document.querySelectorAll(".code-view").forEach(cv => cv.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`code-${codeTab}`).classList.add('active');
        });
    });

    // 6. DB Global controls
    document.getElementById("reset-db-btn").addEventListener('click', () => {
        const verify = confirm("Reset database? This drops and recreates all tables with default sample data.");
        if (verify) {
            db.run("DROP TABLE IF EXISTS Billing;");
            db.run("DROP TABLE IF EXISTS MedicalRecords;");
            db.run("DROP TABLE IF EXISTS Appointments;");
            db.run("DROP TABLE IF EXISTS Patients;");
            db.run("DROP TABLE IF EXISTS Doctors;");
            db.run(SCHEMA_SQL_FALLBACK);
            logConsole("Database reset executed. Re-initialized tables.", "system");
            updateSystemState();
        }
    });

    document.getElementById("clear-log-btn").addEventListener('click', () => {
        document.getElementById("recent-logs").innerHTML = '<div class="log-line text-system">-- System log cleared --</div>';
    });

    // Export SQLite .db file binary stream
    document.getElementById("download-db-btn").addEventListener('click', () => {
        try {
            const binaryArray = db.export();
            const blob = new Blob([binaryArray], { type: "application/octet-stream" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "medvitals_hospital_system.db";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            logConsole("Database downloaded successfully as .db SQLite file.", "system");
        } catch (err) {
            alert("Export failed: " + err.message);
        }
    });

    // 7. Modals (SQL script view)
    const viewSchemaBtn = document.getElementById("view-schema-btn");
    const schemaModal = document.getElementById("schema-modal");
    const closeSchemaModalBtn = document.getElementById("close-schema-modal-btn");
    
    viewSchemaBtn.addEventListener('click', () => {
        document.getElementById("schema-code-block").innerText = SCHEMA_SQL_FALLBACK.trim();
        schemaModal.classList.remove("hidden");
    });
    
    closeSchemaModalBtn.addEventListener('click', () => {
        schemaModal.classList.add("hidden");
    });
    
    schemaModal.addEventListener('click', (e) => {
        if (e.target === schemaModal) {
            schemaModal.classList.add("hidden");
        }
    });
    
    document.getElementById("copy-schema-btn").addEventListener('click', () => {
        const codeText = document.getElementById("schema-code-block").innerText;
        navigator.clipboard.writeText(codeText).then(() => {
            alert("SQL schema copied to clipboard!");
        });
    });
    
    document.getElementById("download-schema-btn").addEventListener('click', () => {
        const codeText = document.getElementById("schema-code-block").innerText;
        const blob = new Blob([codeText], { type: "text/sql" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "hospital_management_system.sql";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}

// =====================================================================
// UTILITY SANITIZERS
// =====================================================================
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function escapeSQLValue(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/'/g, "''"); // Escape single quotes for SQLite
}
