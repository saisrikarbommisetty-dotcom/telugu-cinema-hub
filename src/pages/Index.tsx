import Header from "@/components/Header";
import HeroCarousel from "@/components/HeroCarousel";
import CategorySection from "@/components/CategorySection";
import MobileNav from "@/components/MobileNav";
import { movies } from "@/data/movies";

const trendingMovies = movies.filter((m) => m.category.includes("trending"));
const inTheatres = movies.filter((m) => m.category.includes("in-theatres"));
const comingSoon = movies.filter((m) => m.category.includes("coming-soon"));
const topRated = movies
  .filter((m) => m.category.includes("top-rated"))
  .sort((a, b) => (b.rating || 0) - (a.rating || 0));

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <HeroCarousel />

      <div className="mt-2">
        <CategorySection title="🔥 Trending Now" movies={trendingMovies} />
        <CategorySection title="🎬 In Theatres" movies={inTheatres} />
        <CategorySection title="🎥 Coming Soon" movies={comingSoon} />
        <CategorySection title="⭐ Top Rated Telugu" movies={topRated} />
      </div>

      {/* Tagline banner */}
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
