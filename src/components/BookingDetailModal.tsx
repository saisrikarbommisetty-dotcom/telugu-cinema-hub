import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Calendar, Clock, Ticket, Hash, Download, QrCode, CreditCard } from "lucide-react";
import { posterMap } from "@/components/MovieCard";

type BookingRow = {
  id: string;
  movie_id: string;
  showtime_id: string;
  seats_selected: number;
  total_amount: number;
  payment_status: string;
  booking_date: string;
  created_at: string;
  movies: { title: string; genre: string; language: string; poster_url: string | null; description: string | null } | null;
  showtimes: { show_date: string; show_time: string; theater_id: string; theaters: { name: string; city: string } | null } | null;
};

const statusBadge = (status: string) => {
  switch (status) {
    case "Paid": return "bg-green-500/15 text-green-400 border-green-500/30";
    case "Pending": return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    default: return "bg-red-500/15 text-red-400 border-red-500/30";
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "Paid": return "Confirmed";
    case "Pending": return "Payment Pending";
    default: return "Payment Failed";
  }
};

type Props = {
  booking: BookingRow | null;
  isOpen: boolean;
  onClose: () => void;
};

const BookingDetailModal = ({ booking, isOpen, onClose }: Props) => {
  if (!isOpen || !booking) return null;

  const poster = posterMap[booking.movies?.title || ""] || booking.movies?.poster_url || "";
  const txnId = "TXN" + booking.id.replace(/-/g, "").slice(0, 12).toUpperCase();

  const handleDownload = () => {
    const text = `
═══════════════════════════════════
       🎬 BOOKING TICKET
═══════════════════════════════════

Movie:       ${booking.movies?.title}
Genre:       ${booking.movies?.genre}
Language:    ${booking.movies?.language}
Theater:     ${booking.showtimes?.theaters?.name}, ${booking.showtimes?.theaters?.city}
Date:        ${booking.showtimes?.show_date}
Time:        ${booking.showtimes?.show_time?.slice(0, 5)}
Seats:       ${booking.seats_selected}
Amount:      ₹${booking.total_amount.toLocaleString()}

Booking ID:  ${booking.id.slice(0, 8).toUpperCase()}
Txn ID:      ${txnId}
Status:      ${booking.payment_status.toUpperCase()}
Booked On:   ${new Date(booking.created_at).toLocaleString()}

═══════════════════════════════════
    Thank you for booking with us!
═══════════════════════════════════
    `.trim();

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket-${booking.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          className="w-full max-w-lg bg-card border border-border rounded-t-2xl md:rounded-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Movie Banner */}
          <div className="relative h-36 overflow-hidden rounded-t-2xl">
            <img src={poster} alt={booking.movies?.title} className="w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
            <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors bg-card/50 rounded-full p-1.5">
              <X size={18} />
            </button>
            <div className="absolute bottom-3 left-4 right-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-display text-2xl text-foreground">{booking.movies?.title}</p>
                  <p className="text-muted-foreground text-xs">{booking.movies?.genre} • {booking.movies?.language}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${statusBadge(booking.payment_status)}`}>
                  {statusLabel(booking.payment_status)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Description */}
            {booking.movies?.description && (
              <p className="text-muted-foreground text-xs leading-relaxed">{booking.movies.description}</p>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Theater</p>
                  <p className="text-sm text-foreground font-medium">{booking.showtimes?.theaters?.name}</p>
                  <p className="text-xs text-muted-foreground">{booking.showtimes?.theaters?.city}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar size={14} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Date & Time</p>
                  <p className="text-sm text-foreground font-medium">{booking.showtimes?.show_date}</p>
                  <p className="text-xs text-muted-foreground">{booking.showtimes?.show_time?.slice(0, 5)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Ticket size={14} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Seats</p>
                  <p className="text-sm text-foreground font-medium">{booking.seats_selected} seat{booking.seats_selected > 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Hash size={14} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Booking ID</p>
                  <p className="text-sm text-foreground font-medium font-mono">#{booking.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-border" />

            {/* Payment Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={14} className="text-primary" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Payment Details</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="text-foreground font-semibold">₹{booking.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="text-foreground font-mono text-xs">{txnId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Booked On</span>
                <span className="text-foreground text-xs">{new Date(booking.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-border" />

            {/* Mock QR Code */}
            {booking.payment_status === "Paid" && (
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Entry QR Code</p>
                <div className="w-32 h-32 mx-auto bg-foreground/5 border-2 border-dashed border-border rounded-xl flex items-center justify-center">
                  <div className="grid grid-cols-6 gap-0.5">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-[2px] ${
                          // deterministic pattern based on booking id
                          parseInt(booking.id.charAt(i % booking.id.length), 36) % 3 !== 0
                            ? "bg-foreground"
                            : "bg-transparent"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground text-[10px] mt-2">Show this at the theater entrance</p>
              </div>
            )}

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              <Download size={16} /> Download Ticket (PDF)
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingDetailModal;
