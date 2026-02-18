import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, MapPin, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SeatMap from "./SeatMap";

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

const getShowtimeStatus = (available: number, total: number) => {
  if (available === 0) return "sold-out" as const;
  if (available / total < 0.15) return "almost-full" as const;
  return "available" as const;
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

// Steps: "theaters" → "seats"
type BookingStep = "theaters" | "seats";

const BookingModal = ({ movieId, movieTitle, isOpen, onClose }: BookingModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedShowtime, setSelectedShowtime] = useState<string | null>(null);
  const [ticketCount, setTicketCount] = useState(2);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [step, setStep] = useState<BookingStep>("theaters");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && movieId) {
      fetchShowtimes();
      setSelectedShowtime(null);
      setTicketCount(2);
      setSelectedSeatIds([]);
      setTotalPrice(0);
      setStep("theaters");
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
      theater = { id: st.theaters.id, name: st.theaters.name, city: st.theaters.city, total_seats: st.theaters.total_seats, showtimes: [] };
      acc.push(theater);
    }
    theater.showtimes.push({ id: st.id, show_date: st.show_date, show_time: st.show_time, available_seats: st.available_seats });
    return acc;
  }, []);

  const selectedShow = showtimes.find((s) => s.id === selectedShowtime);

  const handleShowtimeSelect = (id: string) => {
    setSelectedShowtime(id);
    setSelectedSeatIds([]);
    setTotalPrice(0);
    setTicketCount(2);
  };

  const handleProceedToSeats = () => {
    if (!selectedShowtime) {
      toast.error("Please select a showtime");
      return;
    }
    setStep("seats");
  };

  const handleSeatSelectionChange = (seats: string[], price: number) => {
    setSelectedSeatIds(seats);
    setTotalPrice(price);
  };

  const handleProceedToPayment = () => {
    if (!user) {
      toast.error("Please sign in to book tickets");
      onClose();
      navigate("/auth");
      return;
    }
    if (selectedSeatIds.length === 0 || selectedSeatIds.length !== ticketCount) {
      toast.error(`Please select exactly ${ticketCount} seat(s)`);
      return;
    }

    onClose();
    navigate("/payment", {
      state: {
        movieId,
        movieTitle,
        showtimeId: selectedShowtime,
        theaterName: selectedShow?.theaters?.name || "",
        theaterCity: selectedShow?.theaters?.city || "",
        showDate: selectedShow?.show_date || "",
        showTime: selectedShow?.show_time?.slice(0, 5) || "",
        seatIds: selectedSeatIds,
        totalPrice,
        posterUrl: null,
      },
    });
  };

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
            <div className="flex items-center gap-3">
              {step === "seats" && (
                <button onClick={() => setStep("theaters")} className="text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft size={20} />
                </button>
              )}
              <div>
                <h2 className="font-display text-xl md:text-2xl text-foreground">
                  {step === "theaters" && <>Theaters Showing <span className="text-primary">{movieTitle}</span></>}
                  {step === "seats" && <>Select Your Seats</>}
                </h2>
                {step === "theaters" && <p className="text-muted-foreground text-sm mt-0.5">Select a showtime to continue</p>}
                {step === "seats" && selectedShow?.theaters && (
                  <p className="text-muted-foreground text-sm mt-0.5">
                    {selectedShow.theaters.name} • {selectedShow.show_time.slice(0, 5)}
                  </p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={24} />
            </button>
          </div>


          {/* Step: Theater selection */}
          {step === "theaters" && (
            <>
              {/* Legend */}
              <div className="flex items-center gap-4 mb-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Almost Full</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-muted/50" /> Sold Out</span>
              </div>

              {loading ? (
                <div className="text-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" /></div>
              ) : groupedTheaters.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No showtimes available for this movie</p>
              ) : (
                <div className="space-y-4 mb-6">
                  {groupedTheaters.map((theater) => (
                    <motion.div key={theater.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-border rounded-xl p-4 bg-secondary/30">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-foreground font-semibold text-base">{theater.name}</h3>
                          <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5"><MapPin size={12} /> {theater.city}</p>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">2D</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {theater.showtimes.map((st) => (
                          <ShowtimePill
                            key={st.id}
                            time={st.show_time.slice(0, 5)}
                            status={getShowtimeStatus(st.available_seats, theater.total_seats)}
                            selected={selectedShowtime === st.id}
                            onClick={() => handleShowtimeSelect(st.id)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Ticket count + proceed */}
              {selectedShowtime && selectedShow && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border-t border-border pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-foreground font-medium">How many tickets?</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                        className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors text-lg font-bold"
                      >
                        −
                      </button>
                      <span className="text-foreground font-bold text-xl w-8 text-center">{ticketCount}</span>
                      <button
                        onClick={() => setTicketCount(Math.min(selectedShow.available_seats, Math.min(10, ticketCount + 1)))}
                        className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button onClick={handleProceedToSeats} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-colors text-base">
                    Select Seats →
                  </button>
                </motion.div>
              )}
            </>
          )}

          {/* Step: Seat selection */}
          {step === "seats" && selectedShow && (
            <>
              <SeatMap
                totalSeats={selectedShow.theaters?.total_seats || 100}
                availableSeats={selectedShow.available_seats}
                maxSelect={ticketCount}
                showtimeId={selectedShow.id}
                onSelectionChange={handleSeatSelectionChange}
              />

              {/* Booking bar */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border-t border-border pt-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-muted-foreground text-xs">Total Amount</p>
                    <p className="text-foreground font-display text-2xl md:text-3xl">₹{totalPrice.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">Seats</p>
                    <p className="text-foreground text-sm font-medium">{selectedSeatIds.length > 0 ? selectedSeatIds.join(", ") : "None"}</p>
                  </div>
                </div>
                <button
                  onClick={handleProceedToPayment}
                  disabled={selectedSeatIds.length !== ticketCount}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-colors text-base disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {selectedSeatIds.length !== ticketCount
                    ? `Select ${ticketCount - selectedSeatIds.length} more seat(s)`
                    : `Proceed to Payment →`}
                </button>
              </motion.div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingModal;
