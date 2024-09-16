import {
  Calendar as BigCalendar,
  CalendarProps,
  momentLocalizer,
} from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

export default function Calendar(props: Omit<CalendarProps, "localizer">) {
  return (
    <BigCalendar
      {...props}
      localizer={localizer}
      views={["month", "week", "day", "agenda"]} // Dodanie widoków
      defaultView="month" // Ustawienie domyślnego widoku na miesiąc
      step={15} // Ustawienia rozdzielczości czasowej
      showMultiDayTimes // Pokaż wydarzenia wielodniowe w widokach dziennym/tygodniowym
      style={{ height: "100%" }} // Ustawienia wysokości kalendarza
    />
  );
}
