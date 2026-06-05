import {useEffect,useState} from "react";
import axios from "../../api/axiosClient";

export default function SeatSelectionPage(){

    const [seats,setSeats] = useState([]);

    useEffect(()=>{

        axios
        .get("/api/admin/screens/1/seats")
        .then(res=>setSeats(res.data));

    },[]);

    const lockSeat = async(id)=>{

        const res = await axios.post(
            "/api/customer/lock-seat",
            {
                showtimeId:101,
                seatId:id,
                userId:1
            }
        );

        if(res.data.success){

            alert("Giữ ghế thành công");

        }else{

            alert("Ghế đã có người giữ");
        }
    }

    return(
        <div>

            <h2>Chọn ghế</h2>

            {seats.map(seat=>(
                <button
                    key={seat.id}
                    onClick={()=>lockSeat(seat.id)}
                >
                    {seat.seatRow}
                    {seat.seatNumber}
                </button>
            ))}

        </div>
    );
}