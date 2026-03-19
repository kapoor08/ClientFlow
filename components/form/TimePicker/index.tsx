"use client";

import { format } from "date-fns";
import { Clock } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "hh:mm aa",
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const handleTimeChange = (
    type: "hour" | "minute" | "ampm",
    timeValue: string,
  ) => {
    const newDate = value ? new Date(value) : new Date();

    if (type === "hour") {
      const hour = parseInt(timeValue);
      const isPM = newDate.getHours() >= 12;
      newDate.setHours((hour % 12) + (isPM ? 12 : 0));
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(timeValue));
    } else if (type === "ampm") {
      const currentHours = newDate.getHours();
      if (timeValue === "PM" && currentHours < 12) {
        newDate.setHours(currentHours + 12);
      } else if (timeValue === "AM" && currentHours >= 12) {
        newDate.setHours(currentHours - 12);
      }
    }

    onChange(newDate);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? format(value, "hh:mm aa") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex h-[300px] divide-x">
          {/* Hours */}
          <ScrollArea className="w-auto">
            <div className="flex flex-col p-2">
              {hours.map((hour) => (
                <Button
                  key={hour}
                  size="icon"
                  variant={
                    value && (value.getHours() % 12 || 12) === hour
                      ? "default"
                      : "ghost"
                  }
                  className="w-full shrink-0 aspect-square"
                  onClick={() => handleTimeChange("hour", hour.toString())}
                >
                  {hour}
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* Minutes */}
          <ScrollArea className="w-auto">
            <div className="flex flex-col p-2">
              {minutes.map((minute) => (
                <Button
                  key={minute}
                  size="icon"
                  variant={
                    value && value.getMinutes() === minute ? "default" : "ghost"
                  }
                  className="w-full shrink-0 aspect-square"
                  onClick={() => handleTimeChange("minute", minute.toString())}
                >
                  {minute.toString().padStart(2, "0")}
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* AM/PM */}
          <ScrollArea className="">
            <div className="flex flex-col p-2">
              {["AM", "PM"].map((ampm) => (
                <Button
                  key={ampm}
                  size="icon"
                  variant={
                    value &&
                    ((ampm === "AM" && value.getHours() < 12) ||
                      (ampm === "PM" && value.getHours() >= 12))
                      ? "default"
                      : "ghost"
                  }
                  className="w-full shrink-0 aspect-square"
                  onClick={() => handleTimeChange("ampm", ampm)}
                >
                  {ampm}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
