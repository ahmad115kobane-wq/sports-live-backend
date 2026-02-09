-- CreateTable
CREATE TABLE "team_competitions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "team_id" TEXT NOT NULL,
    "competition_id" TEXT NOT NULL,
    "season" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "team_competitions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_competitions_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competitions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "team_competitions_team_id_competition_id_key" ON "team_competitions"("team_id", "competition_id");
