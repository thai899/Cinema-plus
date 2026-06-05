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
        status NVARCHAR(30) DEFAULT 'NOW_SHOWING',
        format VARCHAR(20) DEFAULT '2D'
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
        
        -- Các trường đồng bộ cho Java Entity Ticket
        qr_code_string VARCHAR(255) NULL,
        showtime_id BIGINT NULL,
        status VARCHAR(20) DEFAULT 'VALID',
        scanned_at DATETIME NULL,

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

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Tickets]') AND name = 'checked_in_at'
)
BEGIN
    ALTER TABLE Tickets ADD checked_in_at DATETIME NULL;
    PRINT 'Da bo sung cot checked_in_at vao bang Tickets!';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Movies]') AND name = 'format'
)
BEGIN
    ALTER TABLE Movies ADD format VARCHAR(20) DEFAULT '2D';
    PRINT 'Da bo sung cot format vao bang Movies!';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Tickets]') AND name = 'qr_code_string'
)
BEGIN
    ALTER TABLE Tickets ADD qr_code_string VARCHAR(255) NULL;
    PRINT 'Da bo sung cot qr_code_string vao bang Tickets!';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Tickets]') AND name = 'showtime_id'
)
BEGIN
    ALTER TABLE Tickets ADD showtime_id BIGINT NULL;
    PRINT 'Da bo sung cot showtime_id vao bang Tickets!';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Tickets]') AND name = 'status'
)
BEGIN
    ALTER TABLE Tickets ADD status VARCHAR(20) DEFAULT 'VALID';
    PRINT 'Da bo sung cot status vao bang Tickets!';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Tickets]') AND name = 'scanned_at'
)
BEGIN
    ALTER TABLE Tickets ADD scanned_at DATETIME NULL;
    PRINT 'Da bo sung cot scanned_at vao bang Tickets!';
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
IF NOT EXISTS (SELECT 1 FROM Users WHERE username = 'admin')
    INSERT INTO Users (username, password, email, full_name, role_id, status)
    VALUES ('admin', '123456', 'admin@cinemaplus.com', N'Trịnh Hoàng Thái (Admin)', @AdminId, 'ACTIVE');

-- Thêm tài khoản Manager mẫu
IF NOT EXISTS (SELECT 1 FROM Users WHERE username = 'manager')
    INSERT INTO Users (username, password, email, full_name, role_id, status)
    VALUES ('manager', '123456', 'manager@cinemaplus.com', N'Nguyễn Hoàng Vinh (Manager)', @ManagerId, 'ACTIVE');

-- Thêm tài khoản Staff mẫu
IF NOT EXISTS (SELECT 1 FROM Users WHERE username = 'staff')
    INSERT INTO Users (username, password, email, full_name, role_id, status)
    VALUES ('staff', '123456', 'staff@cinemaplus.com', N'Nhân viên Quầy vé 01', @StaffId, 'ACTIVE');

-- Thêm tài khoản Khách hàng mẫu
IF NOT EXISTS (SELECT 1 FROM Users WHERE username = 'customer')
    INSERT INTO Users (username, password, email, full_name, role_id, status)
    VALUES ('customer', '123456', 'customer@gmail.com', N'Khách Hàng Trải Nghiệm', @CustomerId, 'ACTIVE');
GO

-- ============================================================================
-- 9. GIEO DỮ LIỆU MẪU CHI TIẾT (Movies, Rooms, Seats, Showtimes, Tickets)
-- ============================================================================

-- Thêm Phòng chiếu (Screens) mẫu kết nối với chi nhánh 1
DECLARE @Cinema1Id BIGINT = (SELECT id FROM Cinemas WHERE name = N'Cinema Plus - Trường Chinh');
DECLARE @Cinema2Id BIGINT = (SELECT id FROM Cinemas WHERE name = N'Cinema Plus - Nguyễn Văn Cừ');

IF NOT EXISTS (SELECT 1 FROM Rooms WHERE name = N'Phòng 1 (IMAX)' AND cinema_id = @Cinema1Id)
    INSERT INTO Rooms (name, total_seats, cinema_id, status) VALUES (N'Phòng 1 (IMAX)', 90, @Cinema1Id, 'AVAILABLE');

