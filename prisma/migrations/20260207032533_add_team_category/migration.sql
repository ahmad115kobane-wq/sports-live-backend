-- CreateTable
CREATE TABLE "news_articles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "author_id" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "news_articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_teams" ("city", "coach", "country", "created_at", "founded", "id", "logo_url", "name", "primary_color", "short_name", "stadium") SELECT "city", "coach", "country", "created_at", "founded", "id", "logo_url", "name", "primary_color", "short_name", "stadium" FROM "teams";
DROP TABLE "teams";
ALTER TABLE "new_teams" RENAME TO "teams";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "news_articles_created_at_idx" ON "news_articles"("created_at");
