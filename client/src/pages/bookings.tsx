import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Link } from "wouter";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  Calendar,
  Phone,
  User,
  Clock,
  PlusCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CricketIcon, FootballIcon } from "@/components/icons";
import type { Booking, Court, Sport } from "@shared/schema";

interface BookingsData {
  bookings: Booking[];
  courts: Court[];
  sports: Sport[];
}

const ITEMS_PER_PAGE = 10;

export default function Bookings() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courtFilter, setCourtFilter] = useState<string>("all");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<BookingsData>({
    queryKey: ["/api/bookings"],
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiRequest("POST", `/api/bookings/${bookingId}/cancel`);
    },
    onSuccess: () => {
      toast({
        title: "Booking Cancelled",
        description: "The booking has been successfully cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setCancelBookingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking",
        variant: "destructive",
      });
    },
  });

  const bookings = data?.bookings || [];
  const courts = data?.courts || [];
  const sports = data?.sports || [];

  const getCourtName = (courtId: string) => {
    return courts.find((c) => c.id === courtId)?.name || courtId;
  };

  const getSportName = (sportId: string) => {
    return sports.find((s) => s.id === sportId)?.name || sportId;
  };

  const getSportIcon = (sportId: string) => {
    const sport = sports.find((s) => s.id === sportId);
    if (sport?.name === "Cricket") return <CricketIcon className="h-4 w-4" />;
    return <FootballIcon className="h-4 w-4" />;
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch =
        booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.phone.includes(searchTerm) ||
        booking.uuid.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      const matchesCourt = courtFilter === "all" || booking.courtId === courtFilter;
      const matchesSport = sportFilter === "all" || booking.sportId === sportFilter;
      return matchesSearch && matchesStatus && matchesCourt && matchesSport;
    });
  }, [bookings, searchTerm, statusFilter, courtFilter, sportFilter]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "booked":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Booked</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      case "completed":
        return <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCourtFilter("all");
    setSportFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm || statusFilter !== "all" || courtFilter !== "all" || sportFilter !== "all";

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">All Bookings</h1>
          <p className="text-muted-foreground">
            Manage and view all court bookings
          </p>
        </div>
        <Button asChild data-testid="button-create-booking">
          <Link href="/bookings/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Booking
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or booking ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[130px]" data-testid="select-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={courtFilter}
                onValueChange={(value) => {
                  setCourtFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[130px]" data-testid="select-court">
                  <SelectValue placeholder="Court" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courts</SelectItem>
                  {courts.map((court) => (
                    <SelectItem key={court.id} value={court.id}>
                      {court.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sportFilter}
                onValueChange={(value) => {
                  setSportFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[130px]" data-testid="select-sport">
                  <SelectValue placeholder="Sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {sports.map((sport) => (
                    <SelectItem key={sport.id} value={sport.id}>
                      {sport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFilters}
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : paginatedBookings.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No bookings found</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Create your first booking to get started"}
              </p>
              {!hasActiveFilters && (
                <Button asChild>
                  <Link href="/bookings/create">Create Booking</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium text-muted-foreground">
                        Booking
                      </th>
                      <th className="text-left p-4 font-medium text-muted-foreground">
                        Customer
                      </th>
                      <th className="text-left p-4 font-medium text-muted-foreground">
                        Date & Time
                      </th>
                      <th className="text-left p-4 font-medium text-muted-foreground">
                        Court / Sport
                      </th>
                      <th className="text-left p-4 font-medium text-muted-foreground">
                        Amount
                      </th>
                      <th className="text-left p-4 font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-right p-4 font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b last:border-0 hover-elevate"
                        data-testid={`row-booking-${booking.id}`}
                      >
                        <td className="p-4">
                          <p className="font-mono text-sm" data-testid={`text-uuid-${booking.id}`}>
                            {booking.uuid.slice(0, 8)}...
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{booking.name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {booking.phone}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p>{format(parseISO(booking.date), "MMM d, yyyy")}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {booking.startTime.slice(0, 5)} ({booking.hours}h)
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getSportIcon(booking.sportId)}
                            <div>
                              <p>{getCourtName(booking.courtId)}</p>
                              <p className="text-sm text-muted-foreground">
                                {getSportName(booking.sportId)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold">
                            PKR {booking.amount.toLocaleString()}
                          </p>
                        </td>
                        <td className="p-4">{getStatusBadge(booking.status)}</td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                data-testid={`button-actions-${booking.id}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {booking.status === "booked" && (
                                <DropdownMenuItem
                                  onClick={() => setCancelBookingId(booking.id)}
                                  className="text-destructive"
                                  data-testid={`button-cancel-${booking.id}`}
                                >
                                  Cancel Booking
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)} of{" "}
                    {filteredBookings.length} bookings
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!cancelBookingId} onOpenChange={() => setCancelBookingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-dialog-cancel">
              No, keep it
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelBookingId && cancelMutation.mutate(cancelBookingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-cancel"
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, cancel booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
