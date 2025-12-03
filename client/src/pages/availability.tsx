import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, startOfToday } from "date-fns";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CricketIcon, FootballIcon } from "@/components/icons";
import { BookingModal } from "@/components/booking-modal";
import type { Court, Sport, TimeSlot } from "@shared/schema";

interface AvailabilityData {
  courts: Court[];
  sports: Sport[];
  slots: Record<string, TimeSlot[]>;
}

export default function Availability() {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [bookingModal, setBookingModal] = useState<{
    isOpen: boolean;
    courtId: string;
    courtName: string;
    slot: TimeSlot | null;
    sport: Sport | null;
    date: Date;
  }>({
    isOpen: false,
    courtId: "",
    courtName: "",
    slot: null,
    sport: null,
    date: startOfToday(),
  });

  const dateString = format(selectedDate, "yyyy-MM-dd");

  const { data, isLoading, error } = useQuery<AvailabilityData>({
    queryKey: [`/api/availability?date=${dateString}`],
  });

  const sports = data?.sports || [];
  const courts = data?.courts || [];
  const slots = data?.slots || {};

  const activeSport = useMemo(() => {
    if (selectedSport) {
      return sports.find((s) => s.id === selectedSport) || null;
    }
    return sports[0] || null;
  }, [selectedSport, sports]);

  const handleSlotClick = (courtId: string, courtName: string, slot: TimeSlot) => {
    if (!slot.available || !activeSport) return;
    setBookingModal({
      isOpen: true,
      courtId,
      courtName,
      slot,
      sport: activeSport,
      date: selectedDate,
    });
  };

  const navigateDate = (direction: "prev" | "next") => {
    if (direction === "prev") {
      const prevDate = addDays(selectedDate, -1);
      if (prevDate >= startOfToday()) {
        setSelectedDate(prevDate);
      }
    } else {
      setSelectedDate(addDays(selectedDate, 1));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Check Availability</h1>
        <p className="text-muted-foreground">
          Select a date and sport to view available time slots for both courts
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="outline"
            onClick={() => navigateDate("prev")}
            disabled={selectedDate <= startOfToday()}
            data-testid="button-prev-date"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal min-w-[200px]",
                )}
                data-testid="button-date-picker"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => date < startOfToday()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            size="icon"
            variant="outline"
            onClick={() => navigateDate("next")}
            data-testid="button-next-date"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {sports.map((sport) => (
            <Button
              key={sport.id}
              variant={activeSport?.id === sport.id ? "default" : "outline"}
              onClick={() => setSelectedSport(sport.id)}
              className="gap-2"
              data-testid={`button-sport-${sport.name.toLowerCase()}`}
            >
              {sport.name === "Cricket" ? (
                <CricketIcon className="h-4 w-4" />
              ) : (
                <FootballIcon className="h-4 w-4" />
              )}
              {sport.name}
              <Badge variant="secondary" className="ml-1">
                PKR {sport.pricePerHour.toLocaleString()}/hr
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 17 }).map((_, j) => (
                    <Skeleton key={j} className="h-16" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <p className="text-destructive">Failed to load availability. Please try again.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courts.map((court) => (
            <Card key={court.id}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span>{court.name}</span>
                  {activeSport && (
                    <Badge variant="outline" className="font-normal">
                      {activeSport.name === "Cricket" ? (
                        <CricketIcon className="h-3 w-3 mr-1" />
                      ) : (
                        <FootballIcon className="h-3 w-3 mr-1" />
                      )}
                      PKR {activeSport.pricePerHour.toLocaleString()}/hr
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {(slots[court.id] || []).map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => handleSlotClick(court.id, court.name, slot)}
                      disabled={!slot.available}
                      className={cn(
                        "p-3 rounded-lg border-2 text-center transition-all",
                        slot.available
                          ? "border-primary/30 hover:border-primary hover:bg-primary/5 cursor-pointer hover-elevate overflow-visible"
                          : "border-muted bg-muted/50 opacity-60 cursor-not-allowed"
                      )}
                      data-testid={`slot-${court.id}-${slot.time}`}
                    >
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{slot.displayTime}</span>
                      </div>
                      <Badge
                        variant={slot.available ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {slot.available ? "Available" : "Booked"}
                      </Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BookingModal
        isOpen={bookingModal.isOpen}
        onClose={() => setBookingModal((prev) => ({ ...prev, isOpen: false }))}
        courtId={bookingModal.courtId}
        courtName={bookingModal.courtName}
        slot={bookingModal.slot}
        sport={bookingModal.sport}
        date={bookingModal.date}
        sports={sports}
      />
    </div>
  );
}
