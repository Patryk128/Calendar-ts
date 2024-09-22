import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import React from "react";

interface ModalProps {
  isOpen: boolean;
  title: string;
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
  color: string;
  isReminder: boolean;
  reminderDays: number;
  error: string | null;
  setTitle: (value: string) => void;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  setStartTime: (time: string) => void;
  setEndTime: (time: string) => void;
  setColor: (color: string) => void;
  setIsReminder: (value: boolean) => void;
  setReminderDays: (days: number) => void;
  handleSave: () => void;
  resetForm: () => void;
  editEventId: string | null;
  handleDeleteEvent: () => void;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  startDate,
  endDate,
  startTime,
  endTime,
  color,
  isReminder,
  reminderDays,
  error,
  setTitle,
  setStartDate,
  setEndDate,
  setStartTime,
  setEndTime,
  setColor,
  setIsReminder,
  setReminderDays,
  handleSave,
  resetForm,
  editEventId,
  handleDeleteEvent,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal" onClick={resetForm}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{editEventId ? "Edit Event" : "Add New Event"}</h3>
        <label>Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}

        <label>Start Date:</label>
        <DatePicker
          selected={startDate || new Date()}
          onChange={(date) => setStartDate(date)}
          dateFormat="yyyy/MM/dd"
          placeholderText="Select start date"
        />
        <label>Start Time (24h format):</label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />

        <label>End Date:</label>
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          dateFormat="yyyy/MM/dd"
          placeholderText="Select end date"
        />
        <label>End Time (24h format):</label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />

        <label>Color:</label>
        <div className="color-picker">
          {[
            "#FF0000",
            "#00FF00",
            "#0000FF",
            "#FFFF00",
            "#FF00FF",
            "#00FFFF",
            "#FFA500",
            "#800080",
          ].map((c) => (
            <button
              key={c}
              style={{
                backgroundColor: c,
                width: "30px",
                height: "30px",
                border: c === color ? "3px solid black" : "none",
                cursor: "pointer",
                margin: "0 5px",
              }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={isReminder}
              onChange={() => setIsReminder(!isReminder)}
            />
            Set Reminder
          </label>
          {isReminder && (
            <div>
              <label>Reminder Days Before:</label>
              <input
                type="number"
                value={reminderDays}
                onChange={(e) => setReminderDays(parseInt(e.target.value))}
                min={1}
                max={30}
              />
            </div>
          )}
        </div>

        <div className="modal-buttons">
          <button onClick={handleSave}>
            {editEventId ? "Update" : "Save"}
          </button>
          {editEventId && (
            <button
              onClick={handleDeleteEvent}
              style={{ backgroundColor: "red", color: "white" }}
            >
              Delete
            </button>
          )}
          <button onClick={resetForm}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
