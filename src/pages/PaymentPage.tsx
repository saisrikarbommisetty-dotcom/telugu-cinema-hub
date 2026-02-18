import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Smartphone, Building2, Loader2, Check, Download, ArrowLeft, Ticket, MapPin, Calendar, Clock, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { posterMap } from "@/components/MovieCard";

type PaymentMethod = "debit" | "credit" | "upi" | "netbanking";

type BookingData = {
  movieId: string;
  movieTitle: string;
  showtimeId: string;
  theaterName: string;
  theaterCity: string;
  showDate: string;
  showTime: string;
  seatIds: string[];
  totalPrice: number;
  posterUrl: string | null;
};

const generateTxnId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "TXN";
  for (let i = 0; i < 12; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
};

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [stage, setStage] = useState<"select" | "processing" | "success">("select");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [txnId] = useState(generateTxnId);
  const receiptRef = useRef<HTMLDivElement>(null);

  const bookingData = location.state as BookingData | null;

  useEffect(() => {
    if (!bookingData) navigate("/");
  }, [bookingData, navigate]);

  if (!bookingData) return null;

  const poster = posterMap[bookingData.movieTitle] || bookingData.posterUrl || "";

  const handlePay = async () => {
    if (!user) {
      toast.error("Please sign in to continue");
      navigate("/auth");
      return;
    }

    setStage("processing");

    try {
      // Decrement seats
      const { error: seatError } = await supabase.rpc("decrement_seats", {
        p_showtime_id: bookingData.showtimeId,
        p_seats: bookingData.seatIds.length,
      });
      if (seatError) throw seatError;

      // Insert booking as Pending
      const { data: inserted, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          movie_id: bookingData.movieId,
          showtime_id: bookingData.showtimeId,
          seats_selected: bookingData.seatIds.length,
          total_amount: bookingData.totalPrice,
          payment_status: "Pending",
        })
        .select("id")
        .single();
      if (bookingError) throw bookingError;

      // Simulate payment delay (3-5s)
      const delay = 3000 + Math.random() * 2000;
      await new Promise((r) => setTimeout(r, delay));

      // Update to Paid
      await supabase.from("bookings").update({ payment_status: "Paid" }).eq("id", inserted.id);

      setBookingId(inserted.id);
      setStage("success");
      toast.success("Payment successful! 🎉");
    } catch (err: any) {
      setStage("select");
      toast.error(err.message || "Payment failed. Please try again.");
    }
  };

  const handleDownloadReceipt = () => {
    const receipt = receiptRef.current;
    if (!receipt) return;

    const text = `
═══════════════════════════════════
       🎬 BOOKING CONFIRMATION
═══════════════════════════════════

Movie:       ${bookingData.movieTitle}
Theater:     ${bookingData.theaterName}, ${bookingData.theaterCity}
Date:        ${bookingData.showDate}
Time:        ${bookingData.showTime}
Seats:       ${bookingData.seatIds.join(", ")}
Amount:      ₹${bookingData.totalPrice.toLocaleString()}

Booking ID:  ${bookingId?.slice(0, 8).toUpperCase()}
Txn ID:      ${txnId}
Status:      PAID ✓

═══════════════════════════════════
    Thank you for booking with us!
═══════════════════════════════════
    `.trim();

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `booking-${bookingId?.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const methods: { id: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: "upi", label: "UPI", icon: <Smartphone size={20} />, desc: "Google Pay, PhonePe, Paytm" },
    { id: "debit", label: "Debit Card", icon: <CreditCard size={20} />, desc: "Visa, Mastercard, RuPay" },
    { id: "credit", label: "Credit Card", icon: <CreditCard size={20} />, desc: "All major cards accepted" },
    { id: "netbanking", label: "Net Banking", icon: <Building2 size={20} />, desc: "All Indian banks" },
  ];

  const convenienceFee = Math.round(bookingData.totalPrice * 0.018);
  const grandTotal = bookingData.totalPrice + convenienceFee;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="container flex items-center gap-3 py-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-xl text-foreground">
            {stage === "success" ? "Booking Confirmed" : "Complete Payment"}
          </h1>
        </div>
      </div>

      <div className="container py-6 max-w-3xl">
        <AnimatePresence mode="wait">
          {/* ── PROCESSING ── */}
          {stage === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-24">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full mx-auto mb-6"
              />
              <p className="text-foreground font-display text-2xl mb-2">Processing Payment</p>
              <p className="text-muted-foreground text-sm">Verifying with {methods.find((m) => m.id === paymentMethod)?.label}...</p>
              <div className="mt-8 flex items-center justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-primary"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── SUCCESS + RECEIPT ── */}
          {stage === "success" && (
            <motion.div key="success" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              {/* Success animation */}
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="text-center mb-8">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }}>
                    <Check className="w-10 h-10 text-green-500" />
                  </motion.div>
                </div>
                <p className="text-foreground font-display text-3xl">Payment Successful!</p>
                <p className="text-muted-foreground text-sm mt-1">Your tickets are confirmed</p>
              </motion.div>

              {/* Receipt card */}
              <div ref={receiptRef} className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Movie banner */}
                <div className="relative h-32 overflow-hidden">
                  <img src={poster} alt={bookingData.movieTitle} className="w-full h-full object-cover opacity-40" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <p className="font-display text-2xl text-foreground">{bookingData.movieTitle}</p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Theater</p>
                        <p className="text-sm text-foreground font-medium">{bookingData.theaterName}</p>
                        <p className="text-xs text-muted-foreground">{bookingData.theaterCity}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar size={14} className="text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Date & Time</p>
                        <p className="text-sm text-foreground font-medium">{bookingData.showDate}</p>
                        <p className="text-xs text-muted-foreground">{bookingData.showTime}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Ticket size={14} className="text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Seats</p>
                        <p className="text-sm text-foreground font-medium">{bookingData.seatIds.join(", ")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Hash size={14} className="text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Booking ID</p>
                        <p className="text-sm text-foreground font-medium font-mono">{bookingId?.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-dashed border-border" />

                  {/* Price */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tickets ({bookingData.seatIds.length})</span>
                      <span className="text-foreground">₹{bookingData.totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Convenience Fee</span>
                      <span className="text-foreground">₹{convenienceFee.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between">
                      <span className="text-foreground font-semibold">Total Paid</span>
                      <span className="text-foreground font-display text-xl">₹{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-dashed border-border" />

                  {/* Txn info */}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Transaction ID: <span className="font-mono text-foreground">{txnId}</span></span>
                    <span className="text-green-500 font-semibold">PAID ✓</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleDownloadReceipt}
                  className="flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-semibold py-3.5 rounded-xl transition-colors"
                >
                  <Download size={18} /> Download Receipt
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </motion.div>
          )}

          {/* ── PAYMENT SELECTION ── */}
          {stage === "select" && (
            <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {/* Booking summary card */}
              <div className="bg-card border border-border rounded-xl p-4 mb-6">
                <div className="flex gap-4">
                  <img src={poster} alt={bookingData.movieTitle} className="w-20 h-28 object-cover rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display text-xl text-foreground truncate">{bookingData.movieTitle}</h2>
                    <div className="mt-2 space-y-1.5 text-sm">
                      <p className="text-muted-foreground flex items-center gap-1.5">
                        <MapPin size={13} className="text-primary shrink-0" />
                        {bookingData.theaterName}, {bookingData.theaterCity}
                      </p>
                      <p className="text-muted-foreground flex items-center gap-1.5">
                        <Calendar size={13} className="text-primary shrink-0" />
                        {bookingData.showDate}
                        <Clock size={13} className="text-primary shrink-0 ml-2" />
                        {bookingData.showTime}
                      </p>
                      <p className="text-muted-foreground flex items-center gap-1.5">
                        <Ticket size={13} className="text-primary shrink-0" />
                        {bookingData.seatIds.join(", ")} ({bookingData.seatIds.length} ticket{bookingData.seatIds.length > 1 ? "s" : ""})
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-2">
                <h3 className="text-foreground font-semibold text-sm mb-3">Price Breakdown</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ticket Price × {bookingData.seatIds.length}</span>
                  <span className="text-foreground">₹{bookingData.totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Convenience Fee (1.8%)</span>
                  <span className="text-foreground">₹{convenienceFee.toLocaleString()}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="text-foreground font-semibold">Total</span>
                  <span className="text-foreground font-display text-2xl">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment methods */}
              <div className="mb-6">
                <h3 className="text-foreground font-semibold text-sm mb-3">Payment Method</h3>
                <div className="grid grid-cols-2 gap-3">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        paymentMethod === m.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary/30 hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className={`mb-2 ${paymentMethod === m.id ? "text-primary" : "text-muted-foreground"}`}>
                        {m.icon}
                      </div>
                      <p className="text-foreground font-medium text-sm">{m.label}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* UPI QR style */}
              {paymentMethod === "upi" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6">
                  <div className="bg-card border border-border rounded-xl p-6 text-center">
                    <div className="w-40 h-40 mx-auto bg-foreground/5 border-2 border-dashed border-border rounded-xl flex items-center justify-center mb-3">
                      <div className="grid grid-cols-5 gap-1">
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div key={i} className={`w-4 h-4 rounded-sm ${Math.random() > 0.4 ? "bg-foreground" : "bg-transparent"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs">Scan QR code or click Pay to simulate</p>
                  </div>
                </motion.div>
              )}

              {/* Card form placeholder */}
              {(paymentMethod === "debit" || paymentMethod === "credit") && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6">
                  <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Card Number</label>
                      <input type="text" placeholder="•••• •••• •••• ••••" maxLength={19}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Expiry</label>
                        <input type="text" placeholder="MM/YY" maxLength={5}
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">CVV</label>
                        <input type="password" placeholder="•••" maxLength={3}
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Net Banking */}
              {paymentMethod === "netbanking" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6">
                  <div className="bg-card border border-border rounded-xl p-4">
                    <label className="text-xs text-muted-foreground mb-2 block">Select Bank</label>
                    <select className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option>State Bank of India</option>
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Kotak Mahindra Bank</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {/* Pay button */}
              <button
                onClick={handlePay}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 rounded-xl transition-colors text-lg"
              >
                Pay ₹{grandTotal.toLocaleString()}
              </button>

              <p className="text-center text-muted-foreground text-xs mt-3">🔒 Secured with 256-bit encryption</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PaymentPage;
