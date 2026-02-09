-- CreateTable
CREATE TABLE "store_banners" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "title_ar" TEXT NOT NULL,
    "title_ku" TEXT NOT NULL,
    "subtitle" TEXT,
    "subtitle_ar" TEXT,
    "subtitle_ku" TEXT,
    "image_url" TEXT,
    "gradient_start" TEXT,
    "gradient_end" TEXT,
    "link_type" TEXT,
    "link_value" TEXT,
    "discount" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
