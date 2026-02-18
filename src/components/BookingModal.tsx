import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Check, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type Showtime = {
  id: string;
  show_date: string;
  show_time: string;
  available_seats: number;
  theaters: { id: string; name: string; city: string; total_seats: number } | null;
};

type GroupedTheater = {
  id: string;
  name: string;
  city: string;
  total_seats: number;
  showtimes: {
    id: string;
    show_date: string;
    show_time: string;
    available_seats: number;
  }[];
};

type BookingModalProps = {
  movieId: string;
  movieTitle: string;
  isOpen: boolean;
  onClose: () => void;
};

const TICKET_PRICE = 250;

const getShowtimeStatus = (available: number, total: number) => {
  if (available === 0) return "sold-out";
  if (available / total < 0.15) return "almost-full";
  return "available";
};

const ShowtimePill = ({
  time,
  status,
  selected,
  onClick,
}: {
  time: string;
  status: "available" | "almost-full" | "sold-out";
  selected: boolean;
  onClick: () => void;
}) => {
  const base = "px-4 py-2 rounded-full text-sm font-semibold transition-all border-2 ";
  const styles = {
    available: selected
      ? "bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30"
      : "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50 cursor-pointer",
    "almost-full": selected
      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30"
      : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 hover:border-primary/50 cursor-pointer",
    "sold-out": "bg-muted/30 text-muted-foreground/40 border-muted/20 cursor-not-allowed line-through",
  };

  return (
    <button
      onClick={status !== "sold-out" ? onClick : undefined}
      disabled={status === "sold-out"}
      className={base + styles[status]}
    >
      {time}
    </button>
  );
};

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
      setSelectedShowtime(null);
      setSeats(1);
      setBookingState("idle");
    }
  }, [isOpen, movieId]);

  const fetchShowtimes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("showtimes")
      .select("id, show_date, show_time, available_seats, theaters(id, name, city, total_seats)")
      .eq("movie_id", movieId)
      .order("show_date")
      .order("show_time");

    if (!error && data) {
      setShowtimes(data as unknown as Showtime[]);
    }
    setLoading(false);
  };

  const groupedTheaters: GroupedTheater[] = showtimes.reduce<GroupedTheater[]>((acc, st) => {
    if (!st.theaters) return acc;
    let theater = acc.find((t) => t.id === st.theaters!.id);
    if (!theater) {
      theater = {
        id: st.theaters.id,
        name: st.theaters.name,
        city: st.theaters.city,
        total_seats: st.theaters.total_seats,
        showtimes: [],
      };
      acc.push(theater);
    }
    theater.showtimes.push({
      id: st.id,
      show_date: st.show_date,
      show_time: st.show_time,
      available_seats: st.available_seats,
    });
    return acc;
  }, []);

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
      const { error: seatError } = await supabase.rpc("decrement_seats", {
        p_showtime_id: selectedShowtime,
        p_seats: seats,
      });
      if (seatError) throw seatError;

      const { error: bookingError } = await supabase.from("bookings").insert({
        user_id: user.id,
        movie_id: movieId,
        showtime_id: selectedShowtime,
        seats_selected: seats,
        total_amount: seats * TICKET_PRICE,
        payment_status: "Pending",
      });
      if (bookingError) throw bookingError;

      const delay = 3000 + Math.random() * 2000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      const { data: bookings } = await supabase
        .from("bookings")
        .select("id")
        .eq("user_id", user.id)
        .eq("showtime_id", selectedShowtime)
        .eq("payment_status", "Pending")
        .order("created_at", { ascending: false })
        .limit(1);

      if (bookings && bookings.length > 0) {
        await supabase.from("bookings").update({ payment_status: "Paid" }).eq("id", bookings[0].id);
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
          className="w-full max-w-2xl bg-card border border-border rounded-t-2xl md:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl md:text-3xl text-foreground">
                Theaters Showing <span className="text-primary">{movieTitle}</span>
              </h2>
              <p className="text-muted-foreground text-sm mt-1">Select a showtime to continue</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={24} />
            </button>
          </div>

          {bookingState === "processing" ? (
            <div className="text-center py-16">
              <Loader2 className="w-14 h-14 text-primary animate-spin mx-auto mb-4" />
              <p className="text-foreground font-semibold text-lg">Processing Payment...</p>
              <p className="text-muted-foreground text-sm mt-1">Please wait while we confirm your booking</p>
            </div>
          ) : bookingState === "success" ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-16"
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
              {/* Legend */}
              <div className="flex items-center gap-4 mb-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Almost Full
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-muted/50" /> Sold Out
                </span>
              </div>

              {/* Theater list */}
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                </div>
              ) : groupedTheaters.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No showtimes available for this movie</p>
              ) : (
                <div className="space-y-4 mb-6">
                  {groupedTheaters.map((theater) => (
                    <motion.div
                      key={theater.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-border rounded-xl p-4 bg-secondary/30"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-foreground font-semibold text-base">{theater.name}</h3>
                          <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                            <MapPin size={12} /> {theater.city}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                          2D
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {theater.showtimes.map((st) => {
                          const status = getShowtimeStatus(st.available_seats, theater.total_seats);
                          return (
                            <ShowtimePill
                              key={st.id}
                              time={st.show_time.slice(0, 5)}
                              status={status}
                              selected={selectedShowtime === st.id}
                              onClick={() => {
                                setSelectedShowtime(st.id);
                                setSeats(1);
                              }}
                            />
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Seat selector */}
              {selectedShowtime && selectedShow && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t border-border pt-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-foreground font-medium">Number of Seats</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSeats(Math.max(1, seats - 1))}
                        className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-foreground font-bold text-xl w-8 text-center">{seats}</span>
                      <button
                        onClick={() => setSeats(Math.min(selectedShow.available_seats, seats + 1))}
                        className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-muted-foreground text-sm">Total Amount</p>
                    <p className="text-foreground font-display text-3xl">₹{(seats * TICKET_PRICE).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={handleBook}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-colors text-base"
                  >
                    Pay & Book Now
                  </button>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingModal;
