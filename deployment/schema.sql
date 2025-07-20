/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.4.7-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: nad_cycle
-- ------------------------------------------------------
-- Server version	11.4.7-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `batch_print_history`
--

DROP TABLE IF EXISTS `batch_print_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `batch_print_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `batch_id` varchar(100) NOT NULL,
  `print_format` enum('individual_labels','batch_summary','shipping_list') NOT NULL,
  `printed_by` varchar(100) NOT NULL,
  `printed_date` datetime DEFAULT current_timestamp(),
  `test_count` int(11) NOT NULL,
  `printer_name` varchar(100) DEFAULT NULL,
  `print_job_id` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_batch_id` (`batch_id`),
  KEY `idx_printed_date` (`printed_date`),
  KEY `idx_printed_by` (`printed_by`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary table structure for view `batch_print_status`
--

DROP TABLE IF EXISTS `batch_print_status`;
/*!50001 DROP VIEW IF EXISTS `batch_print_status`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `batch_print_status` AS SELECT
 1 AS `batch_id`,
  1 AS `total_tests`,
  1 AS `printed_tests`,
  1 AS `last_printed_date`,
  1 AS `batch_size`,
  1 AS `created_date`,
  1 AS `batch_notes`,
  1 AS `print_status`,
  1 AS `print_percentage` */;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `nad_doses`
--

DROP TABLE IF EXISTS `nad_doses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `nad_doses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplement_id` int(11) NOT NULL,
  `dose_value` varchar(100) NOT NULL,
  `unit` varchar(50) NOT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `supplement_id` (`supplement_id`),
  CONSTRAINT `nad_doses_ibfk_1` FOREIGN KEY (`supplement_id`) REFERENCES `nad_supplements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nad_supplements`
--

DROP TABLE IF EXISTS `nad_supplements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `nad_supplements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Other',
  `description` text DEFAULT NULL,
  `default_dose` varchar(100) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `min_dose` decimal(10,2) DEFAULT NULL,
  `max_dose` decimal(10,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_category` (`category`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nad_test_ids`
--

DROP TABLE IF EXISTS `nad_test_ids`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `nad_test_ids` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `test_id` varchar(25) NOT NULL,
  `batch_id` varchar(50) DEFAULT NULL,
  `batch_size` int(11) DEFAULT NULL,
  `generated_by` bigint(20) DEFAULT NULL,
  `order_id` bigint(20) DEFAULT NULL,
  `customer_id` bigint(20) DEFAULT NULL,
  `created_date` datetime DEFAULT current_timestamp(),
  `is_activated` tinyint(1) DEFAULT 0,
  `activated_date` datetime DEFAULT NULL,
  `shipping_status` varchar(50) DEFAULT 'pending',
  `shipped_date` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_printed` tinyint(1) DEFAULT 0,
  `printed_date` datetime DEFAULT NULL,
  `printed_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `test_id` (`test_id`),
  KEY `idx_test_id` (`test_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_batch_id` (`batch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nad_test_scores`
--

DROP TABLE IF EXISTS `nad_test_scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `nad_test_scores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) NOT NULL,
  `customer_id` bigint(20) NOT NULL,
  `activated_by` varchar(255) NOT NULL,
  `technician_id` varchar(255) NOT NULL,
  `test_id` varchar(255) NOT NULL,
  `score` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `is_activated` tinyint(1) DEFAULT 0,
  `score_submission_date` date DEFAULT NULL,
  `label_received_date` date DEFAULT NULL,
  `created_date` date NOT NULL,
  `activated_date` date DEFAULT NULL,
  `updated_date` date NOT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `test_id` (`test_id`),
  KEY `idx_test_id` (`test_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nad_user_roles`
--

DROP TABLE IF EXISTS `nad_user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `nad_user_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` bigint(20) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'customer',
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_id` (`customer_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nad_user_supplements`
--

DROP TABLE IF EXISTS `nad_user_supplements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `nad_user_supplements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `test_id` varchar(255) NOT NULL,
  `customer_id` bigint(20) NOT NULL,
  `supplements_with_dose` text NOT NULL,
  `habits_notes` text DEFAULT NULL,
  `created_at` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_test_id` (`test_id`),
  KEY `idx_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Final view structure for view `batch_print_status`
--

/*!50001 DROP VIEW IF EXISTS `batch_print_status`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`nad_user`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `batch_print_status` AS select `t`.`batch_id` AS `batch_id`,count(0) AS `total_tests`,sum(case when `t`.`is_printed` = 1 then 1 else 0 end) AS `printed_tests`,max(`t`.`printed_date`) AS `last_printed_date`,max(`t`.`batch_size`) AS `batch_size`,min(`t`.`created_date`) AS `created_date`,max(`t`.`notes`) AS `batch_notes`,case when sum(case when `t`.`is_printed` = 1 then 1 else 0 end) = 0 then 'not_printed' when sum(case when `t`.`is_printed` = 1 then 1 else 0 end) = count(0) then 'fully_printed' else 'partially_printed' end AS `print_status`,round(sum(case when `t`.`is_printed` = 1 then 1 else 0 end) / count(0) * 100,1) AS `print_percentage` from `nad_test_ids` `t` where `t`.`batch_id` is not null group by `t`.`batch_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-07-18 15:10:35
