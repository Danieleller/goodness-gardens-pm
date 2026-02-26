-- Projects table (replaces rocks, but rocks table kept for backward compat)
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`owner_user_id` text,
	`quarter` text,
	`rock_number` integer NOT NULL DEFAULT 0,
	`status` text NOT NULL DEFAULT 'not_started',
	`progress` integer NOT NULL DEFAULT 0,
	`notes` text,
	`type` text NOT NULL DEFAULT 'project',
	`visibility` text NOT NULL DEFAULT 'members',
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `project_members` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL DEFAULT 'member',
	`added_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_members_project_user` ON `project_members` (`project_id`, `user_id`);