IF NOT EXISTS (SELECT 1 FROM Rooms WHERE name = N'Phòng 2 (4DX)' AND cinema_id = @Cinema1Id)
    INSERT INTO Rooms (name, total_seats, cinema_id, status) VALUES (N'Phòng 2 (4DX)', 90, @Cinema1Id, 'AVAILABLE');

IF NOT EXISTS (SELECT 1 FROM Rooms WHERE name = N'Phòng 3 (Luxury)' AND cinema_id = @Cinema1Id)
    INSERT INTO Rooms (name, total_seats, cinema_id, status) VALUES (N'Phòng 3 (Luxury)', 90, @Cinema1Id, 'AVAILABLE');

IF NOT EXISTS (SELECT 1 FROM Rooms WHERE name = N'Phòng 5' AND cinema_id = @Cinema1Id)
    INSERT INTO Rooms (name, total_seats, cinema_id, status) VALUES (N'Phòng 5', 90, @Cinema1Id, 'AVAILABLE');
GO

-- Lấy IDs của các Room vừa tạo
DECLARE @Cinema1Id BIGINT = (SELECT id FROM Cinemas WHERE name = N'Cinema Plus - Trường Chinh');
DECLARE @Room1Id BIGINT = (SELECT id FROM Rooms WHERE name = N'Phòng 1 (IMAX)' AND cinema_id = @Cinema1Id);
DECLARE @Room2Id BIGINT = (SELECT id FROM Rooms WHERE name = N'Phòng 2 (4DX)' AND cinema_id = @Cinema1Id);
DECLARE @Room3Id BIGINT = (SELECT id FROM Rooms WHERE name = N'Phòng 3 (Luxury)' AND cinema_id = @Cinema1Id);
DECLARE @Room5Id BIGINT = (SELECT id FROM Rooms WHERE name = N'Phòng 5' AND cinema_id = @Cinema1Id);

-- Sinh ghế tự động cho các phòng nếu chưa có
DECLARE @RoomId BIGINT;
DECLARE RoomCursor CURSOR FOR 
SELECT id FROM Rooms;

OPEN RoomCursor;
FETCH NEXT FROM RoomCursor INTO @RoomId;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Seats WHERE room_id = @RoomId)
    BEGIN
        -- Hàng A-E: 10 ghế SINGLE mỗi hàng
        DECLARE @RowChar CHAR(1);
        DECLARE @RowIdx INT = 0;
        WHILE @RowIdx < 5
        BEGIN
            SET @RowChar = CHAR(ASCII('A') + @RowIdx);
            DECLARE @Num INT = 1;
            WHILE @Num <= 10
            BEGIN
                INSERT INTO Seats (seat_row, seat_number, type, room_id)
                VALUES (@RowChar, @Num, 'SINGLE', @RoomId);
                SET @Num = @Num + 1;
            END
            SET @RowIdx = @RowIdx + 1;
        END

        -- Hàng F-H: 10 ghế VIP mỗi hàng
        SET @RowIdx = 0;
        WHILE @RowIdx < 3
        BEGIN
            SET @RowChar = CHAR(ASCII('F') + @RowIdx);
            DECLARE @NumVip INT = 1;
            WHILE @NumVip <= 10
            BEGIN
                INSERT INTO Seats (seat_row, seat_number, type, room_id)
                VALUES (@RowChar, @NumVip, 'VIP', @RoomId);
                SET @NumVip = @NumVip + 1;
            END
            SET @RowIdx = @RowIdx + 1;
        END

        -- Hàng J: 5 ghế SWEETBOX_DOUBLE
        DECLARE @NumDb INT = 1;
        WHILE @NumDb <= 5
        BEGIN
            INSERT INTO Seats (seat_row, seat_number, type, room_id)
            VALUES ('J', @NumDb, 'SWEETBOX_DOUBLE', @RoomId);
            SET @NumDb = @NumDb + 1;
        END
    END

    FETCH NEXT FROM RoomCursor INTO @RoomId;
END;

CLOSE RoomCursor;
DEALLOCATE RoomCursor;
GO

-- Thêm Phim mẫu (Movies) kèm định dạng
IF NOT EXISTS (SELECT 1 FROM Movies WHERE title = N'Oppenheimer')
    INSERT INTO Movies (title, description, duration, release_date, end_date, poster_url, trailer_url, age_rating, status, format)
    VALUES (N'Oppenheimer', N'Câu chuyện về cha đẻ bom nguyên tử J. Robert Oppenheimer.', 180, '2026-01-01', '2026-12-31', '/uploads/movies/oppenheimer.jpg', 'https://www.youtube.com/watch?v=uYPbbksJxIg', 'T16', 'NOW_SHOWING', 'IMAX');

