import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import MovieCard from "./MovieCard";
import { Movie } from "@/data/movies";

interface CategorySectionProps {
  title: string;
  movies: Movie[];
}

const CategorySection = ({ title, movies }: CategorySectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  if (movies.length === 0) return null;

  return (
    <section className="py-6 md:py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-4">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="font-display text-2xl md:text-3xl text-foreground tracking-wide"
          >
            {title}
          </motion.h2>
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="bg-secondary hover:bg-secondary/80 text-foreground p-1.5 rounded-full transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="bg-secondary hover:bg-secondary/80 text-foreground p-1.5 rounded-full transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-[max(1rem,calc((100vw-1400px)/2+1rem))]"
      >
        {movies.map((movie, i) => (
          <MovieCard key={movie.id} movie={movie} index={i} />
        ))}
      </div>
    </section>
  );
};

export default CategorySection;
