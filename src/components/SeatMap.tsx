import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";

type SeatType = "regular" | "premium" | "recliner";
type SeatStatus = "available" | "filled" | "selected";

type Seat = {
  row: string;
  number: number;
  type: SeatType;
  status: SeatStatus;
};

type SeatMapProps = {
  totalSeats: number;
  availableSeats: number;
  maxSelect: number;
  showtimeId: string;
  onSelectionChange: (selectedSeats: string[], totalPrice: number) => void;
};

const SEAT_PRICES: Record<SeatType, number> = {
  regular: 150,
  premium: 250,
  recliner: 400,
};

const SEAT_TYPE_LABELS: Record<SeatType, string> = {
  regular: "Regular",
  premium: "Premium",
  recliner: "Recliner",
};

// Deterministic pseudo-random from showtime ID to generate filled seats
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateSeatLayout(totalSeats: number, availableSeats: number, showtimeId: string): Seat[] {
  const seatsPerRow = 12;
  const totalRows = Math.ceil(totalSeats / seatsPerRow);
  const filledCount = totalSeats - availableSeats;
  const seed = hashCode(showtimeId);

  const seats: Seat[] = [];
  const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let r = 0; r < totalRows; r++) {
    const seatsInThisRow = Math.min(seatsPerRow, totalSeats - r * seatsPerRow);
    let type: SeatType = "regular";
    if (r >= totalRows - 2) type = "recliner";
    else if (r >= totalRows - 5 && r < totalRows - 2) type = "premium";

    for (let s = 1; s <= seatsInThisRow; s++) {
      seats.push({
        row: rowLabels[r] || `R${r + 1}`,
        number: s,
        type,
        status: "available",
      });
    }
  }

  // Mark some seats as filled deterministically
  const indices = seats.map((_, i) => i);
  // Fisher-Yates with seed
  let rng = seed;
  for (let i = indices.length - 1; i > 0; i--) {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    const j = rng % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  for (let i = 0; i < filledCount && i < indices.length; i++) {
    seats[indices[i]].status = "filled";
  }

  return seats;
}

const SeatMap = ({ totalSeats, availableSeats, maxSelect, showtimeId, onSelectionChange }: SeatMapProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const seats = useMemo(
    () => generateSeatLayout(totalSeats, availableSeats, showtimeId),
    [totalSeats, availableSeats, showtimeId]
  );

  const seatId = (seat: Seat) => `${seat.row}${seat.number}`;

  const handleSeatClick = useCallback((seat: Seat) => {
    if (seat.status === "filled") return;
    const id = seatId(seat);

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= maxSelect) return prev;
        next.add(id);
      }

      // Calculate price
      const selectedSeats = seats.filter((s) => next.has(seatId(s)));
      const total = selectedSeats.reduce((sum, s) => sum + SEAT_PRICES[s.type], 0);
      // Defer callback
      setTimeout(() => onSelectionChange(Array.from(next), total), 0);

      return next;
    });
  }, [maxSelect, seats, onSelectionChange]);

  // Group seats by row
  const rows = useMemo(() => {
    const map = new Map<string, Seat[]>();
    seats.forEach((s) => {
      if (!map.has(s.row)) map.set(s.row, []);
      map.get(s.row)!.push(s);
    });
    return Array.from(map.entries());
  }, [seats]);

  // Determine seat type sections
  const sectionBreaks = useMemo(() => {
    const breaks: { label: string; price: number; afterRow: string }[] = [];
    let lastType: SeatType | null = null;
    rows.forEach(([rowLabel, rowSeats]) => {
      const type = rowSeats[0]?.type;
      if (type && type !== lastType) {
        breaks.push({ label: SEAT_TYPE_LABELS[type], price: SEAT_PRICES[type], afterRow: rowLabel });
        lastType = type;
      }
    });
    return breaks;
  }, [rows]);

  const getSeatClasses = (seat: Seat) => {
    const id = seatId(seat);
    const isSelected = selectedIds.has(id);
    const base = "w-7 h-7 md:w-8 md:h-8 rounded text-[10px] md:text-xs font-bold flex items-center justify-center transition-all duration-200 ";

    if (seat.status === "filled") {
      return base + "bg-muted/40 text-muted-foreground/30 cursor-not-allowed";
    }
    if (isSelected) {
      return base + "bg-amber-500 text-black border-2 border-amber-400 shadow-lg shadow-amber-500/30 cursor-pointer scale-110";
    }
    // Available
    if (seat.type === "recliner") {
      return base + "bg-transparent border-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/20 cursor-pointer";
    }
    if (seat.type === "premium") {
      return base + "bg-transparent border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/20 cursor-pointer";
    }
    return base + "bg-transparent border-2 border-green-500/50 text-green-400 hover:bg-green-500/20 cursor-pointer";
  };

  let currentSectionIdx = 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Screen indicator */}
      <div className="text-center mb-6">
        <div className="mx-auto w-3/4 md:w-1/2 h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full mb-1" />
        <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Screen</p>
      </div>

      {/* Seat grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[340px] space-y-1 flex flex-col items-center">
          {rows.map(([rowLabel, rowSeats], rowIdx) => {
            const sectionHeader =
              currentSectionIdx < sectionBreaks.length &&
              sectionBreaks[currentSectionIdx].afterRow === rowLabel
                ? sectionBreaks[currentSectionIdx++]
                : null;

            return (
              <div key={rowLabel}>
                {sectionHeader && (
                  <div className="flex items-center gap-2 my-3 px-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground font-medium">
                      {sectionHeader.label} — ₹{sectionHeader.price}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="w-6 text-right text-[10px] text-muted-foreground font-semibold mr-1">
                    {rowLabel}
                  </span>
                  {rowSeats.map((seat, seatIdx) => {
                    // Add aisle gap in the middle
                    const isAisle = seatIdx === Math.floor(rowSeats.length / 2);
                    return (
                      <div key={seatId(seat)} className={`flex ${isAisle ? "ml-3 md:ml-4" : ""}`}>
                        <button
                          onClick={() => handleSeatClick(seat)}
                          disabled={seat.status === "filled"}
                          className={getSeatClasses(seat)}
                          title={`${seat.row}${seat.number} - ${SEAT_TYPE_LABELS[seat.type]} ₹${SEAT_PRICES[seat.type]}`}
                        >
                          {seat.number}
                        </button>
                      </div>
                    );
                  })}
                  <span className="w-6 text-left text-[10px] text-muted-foreground font-semibold ml-1">
                    {rowLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-border text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded border-2 border-green-500/50 flex items-center justify-center text-[8px] text-green-400">1</span>
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-[8px] text-black font-bold">1</span>
          Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded bg-muted/40 flex items-center justify-center text-[8px] text-muted-foreground/30">1</span>
          Filled
        </span>
      </div>

      {/* Seat type prices */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-green-500/50" />
          Regular ₹{SEAT_PRICES.regular}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-blue-500/50" />
          Premium ₹{SEAT_PRICES.premium}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-purple-500/50" />
          Recliner ₹{SEAT_PRICES.recliner}
        </span>
      </div>

      {/* Selection counter */}
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          Selected <span className="text-primary">{selectedIds.size}</span> / {maxSelect} seats
        </p>
      </div>
    </motion.div>
  );
};

export default SeatMap;
