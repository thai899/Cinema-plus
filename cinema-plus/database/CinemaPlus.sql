-- ============================================================================
-- 1. KHỞI TẠO CƠ SỞ DỮ LIỆU (Kiểm tra nếu chưa có mới tạo)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'CinemaPlusDB')
BEGIN
    CREATE DATABASE CinemaPlusDB;
END
GO

USE CinemaPlusDB;
GO

-- ============================================================================
-- 2. PHÂN HỆ NGƯỜI DÙNG & PHÂN QUYỀN (USER & SECURITY)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Roles]') AND type in (N'U'))
BEGIN
    CREATE TABLE Roles (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE -- ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF, ROLE_CUSTOMER
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
    CREATE TABLE Users (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        full_name NVARCHAR(100) NOT NULL,
        phone VARCHAR(15) NULL,
        role_id BIGINT NOT NULL,
        status NVARCHAR(20) DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (role_id) REFERENCES Roles(id)
    );
END

-- ============================================================================
-- 3. PHÂN HỆ QUẢN LÝ PHIM VÀ THỂ LOẠI (MOVIES)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Genres]') AND type in (N'U'))
BEGIN
    CREATE TABLE Genres (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL UNIQUE
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Movies]') AND type in (N'U'))
BEGIN
    CREATE TABLE Movies (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NULL,
        duration INT NOT NULL,
        release_date DATE NOT NULL,
        end_date DATE NOT NULL,
        poster_url VARCHAR(500) NULL,
        trailer_url VARCHAR(500) NULL,
        age_rating VARCHAR(10) DEFAULT 'T13',
        status NVARCHAR(30) DEFAULT 'NOW_SHOWING'
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Movie_Genre_Map]') AND type in (N'U'))
BEGIN
    CREATE TABLE Movie_Genre_Map (
        movie_id BIGINT NOT NULL,
        genre_id BIGINT NOT NULL,
        PRIMARY KEY (movie_id, genre_id),
        FOREIGN KEY (movie_id) REFERENCES Movies(id) ON DELETE CASCADE,
        FOREIGN KEY (genre_id) REFERENCES Genres(id) ON DELETE CASCADE
    );
END

-- ============================================================================
-- 4. PHÂN HỆ CƠ SỞ HẠ TẦNG CỤM RẠP VÀ PHÒNG CHIẾU (INFRASTRUCTURE)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cinemas]') AND type in (N'U'))
BEGIN
    CREATE TABLE Cinemas (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        address NVARCHAR(255) NOT NULL,
        city NVARCHAR(50) NOT NULL
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Rooms]') AND type in (N'U'))
BEGIN
    CREATE TABLE Rooms (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(50) NOT NULL,
        total_seats INT NOT NULL,
        cinema_id BIGINT NOT NULL,
        status NVARCHAR(20) DEFAULT 'AVAILABLE',
        FOREIGN KEY (cinema_id) REFERENCES Cinemas(id) ON DELETE CASCADE
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Seats]') AND type in (N'U'))
BEGIN
    CREATE TABLE Seats (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        seat_row VARCHAR(5) NOT NULL,
        seat_number INT NOT NULL,
        type NVARCHAR(20) DEFAULT 'NORMAL',
        room_id BIGINT NOT NULL,
        FOREIGN KEY (room_id) REFERENCES Rooms(id) ON DELETE CASCADE
    );
END

-- ============================================================================
-- 5. PHÂN HỆ ĐIỀU PHỐI LỊCH CHIẾU (SHOWTIMES)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Showtimes]') AND type in (N'U'))
BEGIN
    CREATE TABLE Showtimes (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        movie_id BIGINT NOT NULL,
        room_id BIGINT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        base_price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (movie_id) REFERENCES Movies(id),
        FOREIGN KEY (room_id) REFERENCES Rooms(id)
    );
END

-- ============================================================================
-- 6. PHÂN HỆ ĐẶT VÉ & THANH TOÁN (BOOKING & TICKETING)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Bookings]') AND type in (N'U'))
BEGIN
    CREATE TABLE Bookings (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id BIGINT NOT NULL,
        showtime_id BIGINT NOT NULL,
        booking_time DATETIME DEFAULT GETDATE(),
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method NVARCHAR(30) DEFAULT 'VNPAY',
        payment_status NVARCHAR(20) DEFAULT 'PENDING',
        FOREIGN KEY (user_id) REFERENCES Users(id),
        FOREIGN KEY (showtime_id) REFERENCES Showtimes(id)
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Tickets]') AND type in (N'U'))
BEGIN
    CREATE TABLE Tickets (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        booking_id BIGINT NOT NULL,
        seat_id BIGINT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        qr_code VARCHAR(255) NOT NULL UNIQUE,
        is_checked_in BIT DEFAULT 0,
        checked_in_at DATETIME NULL,
        FOREIGN KEY (booking_id) REFERENCES Bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (seat_id) REFERENCES Seats(id)
    );
