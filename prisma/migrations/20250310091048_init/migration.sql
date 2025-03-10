-- CreateTable
CREATE TABLE "Recipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "ingredients" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "tags" TEXT,
    "description" TEXT,
    "nutrition" TEXT,
    "cooking_time" INTEGER,
    "difficulty" TEXT,
    "cuisine" TEXT
);
