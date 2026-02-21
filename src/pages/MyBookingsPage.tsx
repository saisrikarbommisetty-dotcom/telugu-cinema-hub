import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { posterMap } from "@/components/MovieCard";
import {
  ArrowLeft, Ticket, MapPin, Calendar, Clock, Hash, Filter,
  TrendingUp, CreditCard, Heart, Loader2,
} from "lucide-react";
import BookingDetailModal from "@/components/BookingDetailModal";

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
    case "Paid":
      return "bg-green-500/15 text-green-400 border-green-500/30";
    case "Pending":
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-red-500/15 text-red-400 border-red-500/30";
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "Paid": return "Confirmed";
    case "Pending": return "Payment Pending";
    default: return "Payment Failed";
  }
};

const MyBookingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [cityFilter, setCityFilter] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchBookings();

    // Realtime subscription
    const channel = supabase
      .channel("my-bookings")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setBookings((prev) =>
            prev.map((b) => (b.id === payload.new.id ? { ...b, ...payload.new } : b))
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*, movies(title, genre, language, poster_url, description), showtimes(show_date, show_time, theater_id, theaters(name, city))")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBookings(data as unknown as BookingRow[]);
    }
    setLoading(false);
  };

  const now = new Date();

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      // time filter
      if (filter !== "all" && b.showtimes) {
        const showDate = new Date(b.showtimes.show_date + "T" + b.showtimes.show_time);
        if (filter === "upcoming" && showDate < now) return false;
        if (filter === "past" && showDate >= now) return false;
      }
      // city filter
      if (cityFilter && b.showtimes?.theaters?.city) {
        if (!b.showtimes.theaters.city.toLowerCase().includes(cityFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [bookings, filter, cityFilter]);

  const upcoming = filtered.filter((b) => {
    if (!b.showtimes) return false;
    return new Date(b.showtimes.show_date + "T" + b.showtimes.show_time) >= now;
  });
  const completed = filtered.filter((b) => {
    if (!b.showtimes) return false;
    return new Date(b.showtimes.show_date + "T" + b.showtimes.show_time) < now && b.payment_status === "Paid";
  });
  const cancelled = filtered.filter((b) => {
    if (!b.showtimes) return false;
    return new Date(b.showtimes.show_date + "T" + b.showtimes.show_time) < now && b.payment_status !== "Paid";
  });

  // Summary stats
  const totalBookings = bookings.length;
  const totalSpent = bookings.filter((b) => b.payment_status === "Paid").reduce((s, b) => s + b.total_amount, 0);
  const genreCounts: Record<string, number> = {};
  bookings.forEach((b) => {
    if (b.movies?.genre) genreCounts[b.movies.genre] = (genreCounts[b.movies.genre] || 0) + 1;
  });
  const favGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const cities = [...new Set(bookings.map((b) => b.showtimes?.theaters?.city).filter(Boolean))] as string[];

  const renderSection = (title: string, items: BookingRow[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-8">
        <h2 className="font-display text-xl text-foreground mb-4">{title}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((b, i) => {
            const poster = posterMap[b.movies?.title || ""] || b.movies?.poster_url || "";
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedBooking(b)}
                className="bg-card border border-border rounded-xl p-4 flex gap-4 cursor-pointer hover:border-primary/40 transition-all group"
              >
                <img
                  src={poster}
                  alt={b.movies?.title}
                  className="w-20 h-28 object-cover rounded-lg shrink-0"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-foreground font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {b.movies?.title}
                    </h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusBadge(b.payment_status)}`}>
                      {statusLabel(b.payment_status)}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-primary shrink-0" />
                      {b.showtimes?.theaters?.name}, {b.showtimes?.theaters?.city}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Calendar size={11} className="text-primary shrink-0" />
                      {b.showtimes?.show_date}
                      <Clock size={11} className="text-primary shrink-0 ml-1" />
                      {b.showtimes?.show_time?.slice(0, 5)}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Ticket size={11} className="text-primary shrink-0" />
                      {b.seats_selected} seat{b.seats_selected > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-foreground font-semibold text-sm">₹{b.total_amount.toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">#{b.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="container flex items-center gap-3 py-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-2xl text-foreground">My Bookings</h1>
        </div>
      </div>

      <div className="container py-6 max-w-4xl">
        {loading ? (
          <div className="text-center py-24">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <TrendingUp size={18} className="text-primary mx-auto mb-1" />
                <p className="text-foreground font-display text-2xl">{totalBookings}</p>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Bookings</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <CreditCard size={18} className="text-primary mx-auto mb-1" />
                <p className="text-foreground font-display text-2xl">₹{totalSpent.toLocaleString()}</p>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Spent</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <Heart size={18} className="text-primary mx-auto mb-1" />
                <p className="text-foreground font-display text-lg">{favGenre}</p>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Fav Genre</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <Filter size={14} className="text-muted-foreground" />
              {(["all", "upcoming", "past"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    filter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/40 text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {f === "all" ? "All" : f === "upcoming" ? "Upcoming" : "Past"}
                </button>
              ))}
              {cities.length > 1 && (
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-secondary/40 text-muted-foreground border border-border outline-none"
                >
                  <option value="">All Cities</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Booking Sections */}
            {bookings.length === 0 ? (
              <div className="text-center py-20">
                <Ticket size={48} className="text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No bookings yet</p>
                <button onClick={() => navigate("/")} className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 rounded-xl transition-colors">
                  Browse Movies
                </button>
              </div>
            ) : (
              <>
                {renderSection("🎬 Upcoming Shows", upcoming)}
                {renderSection("✅ Completed Shows", completed)}
                {renderSection("❌ Cancelled / Expired", cancelled)}
                {filtered.length === 0 && (
                  <p className="text-center text-muted-foreground py-12">No bookings match your filters.</p>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
};

export default MyBookingsPage;
