-- CreateTable
CREATE TABLE "store_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_ku" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'grid',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "store_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_ku" TEXT NOT NULL,
    "description" TEXT,
    "description_ar" TEXT,
    "description_ku" TEXT,
    "price" REAL NOT NULL,
    "original_price" REAL,
    "discount" INTEGER,
    "image_url" TEXT,
    "emoji" TEXT DEFAULT '📦',
    "badge" TEXT,
    "rating" REAL NOT NULL DEFAULT 0,
    "reviews_count" INTEGER NOT NULL DEFAULT 0,
    "colors" TEXT,
    "sizes" TEXT,
    "in_stock" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "store_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "store_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "store_products_category_id_idx" ON "store_products"("category_id");

-- CreateIndex
CREATE INDEX "store_products_is_active_idx" ON "store_products"("is_active");
