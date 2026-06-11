ALTER TABLE "halls" RENAME COLUMN "price_per_hour" TO "price_per_day";--> statement-breakpoint
UPDATE "halls" SET "price_per_day" = ("price_per_day"::numeric * 8)::text;
