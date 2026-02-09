-- CreateTable
CREATE TABLE "store_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_address" TEXT NOT NULL,
    "total_amount" REAL NOT NULL,
    "delivery_fee" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "admin_note" TEXT,
    "estimated_delivery" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "store_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "store_order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_name_ar" TEXT NOT NULL,
    "product_name_ku" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "selected_size" TEXT,
    "selected_color" TEXT,
    "image_url" TEXT,
    CONSTRAINT "store_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "store_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "store_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "store_products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "store_orders_user_id_idx" ON "store_orders"("user_id");

-- CreateIndex
CREATE INDEX "store_orders_status_idx" ON "store_orders"("status");