END
GO

-- ============================================================================
-- 7. CÁC THỦ TỤC LƯU TRỮ CHUYÊN SÂU (Xóa cũ tạo mới nếu đã có)
-- ============================================================================

-- Thủ tục 1: Thêm mới suất chiếu kèm kiểm tra trùng lịch
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Tickets]') AND name = 'is_checked_in'
)
BEGIN
    ALTER TABLE Tickets ADD is_checked_in BIT DEFAULT 0;
    PRINT 'Da bo sung cot is_checked_in vao bang Tickets!';
END
GO

--  Kiểm tra và bổ sung cột 'checked_in_at' nếu chưa có
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Tickets]') AND name = 'checked_in_at'
)
BEGIN
    ALTER TABLE Tickets ADD checked_in_at DATETIME NULL;
    PRINT 'Da bo sung cot checked_in_at vao bang Tickets thành công!';
END
ELSE
BEGIN
    PRINT 'Cot checked_in_at da ton tai.';
END
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_CreateShowtime]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE sp_CreateShowtime;
END
GO

CREATE PROCEDURE sp_CreateShowtime
    @MovieId BIGINT,
    @RoomId BIGINT,
    @StartTime DATETIME,
    @BasePrice DECIMAL(10,2),
    @IsSuccess BIT OUTPUT,
    @Message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Duration INT;
    DECLARE @EndTime DATETIME;

    SELECT @Duration = duration FROM Movies WHERE id = @MovieId;
    SET @EndTime = DATEADD(minute, @Duration + 15, @StartTime);

    IF EXISTS (
        SELECT 1 FROM Showtimes 
        WHERE room_id = @RoomId 
          AND (
               (@StartTime >= start_time AND @StartTime < end_time) OR
               (@EndTime > start_time AND @EndTime <= end_time) OR
               (start_time >= @StartTime AND start_time < @EndTime)
              )
    )
    BEGIN
        SET @IsSuccess = 0;
        SET @Message = N'Lỗi: Phòng chiếu đã bị trùng lịch với suất chiếu khác!';
    END
    ELSE
    BEGIN
        INSERT INTO Showtimes (movie_id, room_id, start_time, end_time, base_price)
        VALUES (@MovieId, @RoomId, @StartTime, @EndTime, @BasePrice);
        
        SET @IsSuccess = 1;
        SET @Message = N'Thành công: Suất chiếu mới đã được cấu hình!';
    END
END;
GO


-- Thủ tục 2: Quét mã QR soát vé tích hợp log thời gian thực
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_ProcessTicketCheckIn]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE sp_ProcessTicketCheckIn;
END
GO

CREATE PROCEDURE sp_ProcessTicketCheckIn
    @QrCode VARCHAR(255),
    @IsSuccess BIT OUTPUT,
    @Message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM Tickets WHERE qr_code = @QrCode)
    BEGIN
        SET @IsSuccess = 0;
        SET @Message = N'Lỗi: Vé không tồn tại trên hệ thống!';
        RETURN;
    END

    IF EXISTS (
        SELECT 1 FROM Tickets t 
        JOIN Bookings b ON t.booking_id = b.id 
        WHERE t.qr_code = @QrCode AND b.payment_status <> 'PAID'
    )
    BEGIN
        SET @IsSuccess = 0;
        SET @Message = N'Lỗi: Vé thuộc đơn hàng chưa hoàn tất thanh toán!';
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM Tickets WHERE qr_code = @QrCode AND is_checked_in = 1)
    BEGIN
        SET @IsSuccess = 0;
        SET @Message = N'Cảnh báo: Vé này đã được sử dụng để vào phòng chiếu trước đó!';
    END
    ELSE
    BEGIN
        UPDATE Tickets 
        SET is_checked_in = 1, checked_in_at = GETDATE() 
        WHERE qr_code = @QrCode;
        
        SET @IsSuccess = 1;
        SET @Message = N'Hợp lệ: Mời khách hàng vào phòng chiếu!';
    END
END;
GO

--thủ tục 3: Báo cáo doanh thu chi tiết theo ngày cho các chi nhánh
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_ReportRevenueByCinema]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE sp_ReportRevenueByCinema;
END
GO

