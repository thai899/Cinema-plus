# BÁO CÁO KỸ THUẬT: IMPORT/EXPORT, BACKUP VÀ RESTORE DỮ LIỆU
**Hệ thống:** Cinema Plus  
**Môi trường:** Đa cơ sở dữ liệu (SQL Server, MongoDB, Redis)

---

## 1. Cơ sở dữ liệu quan hệ SQL Server (CinemaPlusDB)

SQL Server chịu trách nhiệm lưu trữ các dữ liệu có tính toàn vẹn quan hệ cao: Người dùng, Phim, Phòng chiếu, Ghế, Suất chiếu, Đơn đặt vé và Chi tiết vé.

### 1.1. Cú pháp Backup (Sao lưu toàn phần - Full Backup)
Câu lệnh T-SQL xuất dữ liệu ra file backup `.bak`:

```sql
BACKUP DATABASE CinemaPlusDB
TO DISK = 'D:\backup\sqlserver\CinemaPlusDB_Full.bak'
WITH FORMAT,
     MEDIANAME = 'CinemaPlus_SQLServer_Backup',
     NAME = 'Full Backup of CinemaPlusDB';
GO
```

*Lệnh trên PowerShell bằng sqlcmd:*
```powershell
sqlcmd -S localhost -U sa -P 123 -Q "BACKUP DATABASE CinemaPlusDB TO DISK = 'D:\backup\sqlserver\CinemaPlusDB_Full.bak' WITH FORMAT, NAME = 'Full Backup of CinemaPlusDB';"
```

### 1.2. Cú pháp Restore (Phục hồi dữ liệu)
Ngắt các kết nối ứng dụng đang giữ kết nối đến database, sau đó phục hồi và nạp đè dữ liệu:

```sql
USE master;
GO

-- Đưa database về chế độ đơn người dùng để đóng các session còn mở
ALTER DATABASE CinemaPlusDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
GO

-- Khôi phục dữ liệu từ bản sao lưu
RESTORE DATABASE CinemaPlusDB
FROM DISK = 'D:\backup\sqlserver\CinemaPlusDB_Full.bak'
WITH REPLACE;
GO

-- Chuyển lại trạng thái đa người dùng cho ứng dụng hoạt động
ALTER DATABASE CinemaPlusDB SET MULTI_USER;
GO
```

---

## 2. Cơ sở dữ liệu NoSQL MongoDB (CinemaPlusReviews)

MongoDB lưu trữ collection phi cấu trúc `movie_reviews` (đánh giá, bình luận phim) và `user_activity_logs` (lịch sử hành vi người dùng). Sử dụng bộ công cụ dòng lệnh **MongoDB Database Tools**.

### 2.1. Sao lưu dữ liệu (`mongodump`)

```bash
# 1. Sao lưu toàn bộ database CinemaPlusReviews
mongodump --host=localhost --port=27017 --db=CinemaPlusReviews --out=D:\backup\mongodb\

# 2. Trường hợp MongoDB bật Authentication:
mongodump --host=localhost --port=27017 -u cinemaUser -p cinemaPass --authenticationDatabase=admin --db=CinemaPlusReviews --out=D:\backup\mongodb\

# 3. Xuất riêng collection movie_reviews nén thành file gzip duy nhất:
mongodump --host=localhost --port=27017 --db=CinemaPlusReviews --collection=movie_reviews --gzip --archive=D:\backup\mongodb\movie_reviews.gz
```

### 2.2. Phục hồi dữ liệu (`mongorestore`)

```bash
# 1. Phục hồi toàn bộ database từ thư mục dump (tham số --drop để làm sạch collection cũ)
mongorestore --host=localhost --port=27017 --db=CinemaPlusReviews --drop D:\backup\mongodb\CinemaPlusReviews

# 2. Trường hợp MongoDB có tài khoản xác thực:
mongorestore --host=localhost --port=27017 -u cinemaUser -p cinemaPass --authenticationDatabase=admin --db=CinemaPlusReviews --drop D:\backup\mongodb\CinemaPlusReviews

# 3. Phục hồi từ file nén gzip:
mongorestore --gzip --archive=D:\backup\mongodb\movie_reviews.gz --drop
```

---

## 3. Bộ nhớ đệm & Khóa phân tán Redis (Caching & Distributed Lock)

Redis quản lý cơ chế khóa ghế tạm thời (TTL 5 phút) và bộ nhớ đệm ứng dụng. Để đảm bảo dữ liệu không bị mất khi khởi động lại dịch vụ hoặc gặp sự cố nguồn điện, hệ thống thiết lập cơ chế lưu trữ kép **RDB (Snapshot)** và **AOF (Append-Only File)**.

### 3.1. Cấu hình cơ chế RDB Snapshot (redis.conf)
Cơ chế chụp ảnh bộ nhớ định kỳ ghi thành file nhị phân `dump.rdb`:

```ini
# Lưu snapshot tự động theo chu kỳ thay đổi key:
save 900 1      # Sau 900 giây (15 phút) nếu có ít nhất 1 key thay đổi
save 300 10     # Sau 300 giây (5 phút) nếu có ít nhất 10 key thay đổi
save 60 10000   # Sau 60 giây nếu có từ 10.000 key thay đổi

# Tên file và thư mục lưu trữ
dbfilename dump.rdb
dir /var/lib/redis/
```

*Lệnh CLI chủ động tạo snapshot tức thời qua redis-cli:*
```bash
redis-cli BGSAVE
```

### 3.2. Cấu hình cơ chế AOF - Append Only File (redis.conf)
Cơ chế ghi nhật ký mọi thao tác ghi dữ liệu theo thời gian thực vào file `appendonly.aof`:

```ini
# Kích hoạt AOF
appendonly yes
appendfilename "appendonly.aof"

# Tần suất đồng bộ dữ liệu xuống đĩa cứng:
appendfsync everysec

# Tự động nén (rewrite) file log khi dung lượng tăng:
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

### 3.3. Quy trình phục hồi dữ liệu tự động
1. Khi dịch vụ Redis Server khởi động (`redis-server redis.conf`), tiến trình sẽ tự động đọc thư mục cấu hình `dir`.
2. Do `appendonly yes` được kích hoạt, Redis sẽ **ưu tiên nạp file `appendonly.aof`** trước để phục hồi trạng thái dữ liệu chính xác và đầy đủ nhất.
3. Nếu AOF tắt hoặc file không tồn tại, Redis tự động nạp từ file snapshot **`dump.rdb`**.
