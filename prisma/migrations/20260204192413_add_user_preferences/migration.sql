-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "avatar" TEXT,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "push_token" TEXT,
    "preferences" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "logo_url" TEXT,
    "primary_color" TEXT,
    "country" TEXT,
    "city" TEXT,
    "stadium" TEXT,
    "coach" TEXT,
    "founded" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "team_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shirt_number" INTEGER,
    "position" TEXT,
    "image_url" TEXT,
    "nationality" TEXT,
    "date_of_birth" DATETIME,
    "height" INTEGER,
    "weight" INTEGER,
    "preferred_foot" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "competitions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "logo_url" TEXT,
    "country" TEXT,
    "season" TEXT,
    "type" TEXT NOT NULL DEFAULT 'football',
    "icon" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competition_id" TEXT,
    "home_team_id" TEXT NOT NULL,
    "away_team_id" TEXT NOT NULL,
    "start_time" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "home_score" INTEGER NOT NULL DEFAULT 0,
    "away_score" INTEGER NOT NULL DEFAULT 0,
    "current_minute" INTEGER,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "venue" TEXT,
    "referee" TEXT,
    "attendance" INTEGER,
    "weather" TEXT,
    "matchday" INTEGER,
    "season" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "matches_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competitions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "teams" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "teams" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "match_operators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "match_id" TEXT NOT NULL,
    "operator_id" TEXT NOT NULL,
    "assigned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "match_operators_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "match_operators_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "match_id" TEXT NOT NULL,
    "minute" INTEGER NOT NULL,
    "extra_time" INTEGER,
    "type" TEXT NOT NULL,
    "team_id" TEXT,
    "player_id" TEXT,
    "secondary_player_id" TEXT,
    "pos_x" REAL,
    "pos_y" REAL,
    "description" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "events_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "events_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "events_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "events_secondary_player_id_fkey" FOREIGN KEY ("secondary_player_id") REFERENCES "players" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "events_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorites_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "match_lineups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "match_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "formation" TEXT,
    "coach" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "match_lineups_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "match_lineups_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lineup_players" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lineup_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "position" TEXT,
    "position_x" REAL,
    "position_y" REAL,
    "is_starter" BOOLEAN NOT NULL DEFAULT true,
    "is_captain" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lineup_players_lineup_id_fkey" FOREIGN KEY ("lineup_id") REFERENCES "match_lineups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lineup_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "match_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "match_id" TEXT NOT NULL,
    "home_possession" INTEGER,
    "home_shots" INTEGER,
    "home_shots_on_target" INTEGER,
    "home_corners" INTEGER,
    "home_fouls" INTEGER,
    "home_offsides" INTEGER,
    "home_yellow_cards" INTEGER,
    "home_red_cards" INTEGER,
    "home_passes" INTEGER,
    "home_pass_accuracy" INTEGER,
    "home_saves" INTEGER,
    "away_possession" INTEGER,
    "away_shots" INTEGER,
    "away_shots_on_target" INTEGER,
    "away_corners" INTEGER,
    "away_fouls" INTEGER,
    "away_offsides" INTEGER,
    "away_yellow_cards" INTEGER,
    "away_red_cards" INTEGER,
    "away_passes" INTEGER,
    "away_pass_accuracy" INTEGER,
    "away_saves" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "match_stats_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "match_operators_match_id_operator_id_key" ON "match_operators"("match_id", "operator_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_match_id_key" ON "favorites"("user_id", "match_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_lineups_match_id_team_id_key" ON "match_lineups"("match_id", "team_id");

-- CreateIndex
CREATE UNIQUE INDEX "lineup_players_lineup_id_player_id_key" ON "lineup_players"("lineup_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_stats_match_id_key" ON "match_stats"("match_id");
