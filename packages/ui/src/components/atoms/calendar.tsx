import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker"

import { cn } from "@ui/lib/utils/cn"
import { Button, buttonVariants } from "@ui/components/atoms/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-bg-surface group/calendar p-space-3 rounded-card border border-border-subtle",
        "[--cell-size:var(--spacing-space-8)]",
        "in-data-[slot=card-content]:bg-transparent in-data-[slot=card-content]:border-0 in-data-[slot=card-content]:p-0",
        "in-data-[slot=popover-content]:bg-transparent in-data-[slot=popover-content]:border-0 in-data-[slot=popover-content]:p-0",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-space-4 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full gap-space-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-space-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none rounded-button",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none rounded-button",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-body-sm font-medium justify-center h-(--cell-size) gap-space-2",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative has-focus:border-primary border border-border-subtle has-focus:ring-primary/50 has-focus:ring-2 rounded-button duration-smooth ease-smooth",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute bg-bg-surface inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none text-body-sm font-medium text-text-primary",
          captionLayout === "label"
            ? ""
            : "rounded-button pl-space-2 pr-space-1 flex items-center gap-space-1 min-h-(--cell-size) [&>svg]:text-text-tertiary [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-text-tertiary rounded-button flex-1 font-normal text-caption select-none",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full mt-space-2", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-(--cell-size)",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-caption select-none text-text-tertiary",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative w-full h-full p-0 text-center aspect-square select-none",
          "[&:last-child[data-selected=true]_button]:rounded-r-button group/day",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-button"
            : "[&:first-child[data-selected=true]_button]:rounded-l-button",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-button bg-bg-surface-hover",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "rounded-r-button bg-bg-surface-hover",
          defaultClassNames.range_end
        ),
        today: cn(
          "bg-bg-surface-hover text-text-primary rounded-button data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-text-tertiary aria-selected:text-text-tertiary",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-text-disabled opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef as React.Ref<HTMLDivElement>}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center text-caption text-text-tertiary">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "text-body font-normal leading-none",
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-white",
        "data-[range-middle=true]:bg-bg-surface-hover data-[range-middle=true]:text-text-primary",
        "data-[range-start=true]:bg-primary data-[range-start=true]:text-white data-[range-start=true]:rounded-l-button",
        "data-[range-end=true]:bg-primary data-[range-end=true]:text-white data-[range-end=true]:rounded-r-button",
        "group-data-[focused=true]/day:border-primary group-data-[focused=true]/day:ring-primary/50 group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10",
        "hover:text-text-primary",
        "flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-space-1 rounded-button duration-smooth ease-smooth",
        "[&>span]:text-caption [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
