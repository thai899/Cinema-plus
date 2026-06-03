package com.cinemaplus.services;

import com.cinemaplus.entities.Screen;
import com.cinemaplus.entities.Seat;
import com.cinemaplus.repositories.ScreenRepository;
import com.cinemaplus.repositories.SeatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class ScreenService {

    @Autowired
    private ScreenRepository screenRepository;

    @Autowired
    private SeatRepository seatRepository;

    public List<Screen> getAllScreens() {
        return screenRepository.findAll();
    }

    public Screen getScreenById(Long id) {
        return screenRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng chiếu với ID: " + id));
    }

    public Screen createScreen(Screen screen) {
        return screenRepository.save(screen);
    }

    public List<Seat> getSeatsByScreenId(Long screenId) {
        return seatRepository.findByScreenId(screenId);
    }

    /**
     * Tự động sinh danh sách ghế tương ứng với sơ đồ tiêu chuẩn.
     * - Hàng A tới E: 10 ghế SINGLE mỗi hàng.
     * - Hàng F tới H: 10 ghế VIP mỗi hàng.
     * - Hàng J: 5 ghế SWEETBOX_DOUBLE (ghế đôi).
     */
    @Transactional
    public void generateSeatMatrix(Long screenId) {
        Screen screen = getScreenById(screenId);

        // 1. Xóa toàn bộ ghế cũ của phòng chiếu để tránh trùng lặp
        seatRepository.deleteByScreenId(screenId);

        List<Seat> seats = new ArrayList<>();
        int seatCounter = 0;

        // 2. Sinh ghế SINGLE (Hàng A - E, mỗi hàng 10 ghế)
        for (char row = 'A'; row <= 'E'; row++) {
            for (int num = 1; num <= 10; num++) {
                Seat seat = new Seat();
                seat.setSeatRow(String.valueOf(row));
                seat.setSeatNumber(num);
                seat.setType("SINGLE");
                seat.setScreen(screen);
                seats.add(seat);
                seatCounter++;
            }
        }

        // 3. Sinh ghế VIP (Hàng F - H, mỗi hàng 10 ghế)
        for (char row = 'F'; row <= 'H'; row++) {
            for (int num = 1; num <= 10; num++) {
                Seat seat = new Seat();
                seat.setSeatRow(String.valueOf(row));
                seat.setSeatNumber(num);
                seat.setType("VIP");
                seat.setScreen(screen);
                seats.add(seat);
                seatCounter++;
            }
        }

        // 4. Sinh ghế SWEETBOX_DOUBLE (Hàng J, gồm 5 ghế đôi đặc biệt)
        for (int num = 1; num <= 5; num++) {
            Seat seat = new Seat();
            seat.setSeatRow("J");
            seat.setSeatNumber(num);
            seat.setType("SWEETBOX_DOUBLE");
            seat.setScreen(screen);
            seats.add(seat);
            seatCounter++;
        }

        // 5. Lưu toàn bộ xuống DB
        seatRepository.saveAll(seats);

        // 6. Cập nhật lại tổng số ghế thực tế trong Screen
        screen.setTotalSeats(seatCounter);
        screenRepository.save(screen);
    }
}
