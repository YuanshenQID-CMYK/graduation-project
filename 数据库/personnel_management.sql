/*
 Navicat Premium Dump SQL

 Source Server         : MySQL
 Source Server Type    : MySQL
 Source Server Version : 90700 (9.7.0)
 Source Host           : localhost:3306
 Source Schema         : personnel_management

 Target Server Type    : MySQL
 Target Server Version : 90700 (9.7.0)
 File Encoding         : 65001

 Date: 20/05/2026 17:28:02
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for operation_logs
-- ----------------------------
DROP TABLE IF EXISTS `operation_logs`;
CREATE TABLE `operation_logs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `operation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `target_user` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `operation_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 22 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '操作日志' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of operation_logs
-- ----------------------------
INSERT INTO `operation_logs` VALUES (1, 1, '无常', '登录系统', NULL, '::1', '2026-05-17 00:07:07');
INSERT INTO `operation_logs` VALUES (2, 1, '管理员', '修改用户权限为管理员', '张三', NULL, '2026-05-17 00:07:12');
INSERT INTO `operation_logs` VALUES (3, 1, '管理员', '禁用用户', '张三', NULL, '2026-05-17 00:09:33');
INSERT INTO `operation_logs` VALUES (4, 1, '管理员', '启用用户', '张三', NULL, '2026-05-17 00:09:35');
INSERT INTO `operation_logs` VALUES (5, 1, '无常', '登录系统', NULL, '::1', '2026-05-17 10:57:07');
INSERT INTO `operation_logs` VALUES (6, 1, '无常', '登录系统', NULL, '::1', '2026-05-17 12:52:25');
INSERT INTO `operation_logs` VALUES (7, NULL, '烟雨', '注册账号', '烟雨', NULL, '2026-05-17 12:53:33');
INSERT INTO `operation_logs` VALUES (8, NULL, '烟雨', '登录系统', NULL, '::1', '2026-05-17 12:53:50');
INSERT INTO `operation_logs` VALUES (9, 2, '张三', '登录系统', NULL, '::1', '2026-05-17 12:54:36');
INSERT INTO `operation_logs` VALUES (10, NULL, '2', '注册账号', '2', NULL, '2026-05-17 12:54:49');
INSERT INTO `operation_logs` VALUES (11, 1, '无常', '登录系统', NULL, '::1', '2026-05-17 12:55:04');
INSERT INTO `operation_logs` VALUES (12, 2, '张三', '登录系统', NULL, '::1', '2026-05-17 12:55:36');
INSERT INTO `operation_logs` VALUES (13, 1, '无常', '登录系统', NULL, '::1', '2026-05-17 13:25:02');
INSERT INTO `operation_logs` VALUES (14, NULL, '元神', '注册账号', '元神', NULL, '2026-05-17 13:26:06');
INSERT INTO `operation_logs` VALUES (15, NULL, '元神', '登录系统', NULL, '::1', '2026-05-17 13:26:39');
INSERT INTO `operation_logs` VALUES (16, 1, '无常', '登录系统', NULL, '::1', '2026-05-17 13:48:42');
INSERT INTO `operation_logs` VALUES (17, 1, '无常', '登录系统', NULL, '::1', '2026-05-18 13:29:59');
INSERT INTO `operation_logs` VALUES (18, 1, '无常', '登录系统', NULL, '::1', '2026-05-18 18:27:17');
INSERT INTO `operation_logs` VALUES (19, 1, '无常', '登录系统', NULL, '::1', '2026-05-18 18:51:37');
INSERT INTO `operation_logs` VALUES (20, 1, '无常', '删除用户', '用户ID: 11', NULL, '2026-05-18 19:03:06');
INSERT INTO `operation_logs` VALUES (21, 1, '无常', '登录系统', NULL, '::1', '2026-05-20 13:57:40');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '工号',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '姓名',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '邮箱',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '电话',
  `gender` enum('男','女','保密') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '保密' COMMENT '性别',
  `role` enum('admin','user','guest') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'user' COMMENT '角色',
  `status` enum('active','disabled') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'active' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `employee_id`(`employee_id` ASC) USING BTREE,
  UNIQUE INDEX `email`(`email` ASC) USING BTREE,
  INDEX `idx_employee_id`(`employee_id` ASC) USING BTREE,
  INDEX `idx_email`(`email` ASC) USING BTREE,
  INDEX `idx_role`(`role` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'ADMIN001', '无常', '200558', 'admin@system.com', '13800000000', '男', 'admin', 'active', '2026-05-17 00:05:17', '2026-05-17 00:05:17');
INSERT INTO `users` VALUES (2, 'EMP001', '张三', '123456', 'zhangsan@test.com', '13800000001', '男', 'user', 'active', '2026-05-17 00:05:18', '2026-05-17 13:27:06');
INSERT INTO `users` VALUES (3, 'EMP002', '李四', '123456', 'lisi@test.com', '13800000002', '女', 'user', 'active', '2026-05-17 00:05:18', '2026-05-17 12:55:56');
INSERT INTO `users` VALUES (4, 'EMP003', '王五', '123456', 'wangwu@test.com', '13800000003', '男', 'user', 'active', '2026-05-17 00:05:18', '2026-05-17 00:05:18');

SET FOREIGN_KEY_CHECKS = 1;
