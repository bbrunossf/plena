-- CreateTable
CREATE TABLE "Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "parentId" TEXT,
    "taskName" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "duration" REAL DEFAULT 0.0,
    "notes" TEXT,
    "progress" REAL DEFAULT 0.0,
    "predecessor" TEXT
);

-- CreateTable
CREATE TABLE "TaskResource" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "resourceName" TEXT NOT NULL,
    "resourceRole" TEXT
);

-- CreateTable
CREATE TABLE "TaskResourceAssignment" (
    "taskId" INTEGER NOT NULL,
    "taskResourceId" INTEGER NOT NULL,

    PRIMARY KEY ("taskId", "taskResourceId"),
    CONSTRAINT "TaskResourceAssignment_taskResourceId_fkey" FOREIGN KEY ("taskResourceId") REFERENCES "TaskResource" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskResourceAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "parentId" ON "Task"("parentId");
