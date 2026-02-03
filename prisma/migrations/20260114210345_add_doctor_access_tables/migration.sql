-- CreateTable
CREATE TABLE "MedicationIntakeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "actualTime" DATETIME,
    "status" TEXT NOT NULL,
    "observation" TEXT,
    "logDate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MedicationIntakeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MedicationIntakeLog_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MedicationIntakeLog_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "MedicationSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AwarenessSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "timeWindow" TEXT NOT NULL,
    "medicationPatterns" TEXT NOT NULL,
    "adherenceSignals" TEXT NOT NULL,
    "observationAssociations" TEXT NOT NULL,
    "dataSufficiency" BOOLEAN NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AwarenessSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DoctorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DoctorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DoctorAccessRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DoctorAccessRequest_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DoctorAccessRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DoctorAccessGrant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DoctorAccessGrant_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DoctorAccessGrant_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MedicationIntakeLog_userId_idx" ON "MedicationIntakeLog"("userId");

-- CreateIndex
CREATE INDEX "MedicationIntakeLog_medicationId_idx" ON "MedicationIntakeLog"("medicationId");

-- CreateIndex
CREATE INDEX "MedicationIntakeLog_scheduleId_idx" ON "MedicationIntakeLog"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicationIntakeLog_scheduleId_logDate_key" ON "MedicationIntakeLog"("scheduleId", "logDate");

-- CreateIndex
CREATE INDEX "AwarenessSnapshot_userId_idx" ON "AwarenessSnapshot"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AwarenessSnapshot_userId_timeWindow_key" ON "AwarenessSnapshot"("userId", "timeWindow");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorProfile_userId_key" ON "DoctorProfile"("userId");

-- CreateIndex
CREATE INDEX "DoctorAccessRequest_doctorId_idx" ON "DoctorAccessRequest"("doctorId");

-- CreateIndex
CREATE INDEX "DoctorAccessRequest_patientId_idx" ON "DoctorAccessRequest"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorAccessRequest_doctorId_patientId_key" ON "DoctorAccessRequest"("doctorId", "patientId");

-- CreateIndex
CREATE INDEX "DoctorAccessGrant_doctorId_idx" ON "DoctorAccessGrant"("doctorId");

-- CreateIndex
CREATE INDEX "DoctorAccessGrant_patientId_idx" ON "DoctorAccessGrant"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorAccessGrant_doctorId_patientId_key" ON "DoctorAccessGrant"("doctorId", "patientId");