IF NOT EXISTS (SELECT 1 FROM Movies WHERE title = N'Dune: Phần Hai')
    INSERT INTO Movies (title, description, duration, release_date, end_date, poster_url, trailer_url, age_rating, status, format)
    VALUES (N'Dune: Phần Hai', N'Hành trình trả thù của Paul Atreides chống lại hoàng đế.', 166, '2026-01-01', '2026-12-31', '/uploads/movies/dune2.jpg', 'https://www.youtube.com/watch?v=Way9Dexny3w', 'T13', 'NOW_SHOWING', 'IMAX');

IF NOT EXISTS (SELECT 1 FROM Movies WHERE title = N'Poor Things')
    INSERT INTO Movies (title, description, duration, release_date, end_date, poster_url, trailer_url, age_rating, status, format)
    VALUES (N'Poor Things', N'Câu chuyện kỳ lạ về sự tiến hóa của Bella Baxter.', 141, '2026-01-01', '2026-12-31', '/uploads/movies/poor_things.jpg', 'https://www.youtube.com/watch?v=RrvnKoqqOqs', 'T18', 'NOW_SHOWING', '2D');

IF NOT EXISTS (SELECT 1 FROM Movies WHERE title = N'Kung Fu Panda 4')
    INSERT INTO Movies (title, description, duration, release_date, end_date, poster_url, trailer_url, age_rating, status, format)
    VALUES (N'Kung Fu Panda 4', N'Po được chọn trở thành Thủ lĩnh tinh thần của Thung lũng Hòa bình.', 94, '2026-07-01', '2026-08-31', '/uploads/movies/kfp4.jpg', 'https://www.youtube.com/watch?v=sfO1aKoxNfM', 'P', 'COMING_SOON', '3D');
GO

-- Lấy IDs phim phục vụ chèn Showtimes
DECLARE @Movie1Id BIGINT = (SELECT id FROM Movies WHERE title = N'Oppenheimer');
DECLARE @Movie2Id BIGINT = (SELECT id FROM Movies WHERE title = N'Dune: Phần Hai');
DECLARE @Movie3Id BIGINT = (SELECT id FROM Movies WHERE title = N'Poor Things');

DECLARE @Cinema1Id BIGINT = (SELECT id FROM Cinemas WHERE name = N'Cinema Plus - Trường Chinh');
DECLARE @Room1Id BIGINT = (SELECT id FROM Rooms WHERE name = N'Phòng 1 (IMAX)' AND cinema_id = @Cinema1Id);
DECLARE @Room2Id BIGINT = (SELECT id FROM Rooms WHERE name = N'Phòng 2 (4DX)' AND cinema_id = @Cinema1Id);
DECLARE @Room5Id BIGINT = (SELECT id FROM Rooms WHERE name = N'Phòng 5' AND cinema_id = @Cinema1Id);

-- Thêm các Suất chiếu mẫu (Showtimes) trùng khớp ID cứng trên UI
IF EXISTS (SELECT 1 FROM Showtimes WHERE id IN (101, 102, 103))
BEGIN
    DELETE FROM Tickets WHERE booking_id IN (SELECT id FROM Bookings WHERE showtime_id IN (101, 102, 103));
    DELETE FROM Bookings WHERE showtime_id IN (101, 102, 103);
    DELETE FROM Showtimes WHERE id IN (101, 102, 103);
END

SET IDENTITY_INSERT Showtimes ON;
INSERT INTO Showtimes (id, movie_id, room_id, start_time, end_time, base_price)
VALUES (101, @Movie2Id, @Room2Id, DATEADD(hour, 2, GETDATE()), DATEADD(minute, 166+15, DATEADD(hour, 2, GETDATE())), 120000.00);

INSERT INTO Showtimes (id, movie_id, room_id, start_time, end_time, base_price)
VALUES (102, @Movie3Id, @Room5Id, DATEADD(hour, 4, GETDATE()), DATEADD(minute, 141+15, DATEADD(hour, 4, GETDATE())), 90000.00);

