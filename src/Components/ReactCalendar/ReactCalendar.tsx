import moment from "moment";
import Calendar from "../Calendar";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Modal.css"; // Stylizacja modala

const initialEvents = [
  {
    start: moment("2024-09-16T10:00:00").toDate(),
    end: moment("2024-09-16T12:00:00").toDate(),
    title: "MRI Registration",
  },
];

export default function ReactCalendar() {
  const [events, setEvents] = useState(initialEvents);
  const [startDate, setStartDate] = useState<Date | null>(new Date()); // Domyślnie dzisiejsza data
  const [endDate, setEndDate] = useState<Date | null>(new Date()); // Domyślnie dzisiejsza data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [title, setTitle] = useState(""); // Dodanie stanu do przechowywania tytułu

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setIsModalOpen(true); // Otwórz modal po kliknięciu slotu
  };

  const handleSaveEvent = () => {
    if (!title.trim()) {
      alert("Please enter a title for the event.");
      return;
    }

    if (selectedSlot) {
      const newEvent = {
        title,
        start: startDate || selectedSlot.start, // Użyj wybranej daty rozpoczęcia lub domyślnej
        end: endDate || selectedSlot.end, // Użyj wybranej daty zakończenia lub domyślnej
      };
      setEvents([...events, newEvent]);
    }

    // Resetowanie stanu po zapisaniu wydarzenia
    setStartDate(new Date()); // Ustaw ponownie na dzisiejszą datę
    setEndDate(new Date()); // Ustaw ponownie na dzisiejszą datę
    setTitle("");
    setIsModalOpen(false); // Zamknij modal po zapisaniu wydarzenia
  };

  return (
    <div>
      {/* Kalendarz */}
      <div style={{ height: "80vh" }}>
        <Calendar events={events} selectable onSelectSlot={handleSelectSlot} />
      </div>

      {/* Modal otwierany przy kliknięciu w slot kalendarza */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Event Details</h2>

            {/* Pole do wpisania tytułu wydarzenia */}
            <div style={{ marginBottom: "20px" }}>
              <label>Title: </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter event title"
                style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
              />
            </div>

            {/* Wybór daty rozpoczęcia */}
            <div style={{ marginBottom: "20px" }}>
              <label>Start Date: </label>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Select start date"
              />
            </div>

            {/* Wybór daty zakończenia */}
            <div style={{ marginBottom: "20px" }}>
              <label>End Date: </label>
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Select end date"
              />
            </div>

            {/* Przyciski do zapisania lub anulowania */}
            <button onClick={handleSaveEvent}>Save Event</button>
            <button onClick={() => setIsModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
