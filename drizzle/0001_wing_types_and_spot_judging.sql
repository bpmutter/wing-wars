CREATE TABLE `spot_battles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`spot_a_id` text NOT NULL,
	`spot_b_id` text NOT NULL,
	`winner_id` text NOT NULL,
	`elo_before_a` integer NOT NULL,
	`elo_before_b` integer NOT NULL,
	`elo_delta_a` integer NOT NULL,
	`elo_delta_b` integer NOT NULL,
	`verdict` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`spot_a_id`) REFERENCES `spots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`spot_b_id`) REFERENCES `spots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`winner_id`) REFERENCES `spots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `spot_battles_user_idx` ON `spot_battles` (`user_id`);--> statement-breakpoint
CREATE INDEX `spot_battles_a_idx` ON `spot_battles` (`spot_a_id`);--> statement-breakpoint
CREATE INDEX `spot_battles_b_idx` ON `spot_battles` (`spot_b_id`);--> statement-breakpoint
CREATE INDEX `spot_battles_created_idx` ON `spot_battles` (`created_at`);--> statement-breakpoint
CREATE TABLE `spot_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`spot_id` text NOT NULL,
	`user_id` text NOT NULL,
	`spot_battle_id` text,
	`wing_game` integer NOT NULL,
	`sides` integer NOT NULL,
	`vibe` integer NOT NULL,
	`service` integer NOT NULL,
	`value` integer NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`spot_id`) REFERENCES `spots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`spot_battle_id`) REFERENCES `spot_battles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `spot_reviews_spot_idx` ON `spot_reviews` (`spot_id`);--> statement-breakpoint
CREATE INDEX `spot_reviews_user_idx` ON `spot_reviews` (`user_id`);--> statement-breakpoint
CREATE TABLE `wing_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`emoji` text DEFAULT '🍗' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_by_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wing_types_name_unique` ON `wing_types` (`name`);--> statement-breakpoint
ALTER TABLE `spots` ADD `elo` integer DEFAULT 1200 NOT NULL;--> statement-breakpoint
ALTER TABLE `spots` ADD `wins` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `spots` ADD `losses` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `wings` ADD `wing_type_id` text REFERENCES wing_types(id);--> statement-breakpoint
CREATE INDEX `wings_type_idx` ON `wings` (`wing_type_id`);