CREATE TABLE `automation_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agency_id` integer NOT NULL,
	`event_key` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `automation_events_event_key_unique` ON `automation_events` (`event_key`);