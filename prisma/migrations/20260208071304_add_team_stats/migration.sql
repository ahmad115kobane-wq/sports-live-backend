-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'FOOTBALL',
    "logo_url" TEXT,
    "primary_color" TEXT,
    "country" TEXT,
    "city" TEXT,
    "stadium" TEXT,
    "coach" TEXT,
    "founded" INTEGER,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "goals_for" INTEGER NOT NULL DEFAULT 0,
    "goals_against" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_teams" ("category", "city", "coach", "country", "created_at", "founded", "id", "logo_url", "name", "primary_color", "short_name", "stadium") SELECT "category", "city", "coach", "country", "created_at", "founded", "id", "logo_url", "name", "primary_color", "short_name", "stadium" FROM "teams";
DROP TABLE "teams";
ALTER TABLE "new_teams" RENAME TO "teams";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
