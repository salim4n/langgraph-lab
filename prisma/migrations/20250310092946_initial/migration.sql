/*
  Warnings:

  - You are about to drop the column `cooking_time` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `cuisine` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `nutrition` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `steps` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Recipe` table. All the data in the column will be lost.
  - Added the required column `directions` to the `Recipe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Recipe` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Recipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "category" TEXT,
    "author" TEXT,
    "description" TEXT,
    "rating" REAL,
    "rating_count" INTEGER,
    "review_count" INTEGER,
    "ingredients" TEXT NOT NULL,
    "directions" TEXT NOT NULL,
    "prep_time" TEXT,
    "cook_time" TEXT,
    "total_time" TEXT,
    "servings" INTEGER,
    "yields" TEXT,
    "calories" INTEGER,
    "carbohydrates_g" REAL,
    "sugars_g" REAL,
    "fat_g" REAL,
    "protein_g" REAL,
    "sodium_mg" INTEGER,
    "instructions_list" TEXT,
    "image" TEXT
);
INSERT INTO "new_Recipe" ("description", "id", "ingredients") SELECT "description", "id", "ingredients" FROM "Recipe";
DROP TABLE "Recipe";
ALTER TABLE "new_Recipe" RENAME TO "Recipe";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
