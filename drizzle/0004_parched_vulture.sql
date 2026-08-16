CREATE TABLE `quote_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agency_id` integer NOT NULL,
	`quote_id` integer NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `quote_items_agency_quote_idx` ON `quote_items` (`agency_id`, `quote_id`, `sort_order`);