CREATE PROCEDURE sp_ReportRevenueByCinema
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.id AS CinemaId,
        c.name AS CinemaName,
        c.city AS City,
        COUNT(DISTINCT b.id) AS TotalInvoices,
        SUM(t.price) AS TotalTicketRevenue,
        SUM(b.total_amount) AS AggregateRevenue
    FROM Cinemas c
    JOIN Rooms r ON c.id = r.cinema_id
    JOIN Showtimes s ON r.id = s.room_id
    JOIN Bookings b ON s.id = b.showtime_id
    JOIN Tickets t ON b.id = t.booking_id
    WHERE b.payment_status = 'PAID'
      AND CAST(b.booking_time AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY c.id, c.name, c.city
    ORDER BY AggregateRevenue DESC;
END;
GO

-- ============================================================================
-- 8. KHỞI TẠO DỮ LIỆU ĐẦU (Chỉ chèn nếu chưa tồn tại)
-- ============================================================================

-- Thêm các phân hệ quyền
IF NOT EXISTS (SELECT 1 FROM Roles WHERE name = 'ROLE_ADMIN') INSERT INTO Roles (name) VALUES ('ROLE_ADMIN');
IF NOT EXISTS (SELECT 1 FROM Roles WHERE name = 'ROLE_MANAGER') INSERT INTO Roles (name) VALUES ('ROLE_MANAGER');
IF NOT EXISTS (SELECT 1 FROM Roles WHERE name = 'ROLE_STAFF') INSERT INTO Roles (name) VALUES ('ROLE_STAFF');
IF NOT EXISTS (SELECT 1 FROM Roles WHERE name = 'ROLE_CUSTOMER') INSERT INTO Roles (name) VALUES ('ROLE_CUSTOMER');

-- Thêm thể loại phim mẫu
IF NOT EXISTS (SELECT 1 FROM Genres WHERE name = N'Hành Động') INSERT INTO Genres (name) VALUES (N'Hành Động');
IF NOT EXISTS (SELECT 1 FROM Genres WHERE name = N'Khoa Học Viễn Tưởng') INSERT INTO Genres (name) VALUES (N'Khoa Học Viễn Tưởng');
IF NOT EXISTS (SELECT 1 FROM Genres WHERE name = N'Tình Cảm') INSERT INTO Genres (name) VALUES (N'Tình Cảm');
IF NOT EXISTS (SELECT 1 FROM Genres WHERE name = N'Kinh Dị') INSERT INTO Genres (name) VALUES (N'Kinh Dị');

-- Thêm các cụm rạp mẫu
IF NOT EXISTS (SELECT 1 FROM Cinemas WHERE name = N'Cinema Plus - Trường Chinh') 
    INSERT INTO Cinemas (name, address, city) VALUES (N'Cinema Plus - Trường Chinh', N'140 Lê Trọng Tấn, Tây Thạnh, Tân Phú', N'Hồ Chí Minh');

IF NOT EXISTS (SELECT 1 FROM Cinemas WHERE name = N'Cinema Plus - Nguyễn Văn Cừ') 
    INSERT INTO Cinemas (name, address, city) VALUES (N'Cinema Plus - Nguyễn Văn Cừ', N'235 Nguyễn Văn Cừ, Quận 5', N'Hồ Chí Minh');
GO

GO

-- Lấy ID của các Role để tránh sai lệch
DECLARE @AdminId BIGINT = (SELECT id FROM Roles WHERE name = 'ROLE_ADMIN');
DECLARE @ManagerId BIGINT = (SELECT id FROM Roles WHERE name = 'ROLE_MANAGER');
DECLARE @StaffId BIGINT = (SELECT id FROM Roles WHERE name = 'ROLE_STAFF');
DECLARE @CustomerId BIGINT = (SELECT id FROM Roles WHERE name = 'ROLE_CUSTOMER');

-- Thêm tài khoản Admin mẫu
IF NOT EXISTS (SELECT 1 FROM Users WHERE username = 'admin_thai')
    INSERT INTO Users (username, password, email, full_name, role_id, status)
    VALUES ('admin', '123456', 'admin@cinemaplus.com', N'Trịnh Hoàng Thái (Admin)', @AdminId, 'ACTIVE');

-- Thêm tài khoản Manager mẫu
IF NOT EXISTS (SELECT 1 FROM Users WHERE username = 'manager_vinh')
    INSERT INTO Users (username, password, email, full_name, role_id, status)
    VALUES ('manager', '123456', 'manager@cinemaplus.com', N'Nguyễn Hoàng Vinh (Manager)', @ManagerId, 'ACTIVE');

-- Thêm tài khoản Staff mẫu
IF NOT EXISTS (SELECT 1 FROM Users WHERE username = 'staff_01')
    INSERT INTO Users (username, password, email, full_name, role_id, status)
    VALUES ('staff', '123456', 'staff@cinemaplus.com', N'Nhân viên Quầy vé 01', @StaffId, 'ACTIVE');

-- Thêm tài khoản Khách hàng mẫu
IF NOT EXISTS (SELECT 1 FROM Users WHERE username = 'customer_test')
    INSERT INTO Users (username, password, email, full_name, role_id, status)
    VALUES ('customer', '123456', 'customer@gmail.com', N'Khách Hàng Trải Nghiệm', @CustomerId, 'ACTIVE');
GO