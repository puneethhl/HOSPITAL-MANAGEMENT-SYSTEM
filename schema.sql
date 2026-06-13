-- =====================================================================
-- HOSPITAL MANAGEMENT SYSTEM DATABASE SCHEMA
-- Designed for Student Mini-Projects (SQLite / MySQL Compatible)
-- =====================================================================

-- Enable Foreign Key support (specifically for SQLite)
PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- 1. DOCTORS TABLE
-- Stores details of hospital medical staff
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Doctors (
    DoctorID INTEGER PRIMARY KEY AUTOINCREMENT,
    FullName VARCHAR(100) NOT NULL,
    Specialization VARCHAR(100) NOT NULL,
    Phone VARCHAR(15) UNIQUE NOT NULL,
    Email VARCHAR(100) UNIQUE,
    Salary DECIMAL(10, 2) CHECK (Salary > 0)
);

-- ---------------------------------------------------------------------
-- 2. PATIENTS TABLE
-- Stores profile details and contact info of patients
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Patients (
    PatientID INTEGER PRIMARY KEY AUTOINCREMENT,
    FullName VARCHAR(100) NOT NULL,
    Gender CHAR(1) CHECK (Gender IN ('M', 'F', 'O')),
    DateOfBirth DATE NOT NULL,
    Phone VARCHAR(15) UNIQUE NOT NULL,
    Address TEXT,
    EmergencyContact VARCHAR(15)
);

-- ---------------------------------------------------------------------
-- 3. APPOINTMENTS TABLE
-- Links Patients and Doctors to schedule visits
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 4. MEDICAL RECORDS TABLE
-- Stores historical medical records for patient visits
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 5. BILLING TABLE
-- Tracks hospital charges, billing dates, and payment statuses
-- ---------------------------------------------------------------------
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

-- =====================================================================
-- SAMPLE DATA INSERTION (5 Rows per table)
-- =====================================================================

-- Insert Doctors
INSERT INTO Doctors (FullName, Specialization, Phone, Email, Salary) VALUES
('Dr. Sarah Jenkins', 'Cardiology', '555-0199', 'sjenkins@hospital.com', 125000.00),
('Dr. Robert Chen', 'Pediatrics', '555-0122', 'rchen@hospital.com', 95000.00),
('Dr. Emily Watson', 'Dermatology', '555-0143', 'ewatson@hospital.com', 110000.00),
('Dr. Marcus Aurelius', 'Neurology', '555-0187', 'maurelius@hospital.com', 140000.00),
('Dr. Alisha Patel', 'General Medicine', '555-0155', 'apatel@hospital.com', 85000.00);

-- Insert Patients
INSERT INTO Patients (FullName, Gender, DateOfBirth, Phone, Address, EmergencyContact) VALUES
('John Doe', 'M', '1985-04-12', '555-1001', '123 Pine St, New York', '555-9001'),
('Jane Smith', 'F', '1992-09-24', '555-1002', '456 Oak Ave, Brooklyn', '555-9002'),
('Michael Johnson', 'M', '1978-11-02', '555-1003', '789 Maple Rd, Queens', '555-9003'),
('Sophia Martinez', 'F', '2005-06-15', '555-1004', '321 Elm Blvd, Bronx', '555-9004'),
('William Davies', 'M', '1963-01-30', '555-1005', '654 Cedar Ln, Manhattan', '555-9005');

-- Insert Appointments
INSERT INTO Appointments (PatientID, DoctorID, AppointmentDate, AppointmentTime, Status) VALUES
(1, 1, '2026-06-15', '09:00:00', 'Scheduled'),
(2, 2, '2026-06-15', '10:30:00', 'Scheduled'),
(3, 5, '2026-06-16', '14:00:00', 'Scheduled'),
(4, 3, '2026-06-17', '11:15:00', 'Scheduled'),
(5, 4, '2026-06-18', '16:00:00', 'Scheduled');

-- Insert Medical Records
INSERT INTO MedicalRecords (PatientID, DoctorID, VisitDate, Diagnosis, Treatment, Prescription) VALUES
(1, 1, '2026-06-10', 'Hypertension', 'Regular monitoring & low-sodium diet', 'Lisinopril 10mg daily'),
(2, 2, '2026-06-11', 'Acute Tonsillitis', 'Rest and hydration', 'Amoxicillin 500mg tid'),
(3, 5, '2026-06-12', 'Type 2 Diabetes', 'Metformin regimen & exercise plan', 'Metformin 850mg bid'),
(4, 3, '2026-06-13', 'Eczema Flare-up', 'Topical application of steroid cream', 'Hydrocortisone 1% cream'),
(5, 4, '2026-06-14', 'Chronic Migraines', 'Stress reduction & abortive therapy', 'Sumatriptan 50mg as needed');

-- Insert Billing
INSERT INTO Billing (PatientID, AppointmentID, TotalAmount, PaymentStatus, BillingDate) VALUES
(1, 1, 150.00, 'Paid', '2026-06-15'),
(2, 2, 85.00, 'Paid', '2026-06-15'),
(3, 3, 75.00, 'Unpaid', '2026-06-16'),
(4, 4, 120.00, 'Pending', '2026-06-17'),
(5, 5, 250.00, 'Unpaid', '2026-06-18');

-- =====================================================================
-- SAMPLE UTILITY QUERIES (SELECT, JOIN, UPDATE, DELETE)
-- =====================================================================

-- 1. Get List of Scheduled Appointments with Patient & Doctor Names
-- SELECT
--     a.AppointmentID,
--     p.FullName AS PatientName,
--     d.FullName AS DoctorName,
--     d.Specialization,
--     a.AppointmentDate,
--     a.AppointmentTime,
--     a.Status
-- FROM Appointments a
-- JOIN Patients p ON a.PatientID = p.PatientID
-- JOIN Doctors d ON a.DoctorID = d.DoctorID
-- WHERE a.Status = 'Scheduled'
-- ORDER BY a.AppointmentDate, a.AppointmentTime;

-- 2. View Patient Medical History
-- SELECT 
--     mr.RecordID,
--     p.FullName AS PatientName,
--     d.FullName AS DoctorName,
--     mr.VisitDate,
--     mr.Diagnosis,
--     mr.Treatment,
--     mr.Prescription
-- FROM MedicalRecords mr
-- JOIN Patients p ON mr.PatientID = p.PatientID
-- JOIN Doctors d ON mr.DoctorID = d.DoctorID
-- WHERE p.PatientID = 1;

-- 3. Revenue generated per specialization
-- SELECT 
--     d.Specialization,
--     SUM(b.TotalAmount) AS TotalRevenue,
--     COUNT(b.BillID) AS BillCount
-- FROM Billing b
-- JOIN Appointments a ON b.AppointmentID = a.AppointmentID
-- JOIN Doctors d ON a.DoctorID = d.DoctorID
-- GROUP BY d.Specialization;
