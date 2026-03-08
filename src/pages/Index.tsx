import { useState, useEffect } from "react";
import Header from "@/components/Header";
import HeroCarousel from "@/components/HeroCarousel";
import CategorySection from "@/components/CategorySection";
import MobileNav from "@/components/MobileNav";
import { supabase } from "@/integrations/supabase/client";

type DBMovie = {
  id: string;
  title: string;
  genre: string;
  language: string;
  release_status: string;
  description: string | null;
  poster_url: string | null;
  availability_status: string;
};

const Index = () => {
  const [movies, setMovies] = useState<DBMovie[]>([]);

  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMovies = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        const { data, error: err } = await supabase
          .from("movies")
          .select("id, title, genre, language, release_status, description, poster_url, availability_status");
        if (!err && data) {
          setMovies(data);
          setError(false);
          return;
        }
        if (i < retries - 1) await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
      }
      setError(true);
    };
    fetchMovies();

    const channel = supabase
      .channel("movies-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "movies" }, () => {
        fetchMovies(1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const nowShowing = movies.filter((m) => m.release_status === "Now Showing");
  const comingSoon = movies.filter((m) => m.release_status === "Coming Soon");

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <HeroCarousel />

      <div className="mt-2">
        <CategorySection title="🔥 Trending Now" movies={nowShowing} />
        <CategorySection title="🎬 In Theatres" movies={nowShowing} />
        <CategorySection title="🎥 Coming Soon" movies={comingSoon} />
        <CategorySection title="⭐ Top Rated Telugu" movies={movies} />
      </div>

      <section className="py-12 md:py-16">
        <div className="container text-center">
          <h2 className="font-display text-3xl md:text-5xl text-gradient-hero mb-3">
            Experience Cinema the Telugu Way.
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            Your one-stop destination for booking Telugu movie tickets, exploring new releases, and celebrating Tollywood.
          </p>
        </div>
      </section>

      <MobileNav />
    </div>
  );
};

export default Index;
