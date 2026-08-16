CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agency_id` integer NOT NULL,
	`trip_id` integer NOT NULL,
	`supplier_id` integer NOT NULL,
	`service_type` text NOT NULL,
	`confirmation` text DEFAULT '' NOT NULL,
	`sale_amount` real DEFAULT 0 NOT NULL,
	`cost_amount` real DEFAULT 0 NOT NULL,
	`commission_amount` real DEFAULT 0 NOT NULL,
	`commission_due_date` text DEFAULT '' NOT NULL,
	`commission_received_at` text,
	`status` text DEFAULT 'Confirmada' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agency_id` integer NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`contact_name` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `travelers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agency_id` integer NOT NULL,
	`client_id` integer NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`birth_date` text DEFAULT '' NOT NULL,
	`nationality` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `travelers_agency_client_idx` ON `travelers` (`agency_id`, `client_id`);
--> statement-breakpoint
CREATE INDEX `suppliers_agency_name_idx` ON `suppliers` (`agency_id`, `name`);
--> statement-breakpoint
CREATE INDEX `bookings_agency_trip_idx` ON `bookings` (`agency_id`, `trip_id`);
--> statement-breakpoint
CREATE INDEX `bookings_commission_idx` ON `bookings` (`agency_id`, `commission_received_at`, `commission_due_date`);
