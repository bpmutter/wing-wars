CREATE TABLE `war_battlegrounds` (
	`id` text PRIMARY KEY NOT NULL,
	`war_id` text NOT NULL,
	`spot_id` text NOT NULL,
	`added_by_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`war_id`) REFERENCES `wars`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`spot_id`) REFERENCES `spots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`added_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `war_battlegrounds_war_spot_uq` ON `war_battlegrounds` (`war_id`,`spot_id`);--> statement-breakpoint
CREATE TABLE `war_members` (
	`id` text PRIMARY KEY NOT NULL,
	`war_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`war_id`) REFERENCES `wars`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `war_members_war_user_uq` ON `war_members` (`war_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `war_members_user_idx` ON `war_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `wars` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`host_id` text NOT NULL,
	`wing_type_id` text,
	`fog_of_war` integer DEFAULT true NOT NULL,
	`ends_at` integer,
	`ended_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`host_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`wing_type_id`) REFERENCES `wing_types`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `wars_host_idx` ON `wars` (`host_id`);--> statement-breakpoint
ALTER TABLE `spot_reviews` ADD `war_id` text REFERENCES wars(id) ON DELETE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX `spot_reviews_war_user_spot_uq` ON `spot_reviews` (`war_id`,`user_id`,`spot_id`);--> statement-breakpoint
ALTER TABLE `tastings` ADD `war_id` text REFERENCES wars(id) ON DELETE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX `tastings_war_user_wing_uq` ON `tastings` (`war_id`,`user_id`,`wing_id`);