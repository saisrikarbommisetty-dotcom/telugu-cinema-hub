import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import BookingModal from "./BookingModal";

// Local poster fallbacks
import kalkiPoster from "@/assets/kalki-poster.jpg";
import devaraPoster from "@/assets/devara-poster.jpg";
import salaarPoster from "@/assets/salaar-poster.jpg";
import pushpa2Poster from "@/assets/pushpa2-poster.jpg";
import rrrPoster from "@/assets/rrr-poster.jpg";
import baahubaliPoster from "@/assets/baahubali-poster.jpg";
import hanumanPoster from "@/assets/hanuman-poster.jpg";
import sitaramamPoster from "@/assets/sitaramam-poster.jpg";

export const posterMap: Record<string, string> = {
  "Kalki 2898 AD": kalkiPoster,
  "Devara: Part 1": devaraPoster,
  "Salaar: Cease Fire": salaarPoster,
  "Pushpa 2: The Rule": pushpa2Poster,
  "RRR": rrrPoster,
  "Baahubali: The Conclusion": baahubaliPoster,
  "HanuMan": hanumanPoster,
  "Sita Ramam": sitaramamPoster,
};

type MovieCardProps = {
  movie: {
    id: string;
    title: string;
    genre: string;
    language: string;
    release_status: string;
    description: string | null;
    poster_url: string | null;
  };
  index: number;
};

const MovieCard = ({ movie, index }: MovieCardProps) => {
  const [bookingOpen, setBookingOpen] = useState(false);
  const poster = posterMap[movie.title] || movie.poster_url || "";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, duration: 0.4 }}
        className="group flex-shrink-0 w-[160px] md:w-[200px] cursor-pointer"
      >
        <div className="relative overflow-hidden rounded-lg mb-3 aspect-[2/3] bg-secondary">
          <img
            src={poster}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
            <button
              onClick={() => setBookingOpen(true)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold py-2 rounded-md transition-colors"
            >
              Book Tickets
            </button>
          </div>
          <span
            className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded ${
              movie.release_status === "Now Showing"
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-accent-foreground"
            }`}
          >
            {movie.release_status}
          </span>
        </div>
        <h3 className="text-foreground font-semibold text-sm md:text-base truncate group-hover:text-primary transition-colors">
          {movie.title}
        </h3>
        <p className="text-muted-foreground text-xs mt-0.5">{movie.genre}</p>
        <p className="text-muted-foreground/60 text-[11px] mt-0.5">{movie.language}</p>
      </motion.div>

      <BookingModal
        movieId={movie.id}
        movieTitle={movie.title}
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
      />
    </>
  );
};

export default MovieCard;
