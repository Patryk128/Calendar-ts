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
  const [error, setError] = useState<string | null>(null); // Przechowywanie błędu

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setIsModalOpen(true); // Otwórz modal po kliknięciu slotu
    setError(null); // Resetuj błędy przy otwieraniu nowego modala
  };

  const handleSaveEvent = () => {
    if (!title.trim()) {
      setError("Title is required."); // Ustawienie błędu, jeśli tytuł jest pusty
      return;
    }

    if (selectedSlot && startDate && endDate && startDate <= endDate) {
      const newEvent = {
        title,
        start: startDate,
        end: endDate,
      };
      setEvents([...events, newEvent]);

      // Resetowanie stanu po zapisaniu wydarzenia
      setStartDate(new Date());
      setEndDate(new Date());
      setTitle("");
      setError(null); // Reset błędu po poprawnym dodaniu
      setIsModalOpen(false); // Zamknij modal po zapisaniu wydarzenia
    }
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
              {error && <p style={{ color: "red" }}>{error}</p>}{" "}
              {/* Wyświetlanie błędu */}
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
                onChange={(date: Date | null) => {
                  if (date && startDate && date >= startDate) {
                    setEndDate(date);
                    setError(null); // Reset błędu, jeśli wszystko jest poprawne
                  } else {
                    setError("End date must be after start date."); // Ustawienie błędu, jeśli data zakończenia jest wcześniejsza niż data rozpoczęcia
                  }
                }}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Select end date"
              />
            </div>

            {/* Przyciski do zapisania lub anulowania */}
            <button
              onClick={handleSaveEvent}
              disabled={!title || (endDate && startDate && endDate < startDate)}
            >
              Save Event
            </button>
            <button onClick={() => setIsModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
