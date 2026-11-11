-- ============================================================
-- Cinema Plus - SQL Server Backup & Restore Script
-- Database: CinemaPlusDB
-- ============================================================

-- ------------------------------------------------------------
-- 1. BACKUP DATABASE
-- ------------------------------------------------------------
-- Đảm bảo thư mục D:\backup\sqlserver đã tồn tại trên máy
BACKUP DATABASE CinemaPlusDB
TO DISK = 'D:\backup\sqlserver\CinemaPlusDB_Full.bak'
WITH FORMAT,
     MEDIANAME = 'CinemaPlus_Backup_Media',
     NAME = 'Full Backup of CinemaPlusDB',
     STATS = 10;
GO

-- ------------------------------------------------------------
-- 2. RESTORE DATABASE
-- ------------------------------------------------------------
USE master;
GO

-- Chuyển về SINGLE_USER để ngắt toàn bộ connection đang mở từ Backend Spring Boot
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'CinemaPlusDB')
BEGIN
    ALTER DATABASE CinemaPlusDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
END
GO

-- Thực hiện khôi phục
RESTORE DATABASE CinemaPlusDB
FROM DISK = 'D:\backup\sqlserver\CinemaPlusDB_Full.bak'
WITH REPLACE,
     STATS = 10;
GO

-- Trả về trạng thái MULTI_USER
ALTER DATABASE CinemaPlusDB SET MULTI_USER;
GO
