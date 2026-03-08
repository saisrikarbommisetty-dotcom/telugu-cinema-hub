
-- Drop RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Movies are publicly readable" ON public.movies;
CREATE POLICY "Movies are publicly readable" ON public.movies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Showtimes are publicly readable" ON public.showtimes;
CREATE POLICY "Showtimes are publicly readable" ON public.showtimes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Theaters are publicly readable" ON public.theaters;
CREATE POLICY "Theaters are publicly readable" ON public.theaters FOR SELECT USING (true);
