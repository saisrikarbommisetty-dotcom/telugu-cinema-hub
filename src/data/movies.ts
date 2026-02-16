import kalkiPoster from "@/assets/kalki-poster.jpg";
import devaraPoster from "@/assets/devara-poster.jpg";
import salaarPoster from "@/assets/salaar-poster.jpg";
import pushpa2Poster from "@/assets/pushpa2-poster.jpg";
import rrrPoster from "@/assets/rrr-poster.jpg";
import baahubaliPoster from "@/assets/baahubali-poster.jpg";
import hanumanPoster from "@/assets/hanuman-poster.jpg";
import sitaramamPoster from "@/assets/sitaramam-poster.jpg";

export type Movie = {
  id: string;
  title: string;
  genre: string;
  language: string;
  status: "Now Showing" | "Coming Soon";
  description: string;
  poster: string;
  rating?: number;
  category: ("trending" | "in-theatres" | "coming-soon" | "top-rated")[];
};

export const movies: Movie[] = [
  {
    id: "kalki",
    title: "Kalki 2898 AD",
    genre: "Sci-Fi / Action",
    language: "Telugu",
    status: "Now Showing",
    description: "A futuristic epic blending mythology with a dystopian world.",
    poster: kalkiPoster,
    rating: 8.2,
    category: ["trending", "in-theatres", "top-rated"],
  },
  {
    id: "devara",
    title: "Devara: Part 1",
    genre: "Action / Thriller",
    language: "Telugu",
    status: "Now Showing",
    description: "A fierce tale of power and legacy set on the coastal seas.",
    poster: devaraPoster,
    rating: 7.5,
    category: ["trending", "in-theatres"],
  },
  {
    id: "salaar",
    title: "Salaar: Cease Fire",
    genre: "Action / Drama",
    language: "Telugu",
    status: "Now Showing",
    description: "A violent underworld saga of brotherhood and betrayal.",
    poster: salaarPoster,
    rating: 7.8,
    category: ["trending", "in-theatres", "top-rated"],
  },
  {
    id: "pushpa2",
    title: "Pushpa 2: The Rule",
    genre: "Action / Crime",
    language: "Telugu",
    status: "Now Showing",
    description: "The red sandalwood smuggler returns to reclaim his throne.",
    poster: pushpa2Poster,
    rating: 8.5,
    category: ["trending", "in-theatres", "top-rated"],
  },
  {
    id: "rrr",
    title: "RRR",
    genre: "Action / Drama",
    language: "Telugu",
    status: "Now Showing",
    description: "Two legendary freedom fighters forge an unforgettable bond.",
    poster: rrrPoster,
    rating: 9.0,
    category: ["top-rated", "trending"],
  },
  {
    id: "baahubali",
    title: "Baahubali: The Conclusion",
    genre: "Epic / Action",
    language: "Telugu",
    status: "Now Showing",
    description: "The epic conclusion to India's greatest cinematic saga.",
    poster: baahubaliPoster,
    rating: 8.8,
    category: ["top-rated"],
  },
  {
    id: "hanuman",
    title: "HanuMan",
    genre: "Superhero / Fantasy",
    language: "Telugu",
    status: "Coming Soon",
    description: "A young man discovers divine powers in a mythological adventure.",
    poster: hanumanPoster,
    rating: 8.0,
    category: ["coming-soon", "top-rated"],
  },
  {
    id: "sitaramam",
    title: "Sita Ramam",
    genre: "Romance / Drama",
    language: "Telugu",
    status: "Coming Soon",
    description: "A soldier's love letter sparks a journey across borders and time.",
    poster: sitaramamPoster,
    rating: 8.7,
    category: ["coming-soon", "top-rated"],
  },
];
