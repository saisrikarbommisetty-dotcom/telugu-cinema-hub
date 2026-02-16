import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BookingModal from "./BookingModal";

// Local poster fallbacks mapped by movie title
import kalkiPoster from "@/assets/kalki-poster.jpg";
import devaraPoster from "@/assets/devara-poster.jpg";
import salaarPoster from "@/assets/salaar-poster.jpg";
import pushpa2Poster from "@/assets/pushpa2-poster.jpg";

const posterMap: Record<string, string> = {
  "Kalki 2898 AD": kalkiPoster,
  "Devara: Part 1": devaraPoster,
  "Salaar: Cease Fire": salaarPoster,
  "Pushpa 2: The Rule": pushpa2Poster,
};

type DBMovie = {
  id: string;
  title: string;
  genre: string;
  language: string;
  release_status: string;
  description: string | null;
  poster_url: string | null;
};

const HeroCarousel = () => {
  const [movies, setMovies] = useState<DBMovie[]>([]);
  const [current, setCurrent] = useState(0);
  const [bookingMovie, setBookingMovie] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      const { data } = await supabase
        .from("movies")
        .select("id, title, genre, language, release_status, description, poster_url")
        .eq("release_status", "Now Showing")
        .limit(4);
      if (data) setMovies(data);
    };
    fetchMovies();
  }, []);

  useEffect(() => {
    if (movies.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % movies.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [movies.length]);

  if (movies.length === 0) return <div className="h-[70vh] bg-background" />;

  const movie = movies[current];
  const poster = posterMap[movie.title] || movie.poster_url || "";

  return (
    <>
      <section className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <img src={poster} alt={movie.title} className="w-full h-full object-cover object-top" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-hero-overlay" />

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-16 z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-primary font-semibold text-sm md:text-base tracking-widest uppercase mb-2">
                {movie.release_status}
              </p>
              <h1 className="font-display text-4xl md:text-7xl lg:text-8xl text-foreground mb-3 leading-none">
                {movie.title}
              </h1>
              <p className="text-muted-foreground text-sm md:text-lg max-w-xl mb-2">
                {movie.genre} • {movie.language}
              </p>
              <p className="text-secondary-foreground/80 text-sm md:text-base max-w-lg mb-6">
                {movie.description}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setBookingMovie({ id: movie.id, title: movie.title })}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-all duration-300"
                >
                  Book Tickets
                </button>
                <button className="border border-border bg-secondary/50 hover:bg-secondary text-secondary-foreground px-6 py-3 rounded-lg transition-all duration-300 backdrop-blur-sm">
                  Watch Trailer
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
          <p className="hidden md:block absolute bottom-6 right-16 text-muted-foreground/40 font-display text-2xl tracking-wider">
            Experience Cinema the Telugu Way.
          </p>
        </div>

        <button
          onClick={() => setCurrent((prev) => (prev - 1 + movies.length) % movies.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-secondary/60 hover:bg-secondary text-foreground p-2 rounded-full backdrop-blur-sm transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={() => setCurrent((prev) => (prev + 1) % movies.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-secondary/60 hover:bg-secondary text-foreground p-2 rounded-full backdrop-blur-sm transition-colors"
        >
          <ChevronRight size={24} />
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 md:hidden">
          {movies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current ? "bg-primary w-6" : "bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
      </section>

      <BookingModal
        movieId={bookingMovie?.id || ""}
        movieTitle={bookingMovie?.title || ""}
        isOpen={!!bookingMovie}
        onClose={() => setBookingMovie(null)}
      />
    </>
  );
};

export default HeroCarousel;
