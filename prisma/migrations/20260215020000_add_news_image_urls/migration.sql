-- Add support for multiple news images
ALTER TABLE "news_articles"
ADD COLUMN "image_urls" JSONB;

-- Backfill existing single image into image_urls array
UPDATE "news_articles"
SET "image_urls" = jsonb_build_array("image_url")
WHERE "image_url" IS NOT NULL
  AND "image_urls" IS NULL;
