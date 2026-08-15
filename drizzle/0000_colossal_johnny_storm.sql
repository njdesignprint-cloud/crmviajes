CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`destination` text DEFAULT 'Por definir' NOT NULL,
	`status` text DEFAULT 'Nuevo' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trip_id` integer NOT NULL,
	`amount` real NOT NULL,
	`due_date` text NOT NULL,
	`paid_at` text,
	`method` text DEFAULT 'Pendiente' NOT NULL,
	`note` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer,
	`title` text NOT NULL,
	`due_date` text NOT NULL,
	`priority` text DEFAULT 'Normal' NOT NULL,
	`completed` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trips` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer NOT NULL,
	`destination` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text DEFAULT '' NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Cotización' NOT NULL
);
