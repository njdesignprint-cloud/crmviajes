CREATE TABLE `activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer NOT NULL,
	`kind` text DEFAULT 'Nota' NOT NULL,
	`detail` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer NOT NULL,
	`destination` text NOT NULL,
	`travelers` integer DEFAULT 1 NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`taxes` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Borrador' NOT NULL,
	`valid_until` text NOT NULL,
	`created_at` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `trips_client_idx` ON `trips` (`client_id`);
--> statement-breakpoint
CREATE INDEX `trips_start_idx` ON `trips` (`start_date`);
--> statement-breakpoint
CREATE INDEX `payments_trip_idx` ON `payments` (`trip_id`);
--> statement-breakpoint
CREATE INDEX `payments_due_idx` ON `payments` (`due_date`, `paid_at`);
--> statement-breakpoint
CREATE INDEX `tasks_due_idx` ON `tasks` (`completed`, `due_date`);
--> statement-breakpoint
CREATE INDEX `quotes_client_idx` ON `quotes` (`client_id`);
--> statement-breakpoint
CREATE INDEX `quotes_status_idx` ON `quotes` (`status`, `valid_until`);
--> statement-breakpoint
CREATE INDEX `activities_client_idx` ON `activities` (`client_id`, `created_at`);
