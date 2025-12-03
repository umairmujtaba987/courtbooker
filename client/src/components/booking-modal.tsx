import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Loader2, Phone, User, Clock, Minus, Plus, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CricketIcon, FootballIcon } from "./icons";
import type { Sport, TimeSlot } from "@shared/schema";

const bookingFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[0-9\-\+ ]{7,20}$/, "Please enter a valid phone number"),
  sportId: z.string().min(1, "Please select a sport"),
  hours: z.number().min(1, "Minimum 1 hour").max(8, "Maximum 8 hours"),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  courtId: string;
  courtName: string;
  slot: TimeSlot | null;
  sport: Sport | null;
  date: Date;
  sports: Sport[];
}

export function BookingModal({
  isOpen,
  onClose,
  courtId,
  courtName,
  slot,
  sport,
  date,
  sports,
}: BookingModalProps) {
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingUuid, setBookingUuid] = useState<string>("");
  const [bookingAmount, setBookingAmount] = useState<number>(0);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      sportId: sport?.id || "",
      hours: 1,
    },
  });

  useEffect(() => {
    if (sport) {
      form.setValue("sportId", sport.id);
    }
  }, [sport, form]);

  const selectedSportId = form.watch("sportId");
  const hours = form.watch("hours");

  const selectedSport = useMemo(() => {
    return sports.find((s) => s.id === selectedSportId);
  }, [selectedSportId, sports]);

  const calculatedAmount = useMemo(() => {
    if (!selectedSport) return 0;
    return selectedSport.pricePerHour * hours;
  }, [selectedSport, hours]);

  const mutation = useMutation({
    mutationFn: async (values: BookingFormValues) => {
      const response = await apiRequest("POST", "/api/bookings", {
        ...values,
        courtId,
        date: format(date, "yyyy-MM-dd"),
        startTime: slot?.time,
        amount: calculatedAmount,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setBookingUuid(data.uuid);
      setBookingAmount(data.amount);
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

  const handleClose = () => {
    form.reset();
    setShowSuccess(false);
    setBookingUuid("");
    setBookingAmount(0);
    onClose();
  };

  const onSubmit = (values: BookingFormValues) => {
    mutation.mutate(values);
  };

  const adjustHours = (delta: number) => {
    const currentHours = form.getValues("hours");
    const newHours = Math.max(1, Math.min(8, currentHours + delta));
    form.setValue("hours", newHours);
  };

  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl mb-2">Booking Confirmed!</DialogTitle>
            <DialogDescription className="mb-4">
              Your court has been successfully booked.
            </DialogDescription>
            <div className="bg-muted rounded-lg p-4 w-full mb-6">
              <p className="text-sm text-muted-foreground mb-1">Booking ID</p>
              <p className="font-mono font-semibold" data-testid="text-booking-id">{bookingUuid}</p>
              <p className="text-sm text-muted-foreground mt-3 mb-1">Amount</p>
              <p className="text-2xl font-bold text-primary" data-testid="text-booking-amount">
                PKR {bookingAmount.toLocaleString()}
              </p>
            </div>
            <Button onClick={handleClose} className="w-full" data-testid="button-close-success">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book {courtName}</DialogTitle>
          <DialogDescription>
            {format(date, "EEEE, MMMM d, yyyy")} at {slot?.displayTime}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          placeholder="Enter your name"
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
                          htmlFor={s.id}
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            field.value === s.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <RadioGroupItem value={s.id} id={s.id} className="sr-only" />
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

            <div className="bg-muted rounded-lg p-4">
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
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                data-testid="button-cancel-booking"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={mutation.isPending}
                data-testid="button-confirm-booking"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
