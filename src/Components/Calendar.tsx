import {
  Calendar as BigCalendar,
  CalendarProps,
  momentLocalizer,
} from "react-big-calendar";
import moment from "moment";
import "moment/locale/en-gb"; // Import locale where Monday is the first day of the week
import "react-big-calendar/lib/css/react-big-calendar.css";

// Set Monday as the first day of the week globally
moment.updateLocale("en-gb", {
  week: { dow: 1 }, // Monday is the first day of the week
});

const localizer = momentLocalizer(moment);

export default function Calendar(props: Omit<CalendarProps, "localizer">) {
  return (
    <BigCalendar
      {...props}
      localizer={localizer}
      views={["month", "week", "day", "agenda"]}
      defaultView="month"
      step={15}
      showMultiDayTimes
      style={{ height: "100%" }}
    />
  );
}
