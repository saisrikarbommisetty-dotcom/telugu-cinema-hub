import kalkiPoster from "@/assets/kalki-poster.jpg";
import devaraPoster from "@/assets/devara-poster.jpg";
import salaarPoster from "@/assets/salaar-poster.jpg";
import pushpa2Poster from "@/assets/pushpa2-poster.jpg";
import rrrPoster from "@/assets/rrr-poster.jpg";
import baahubaliPoster from "@/assets/baahubali-poster.jpg";
import hanumanPoster from "@/assets/hanuman-poster.jpg";
import sitaramamPoster from "@/assets/sitaramam-poster.jpg";

export type MovieRecord = {
  id: string;
  title: string;
  genre: string;
  language: string;
  release_status: string;
  description: string | null;
  poster_url: string | null;
  availability_status?: string;
};

const MOVIES_CACHE_KEY = "movies_cache_v1";

export const FALLBACK_MOVIES: MovieRecord[] = [
  {
    id: "fallback-kalki",
    title: "Kalki 2898 AD",
    genre: "Sci-Fi, Action",
    language: "Telugu",
    release_status: "Now Showing",
    description: "A dystopian epic set in the future.",
    poster_url: kalkiPoster,
    availability_status: "Available",
  },
  {
    id: "fallback-devara",
    title: "Devara: Part 1",
    genre: "Action, Drama",
    language: "Telugu",
    release_status: "Now Showing",
    description: "An intense coastal action drama.",
    poster_url: devaraPoster,
    availability_status: "Available",
  },
  {
    id: "fallback-salaar",
    title: "Salaar: Cease Fire",
    genre: "Action, Thriller",
    language: "Telugu",
    release_status: "Now Showing",
    description: "A high-stakes story of power and loyalty.",
    poster_url: salaarPoster,
    availability_status: "Available",
  },
  {
    id: "fallback-pushpa2",
    title: "Pushpa 2: The Rule",
    genre: "Action, Crime",
    language: "Telugu",
    release_status: "Now Showing",
    description: "Pushpa rises in a gritty red sandalwood empire.",
    poster_url: pushpa2Poster,
    availability_status: "Available",
  },
  {
    id: "fallback-rrr",
    title: "RRR",
    genre: "Action, Drama",
    language: "Telugu",
    release_status: "Coming Soon",
    description: "A grand cinematic spectacle.",
    poster_url: rrrPoster,
    availability_status: "Available",
  },
  {
    id: "fallback-baahubali",
    title: "Baahubali: The Conclusion",
    genre: "Epic, Action",
    language: "Telugu",
    release_status: "Coming Soon",
    description: "The epic saga continues.",
    poster_url: baahubaliPoster,
    availability_status: "Available",
  },
  {
    id: "fallback-hanuman",
    title: "HanuMan",
    genre: "Superhero, Fantasy",
    language: "Telugu",
    release_status: "Coming Soon",
    description: "A mythic superhero adventure.",
    poster_url: hanumanPoster,
    availability_status: "Available",
  },
  {
    id: "fallback-sitaramam",
    title: "Sita Ramam",
    genre: "Romance, Drama",
    language: "Telugu",
    release_status: "Coming Soon",
    description: "A heartfelt romantic period drama.",
    poster_url: sitaramamPoster,
    availability_status: "Available",
  },
];

const isMovieRecord = (value: unknown): value is MovieRecord => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.genre === "string" &&
    typeof record.language === "string" &&
    typeof record.release_status === "string"
  );
};

export const loadMoviesFromCache = (): MovieRecord[] => {
  try {
    const raw = localStorage.getItem(MOVIES_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMovieRecord);
  } catch {
    return [];
  }
};

export const saveMoviesToCache = (movies: MovieRecord[]) => {
  try {
    localStorage.setItem(MOVIES_CACHE_KEY, JSON.stringify(movies));
  } catch {
    // ignore storage failures
  }
};

export const getInitialMovies = (): MovieRecord[] => {
  const cachedMovies = loadMoviesFromCache();
  return cachedMovies.length > 0 ? cachedMovies : FALLBACK_MOVIES;
};

export const getInitialNowShowingMovies = (limit = 4): MovieRecord[] => {
  const cachedNowShowing = loadMoviesFromCache().filter((movie) => movie.release_status === "Now Showing");
  const source = cachedNowShowing.length > 0
    ? cachedNowShowing
    : FALLBACK_MOVIES.filter((movie) => movie.release_status === "Now Showing");

  return source.slice(0, limit);
};
