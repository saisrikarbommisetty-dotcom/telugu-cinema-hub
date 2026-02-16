import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Movie } from "@/data/movies";

interface MovieCardProps {
  movie: Movie;
  index: number;
}

const MovieCard = ({ movie, index }: MovieCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="group flex-shrink-0 w-[160px] md:w-[200px] cursor-pointer"
    >
      {/* Poster */}
      <div className="relative overflow-hidden rounded-lg mb-3 aspect-[2/3] bg-secondary">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold py-2 rounded-md transition-colors">
            Book Tickets
          </button>
        </div>
        {/* Status badge */}
        <span
          className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded ${
            movie.status === "Now Showing"
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-accent-foreground"
          }`}
        >
          {movie.status}
        </span>
        {/* Rating */}
        {movie.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[11px]">
            <Star size={10} className="text-accent fill-accent" />
            <span className="text-foreground font-medium">{movie.rating}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <h3 className="text-foreground font-semibold text-sm md:text-base truncate group-hover:text-primary transition-colors">
        {movie.title}
      </h3>
      <p className="text-muted-foreground text-xs mt-0.5">{movie.genre}</p>
      <p className="text-muted-foreground/60 text-[11px] mt-0.5">{movie.language}</p>
    </motion.div>
  );
};

export default MovieCard;
