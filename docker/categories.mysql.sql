CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `name_ru` varchar(50) DEFAULT NULL,
  `slug` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL,
  `created_by` int(11) NOT NULL,
  `updated_at` datetime NOT NULL,
  `updated_by` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `uc_categories_slug` (`slug`),
  UNIQUE KEY `name_ru` (`name_ru`)
) ENGINE=InnoDB CHARSET=utf8;
