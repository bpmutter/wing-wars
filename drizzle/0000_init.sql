CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_user_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `battles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`wing_a_id` text NOT NULL,
	`wing_b_id` text NOT NULL,
	`winner_id` text NOT NULL,
	`kind` text DEFAULT 'duel' NOT NULL,
	`tournament_id` text,
	`round` integer,
	`elo_before_a` integer NOT NULL,
	`elo_before_b` integer NOT NULL,
	`elo_delta_a` integer NOT NULL,
	`elo_delta_b` integer NOT NULL,
	`verdict` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`wing_a_id`) REFERENCES `wings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`wing_b_id`) REFERENCES `wings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`winner_id`) REFERENCES `wings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `battles_user_idx` ON `battles` (`user_id`);--> statement-breakpoint
CREATE INDEX `battles_a_idx` ON `battles` (`wing_a_id`);--> statement-breakpoint
CREATE INDEX `battles_b_idx` ON `battles` (`wing_b_id`);--> statement-breakpoint
CREATE INDEX `battles_created_idx` ON `battles` (`created_at`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `spots` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`neighborhood` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_by_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `tastings` (
	`id` text PRIMARY KEY NOT NULL,
	`wing_id` text NOT NULL,
	`user_id` text NOT NULL,
	`battle_id` text,
	`crisp` integer NOT NULL,
	`sauce` integer NOT NULL,
	`juiciness` integer NOT NULL,
	`heat` integer NOT NULL,
	`value` integer NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`wing_id`) REFERENCES `wings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`battle_id`) REFERENCES `battles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tastings_wing_idx` ON `tastings` (`wing_id`);--> statement-breakpoint
CREATE INDEX `tastings_user_idx` ON `tastings` (`user_id`);--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`size` integer NOT NULL,
	`champion_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`champion_id`) REFERENCES `wings`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `wings` (
	`id` text PRIMARY KEY NOT NULL,
	`spot_id` text NOT NULL,
	`name` text NOT NULL,
	`style` text DEFAULT 'bone-in' NOT NULL,
	`heat` integer DEFAULT 1 NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`elo` integer DEFAULT 1200 NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`created_by_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`spot_id`) REFERENCES `spots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `wings_spot_idx` ON `wings` (`spot_id`);--> statement-breakpoint
CREATE INDEX `wings_elo_idx` ON `wings` (`elo`);