INSERT INTO Showtimes (id, movie_id, room_id, start_time, end_time, base_price)
VALUES (103, @Movie1Id, @Room1Id, DATEADD(hour, 6, GETDATE()), DATEADD(minute, 180+15, DATEADD(hour, 6, GETDATE())), 150000.00);
SET IDENTITY_INSERT Showtimes OFF;
GO

-- Thêm Đơn đặt vé (Bookings)
DECLARE @CustomerId BIGINT = (SELECT id FROM Users WHERE username = 'customer');

IF EXISTS (SELECT 1 FROM Bookings WHERE id IN (201, 202, 203))
BEGIN
    DELETE FROM Tickets WHERE booking_id IN (201, 202, 203);
    DELETE FROM Bookings WHERE id IN (201, 202, 203);
END

SET IDENTITY_INSERT Bookings ON;
INSERT INTO Bookings (id, user_id, showtime_id, booking_time, total_amount, payment_method, payment_status)
VALUES (201, @CustomerId, 101, GETDATE(), 120000.00, 'MOMO', 'PAID');

INSERT INTO Bookings (id, user_id, showtime_id, booking_time, total_amount, payment_method, payment_status)
VALUES (202, @CustomerId, 102, GETDATE(), 90000.00, 'VNPAY', 'PAID');

INSERT INTO Bookings (id, user_id, showtime_id, booking_time, total_amount, payment_method, payment_status)
VALUES (203, @CustomerId, 103, GETDATE(), 150000.00, 'COUNTER', 'PAID');
SET IDENTITY_INSERT Bookings OFF;
GO

-- Thêm Vé mẫu phục vụ Quét QR qua Staff Terminal
DECLARE @Cinema1Id BIGINT = (SELECT id FROM Cinemas WHERE name = N'Cinema Plus - Trường Chinh');
DECLARE @Room1Id BIGINT = (SELECT id FROM Rooms WHERE name = N'Phòng 1 (IMAX)' AND cinema_id = @Cinema1Id);
DECLARE @Room2Id BIGINT = (SELECT id FROM Rooms WHERE name = N'Phòng 2 (4DX)' AND cinema_id = @Cinema1Id);
DECLARE @Room5Id BIGINT = (SELECT id FROM Rooms WHERE name = N'Phòng 5' AND cinema_id = @Cinema1Id);

DECLARE @Seat1Id BIGINT = (SELECT TOP 1 id FROM Seats WHERE room_id = @Room2Id AND type = 'SINGLE');
DECLARE @Seat2Id BIGINT = (SELECT TOP 1 id FROM Seats WHERE room_id = @Room5Id AND type = 'VIP');
DECLARE @Seat3Id BIGINT = (SELECT TOP 1 id FROM Seats WHERE room_id = @Room1Id AND type = 'SWEETBOX_DOUBLE');

DELETE FROM Tickets WHERE qr_code IN ('TICKET_101_1', 'TICKET_101_2', 'TICKET_102_1', 'TICKET_103_1');

INSERT INTO Tickets (booking_id, seat_id, price, qr_code, is_checked_in, checked_in_at, qr_code_string, showtime_id, status, scanned_at)
VALUES (201, @Seat1Id, 120000.00, 'TICKET_101_1', 0, NULL, 'TICKET_101_1', 101, 'VALID', NULL);

INSERT INTO Tickets (booking_id, seat_id, price, qr_code, is_checked_in, checked_in_at, qr_code_string, showtime_id, status, scanned_at)
VALUES (201, @Seat1Id + 1, 120000.00, 'TICKET_101_2', 1, DATEADD(minute, -10, GETDATE()), 'TICKET_101_2', 101, 'USED', DATEADD(minute, -10, GETDATE()));

INSERT INTO Tickets (booking_id, seat_id, price, qr_code, is_checked_in, checked_in_at, qr_code_string, showtime_id, status, scanned_at)
VALUES (202, @Seat2Id, 90000.00, 'TICKET_102_1', 0, NULL, 'TICKET_102_1', 102, 'VALID', NULL);

INSERT INTO Tickets (booking_id, seat_id, price, qr_code, is_checked_in, checked_in_at, qr_code_string, showtime_id, status, scanned_at)
VALUES (203, @Seat3Id, 150000.00, 'TICKET_103_1', 0, NULL, 'TICKET_103_1', 103, 'VALID', NULL);
GO
CREATE TABLE SeatLocks(
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    showtime_id BIGINT NOT NULL,
    seat_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    locked_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL
);