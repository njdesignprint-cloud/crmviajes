CREATE TABLE `platform_billing` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `agency_id` integer NOT NULL UNIQUE,
  `monthly_price` real NOT NULL DEFAULT 0,
  `billing_status` text NOT NULL DEFAULT 'not_configured',
  `next_billing_at` text,
  `updated_at` text NOT NULL
);
CREATE UNIQUE INDEX `platform_billing_agency_idx` ON `platform_billing` (`agency_id`);
