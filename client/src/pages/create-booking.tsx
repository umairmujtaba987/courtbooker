import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, startOfToday, addDays } from "date-fns";
import { useLocation } from "wouter";
import {
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  Minus,
  Plus,
  Phone,
  User,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { CricketIcon, FootballIcon } from "@/components/icons";
import type { Court, Sport, TimeSlot } from "@shared/schema";

const bookingFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[0-9\-\+ ]{7,20}$/, "Please enter a valid phone number"),
  sportId: z.string().min(1, "Please select a sport"),
  courtId: z.string().min(1, "Please select a court"),
  date: z.date({ required_error: "Please select a date" }),
  startTime: z.string().min(1, "Please select a time slot"),
  hours: z.number().min(1, "Minimum 1 hour").max(8, "Maximum 8 hours"),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface AvailabilityData {
  courts: Court[];
  sports: Sport[];
  slots: Record<string, TimeSlot[]>;
}

export default function CreateBooking() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ uuid: string; amount: number } | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      sportId: "",
      courtId: "",
      startTime: "",
      hours: 1,
    },
  });

  const selectedDate = form.watch("date");
  const selectedCourtId = form.watch("courtId");
  const selectedSportId = form.watch("sportId");
  const selectedStartTime = form.watch("startTime");
  const hours = form.watch("hours");

  const dateString = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  // Fetch courts and sports upfront
  const { data: courtsData } = useQuery<Court[]>({
    queryKey: ["/api/courts"],
  });

  const { data: sportsData } = useQuery<Sport[]>({
    queryKey: ["/api/sports"],
  });

  // Fetch availability slots based on date and court
  const { data: availabilityData, isLoading: isLoadingAvailability } = useQuery<AvailabilityData>({
    queryKey: [`/api/availability?date=${dateString}`],
    enabled: !!dateString,
  });

  const courts = courtsData || availabilityData?.courts || [];
  const sports = sportsData || availabilityData?.sports || [];
  const slots = availabilityData?.slots || {};

  useEffect(() => {
    if (sports.length > 0 && !selectedSportId) {
      form.setValue("sportId", sports[0].id);
    }
    if (courts.length > 0 && !selectedCourtId) {
      form.setValue("courtId", courts[0].id);
    }
  }, [sports, courts, selectedSportId, selectedCourtId, form]);

  const selectedSport = useMemo(() => {
    return sports.find((s) => s.id === selectedSportId);
  }, [selectedSportId, sports]);

  const availableSlots = useMemo(() => {
    if (!selectedCourtId || !slots[selectedCourtId]) return [];
    return slots[selectedCourtId].filter((slot) => slot.available);
  }, [selectedCourtId, slots]);

  const calculatedAmount = useMemo(() => {
    if (!selectedSport) return 0;
    return selectedSport.pricePerHour * hours;
  }, [selectedSport, hours]);

  const mutation = useMutation({
    mutationFn: async (values: BookingFormValues) => {
      const response = await apiRequest("POST", "/api/bookings", {
        ...values,
        date: format(values.date, "yyyy-MM-dd"),
        amount: calculatedAmount,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setBookingResult({ uuid: data.uuid, amount: data.amount });
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "That slot may already be taken. Please pick another time or court.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: BookingFormValues) => {
    mutation.mutate(values);
  };

  const adjustHours = (delta: number) => {
    const currentHours = form.getValues("hours");
    const newHours = Math.max(1, Math.min(8, currentHours + delta));
    form.setValue("hours", newHours);
  };

  if (showSuccess && bookingResult) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardContent className="pt-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
              <p className="text-muted-foreground mb-6">
                Your court has been successfully booked.
              </p>
              <div className="bg-muted rounded-lg p-4 w-full mb-6">
                <p className="text-sm text-muted-foreground mb-1">Booking ID</p>
                <p className="font-mono font-semibold" data-testid="text-booking-id">
                  {bookingResult.uuid}
                </p>
                <p className="text-sm text-muted-foreground mt-3 mb-1">Amount</p>
                <p className="text-2xl font-bold text-primary" data-testid="text-booking-amount">
                  PKR {bookingResult.amount.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  asChild
                  data-testid="button-view-bookings"
                >
                  <Link href="/bookings">View All Bookings</Link>
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    form.reset();
                    setShowSuccess(false);
                    setBookingResult(null);
                  }}
                  data-testid="button-create-another"
                >
                  Create Another
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <Button variant="ghost" className="mb-4" asChild data-testid="button-back">
          <Link href="/bookings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Create New Booking</h1>
        <p className="text-muted-foreground">
          Fill in the details to create a new court booking
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
              <CardDescription>Enter the customer's contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Enter customer name"
                            className="pl-10"
                            {...field}
                            data-testid="input-name"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="+92 300 1234567"
                            className="pl-10"
                            {...field}
                            data-testid="input-phone"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
              <CardDescription>Select the court, sport, date and time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="sportId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Sport</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        {sports.map((s) => (
                          <Label
                            key={s.id}
                            htmlFor={`sport-${s.id}`}
                            className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              field.value === s.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <RadioGroupItem value={s.id} id={`sport-${s.id}`} className="sr-only" />
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              s.name === "Cricket" ? "bg-primary/10" : "bg-chart-2/10"
                            }`}>
                              {s.name === "Cricket" ? (
                                <CricketIcon className="h-5 w-5 text-primary" />
                              ) : (
                                <FootballIcon className="h-5 w-5 text-chart-2" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{s.name}</p>
                              <p className="text-sm text-muted-foreground">
                                PKR {s.pricePerHour.toLocaleString()}/hr
                              </p>
                            </div>
                          </Label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="courtId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Court</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        {courts.map((court) => (
                          <Label
                            key={court.id}
                            htmlFor={`court-${court.id}`}
                            className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              field.value === court.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <RadioGroupItem value={court.id} id={`court-${court.id}`} className="sr-only" />
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <span className="text-lg font-bold">{court.name.slice(-1)}</span>
                            </div>
                            <p className="font-medium">{court.name}</p>
                          </Label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-date-picker"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < startOfToday()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedDate || isLoadingAvailability}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-time">
                            <SelectValue placeholder={isLoadingAvailability ? "Loading..." : "Select time"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableSlots.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No available slots
                            </SelectItem>
                          ) : (
                            availableSlots.map((slot) => (
                              <SelectItem key={slot.time} value={slot.time}>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {slot.displayTime}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Hours</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => adjustHours(-1)}
                          disabled={field.value <= 1}
                          data-testid="button-decrease-hours"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2 min-w-[80px] justify-center">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xl font-semibold" data-testid="text-hours">
                            {field.value}
                          </span>
                          <span className="text-muted-foreground">hour{field.value > 1 ? "s" : ""}</span>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => adjustHours(1)}
                          disabled={field.value >= 8}
                          data-testid="button-increase-hours"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-3xl font-bold text-primary" data-testid="text-calculated-amount">
                    PKR {calculatedAmount.toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {selectedSport && (
                    <>
                      <p>{selectedSport.name}</p>
                      <p>{hours} hour{hours > 1 ? "s" : ""} x PKR {selectedSport.pricePerHour.toLocaleString()}</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              asChild
              data-testid="button-cancel"
            >
              <Link href="/bookings">Cancel</Link>
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={mutation.isPending}
              data-testid="button-create-booking"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Booking"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
