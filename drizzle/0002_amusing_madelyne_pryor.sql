CREATE TABLE `agencies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `agencies` (`id`, `name`, `created_at`) VALUES (1, 'Rumbo Travel', date('now'));
--> statement-breakpoint
CREATE TABLE `agency_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agency_id` integer NOT NULL,
	`email` text NOT NULL,
	`display_name` text DEFAULT '' NOT NULL,
	`role` text DEFAULT 'agent' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agency_members_email_unique` ON `agency_members` (`email`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agency_id` integer NOT NULL,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `activities` ADD `agency_id` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `agency_id` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `agency_id` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `agency_id` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `agency_id` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `trips` ADD `agency_id` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
CREATE INDEX `clients_agency_idx` ON `clients` (`agency_id`, `id`);
--> statement-breakpoint
CREATE INDEX `trips_agency_idx` ON `trips` (`agency_id`, `start_date`);
--> statement-breakpoint
CREATE INDEX `payments_agency_idx` ON `payments` (`agency_id`, `due_date`);
--> statement-breakpoint
CREATE INDEX `tasks_agency_idx` ON `tasks` (`agency_id`, `completed`, `due_date`);
--> statement-breakpoint
CREATE INDEX `quotes_agency_idx` ON `quotes` (`agency_id`, `status`, `valid_until`);
--> statement-breakpoint
CREATE INDEX `activities_agency_idx` ON `activities` (`agency_id`, `created_at`);
--> statement-breakpoint
CREATE INDEX `audit_logs_agency_idx` ON `audit_logs` (`agency_id`, `created_at`);
