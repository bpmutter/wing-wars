-- Battles, Elo ratings and tournaments are retired in favor of wars.
-- Scorecards that came from battles are kept as plain tastings / spot reviews.
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_spot_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`spot_id` text NOT NULL,
	`user_id` text NOT NULL,
	`wing_game` integer NOT NULL,
	`sides` integer NOT NULL,
	`vibe` integer NOT NULL,
	`service` integer NOT NULL,
	`value` integer NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`spot_id`) REFERENCES `spots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_spot_reviews`("id", "spot_id", "user_id", "wing_game", "sides", "vibe", "service", "value", "notes", "created_at") SELECT "id", "spot_id", "user_id", "wing_game", "sides", "vibe", "service", "value", "notes", "created_at" FROM `spot_reviews`;--> statement-breakpoint
DROP TABLE `spot_reviews`;--> statement-breakpoint
ALTER TABLE `__new_spot_reviews` RENAME TO `spot_reviews`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `spot_reviews_spot_idx` ON `spot_reviews` (`spot_id`);--> statement-breakpoint
CREATE INDEX `spot_reviews_user_idx` ON `spot_reviews` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_tastings` (
	`id` text PRIMARY KEY NOT NULL,
	`wing_id` text NOT NULL,
	`user_id` text NOT NULL,
	`crisp` integer NOT NULL,
	`sauce` integer NOT NULL,
	`juiciness` integer NOT NULL,
	`heat` integer NOT NULL,
	`value` integer NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`wing_id`) REFERENCES `wings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_tastings`("id", "wing_id", "user_id", "crisp", "sauce", "juiciness", "heat", "value", "notes", "created_at") SELECT "id", "wing_id", "user_id", "crisp", "sauce", "juiciness", "heat", "value", "notes", "created_at" FROM `tastings`;--> statement-breakpoint
DROP TABLE `tastings`;--> statement-breakpoint
ALTER TABLE `__new_tastings` RENAME TO `tastings`;--> statement-breakpoint
CREATE INDEX `tastings_wing_idx` ON `tastings` (`wing_id`);--> statement-breakpoint
CREATE INDEX `tastings_user_idx` ON `tastings` (`user_id`);--> statement-breakpoint
DROP INDEX `wings_elo_idx`;--> statement-breakpoint
ALTER TABLE `wings` DROP COLUMN `elo`;--> statement-breakpoint
ALTER TABLE `wings` DROP COLUMN `wins`;--> statement-breakpoint
ALTER TABLE `wings` DROP COLUMN `losses`;--> statement-breakpoint
ALTER TABLE `spots` DROP COLUMN `elo`;--> statement-breakpoint
ALTER TABLE `spots` DROP COLUMN `wins`;--> statement-breakpoint
ALTER TABLE `spots` DROP COLUMN `losses`;--> statement-breakpoint
DROP TABLE `spot_battles`;--> statement-breakpoint
DROP TABLE `battles`;--> statement-breakpoint
DROP TABLE `tournaments`;