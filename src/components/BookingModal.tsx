import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type Showtime = {
  id: string;
  show_date: string;
  show_time: string;
  available_seats: number;
  theaters: { id: string; name: string; city: string } | null;
};

type BookingModalProps = {
  movieId: string;
  movieTitle: string;
  isOpen: boolean;
  onClose: () => void;
};

const TICKET_PRICE = 250;

const BookingModal = ({ movieId, movieTitle, isOpen, onClose }: BookingModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedShowtime, setSelectedShowtime] = useState<string | null>(null);
  const [seats, setSeats] = useState(1);
  const [bookingState, setBookingState] = useState<"idle" | "processing" | "success">("idle");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && movieId) {
      fetchShowtimes();
    }
  }, [isOpen, movieId]);

  const fetchShowtimes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("showtimes")
      .select("id, show_date, show_time, available_seats, theaters(id, name, city)")
      .eq("movie_id", movieId)
      .gt("available_seats", 0)
      .order("show_date")
      .order("show_time");

    if (!error && data) {
      setShowtimes(data as unknown as Showtime[]);
    }
    setLoading(false);
  };

  const handleBook = async () => {
    if (!user) {
      toast.error("Please sign in to book tickets");
      onClose();
      navigate("/auth");
      return;
    }
    if (!selectedShowtime) {
      toast.error("Please select a showtime");
      return;
    }

    setBookingState("processing");

    try {
      // Decrement seats atomically
      const { error: seatError } = await supabase.rpc("decrement_seats", {
        p_showtime_id: selectedShowtime,
        p_seats: seats,
      });
      if (seatError) throw seatError;

      // Create booking
      const { error: bookingError } = await supabase.from("bookings").insert({
        user_id: user.id,
        movie_id: movieId,
        showtime_id: selectedShowtime,
        seats_selected: seats,
        total_amount: seats * TICKET_PRICE,
        payment_status: "Pending",
      });
      if (bookingError) throw bookingError;

      // Simulate payment delay (3-5 seconds)
      const delay = 3000 + Math.random() * 2000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Update payment to Paid
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id")
        .eq("user_id", user.id)
        .eq("showtime_id", selectedShowtime)
        .eq("payment_status", "Pending")
        .order("created_at", { ascending: false })
        .limit(1);

      if (bookings && bookings.length > 0) {
        await supabase
          .from("bookings")
          .update({ payment_status: "Paid" })
          .eq("id", bookings[0].id);
      }

      setBookingState("success");
      toast.success(`🎬 ${seats} ticket(s) booked for ${movieTitle}!`, {
        description: "Payment confirmed. Enjoy the movie!",
        duration: 5000,
      });

      setTimeout(() => {
        setBookingState("idle");
        setSelectedShowtime(null);
        setSeats(1);
        onClose();
      }, 2000);
    } catch (err: any) {
      setBookingState("idle");
      toast.error(err.message || "Booking failed. Please try again.");
    }
  };

  const selectedShow = showtimes.find((s) => s.id === selectedShowtime);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end md:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-card border border-border rounded-t-2xl md:rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl text-foreground">{movieTitle}</h2>
              <p className="text-muted-foreground text-sm">Select showtime & seats</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={24} />
            </button>
          </div>

          {bookingState === "processing" ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-foreground font-semibold text-lg">Processing Payment...</p>
              <p className="text-muted-foreground text-sm mt-1">Please wait while we confirm your booking</p>
            </div>
          ) : bookingState === "success" ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-foreground font-semibold text-lg">Booking Confirmed! 🎉</p>
              <p className="text-muted-foreground text-sm mt-1">
                {seats} ticket(s) • ₹{(seats * TICKET_PRICE).toLocaleString()}
              </p>
            </motion.div>
          ) : (
            <>
              {/* Showtimes */}
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                </div>
              ) : showtimes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No showtimes available</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {showtimes.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setSelectedShowtime(st.id);
                        setSeats(1);
                      }}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedShowtime === st.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary/50 hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-foreground font-medium">{st.theaters?.name}</p>
                          <p className="text-muted-foreground text-xs">{st.theaters?.city}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-foreground font-semibold">{st.show_time.slice(0, 5)}</p>
                          <p className="text-xs text-muted-foreground">{st.show_date}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`text-xs font-medium ${st.available_seats < 20 ? "text-primary" : "text-green-500"}`}>
                          {st.available_seats} seats available
                        </span>
                        <span className="text-xs text-muted-foreground">₹{TICKET_PRICE}/ticket</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Seat selector */}
              {selectedShowtime && selectedShow && (
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-foreground font-medium">Number of Seats</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSeats(Math.max(1, seats - 1))}
                        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-foreground font-bold text-lg w-8 text-center">{seats}</span>
                      <button
                        onClick={() => setSeats(Math.min(selectedShow.available_seats, seats + 1))}
                        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-muted-foreground text-sm">Total Amount</p>
                    <p className="text-foreground font-display text-2xl">₹{(seats * TICKET_PRICE).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={handleBook}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-colors"
                  >
                    Pay & Book Now
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingModal;
