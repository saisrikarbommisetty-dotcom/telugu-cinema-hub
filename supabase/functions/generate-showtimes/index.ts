import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Delete past showtimes (keep bookings referencing them but clean showtime table)
    const { error: deleteError } = await supabase
      .from("showtimes")
      .delete()
      .lt("show_date", new Date().toISOString().split("T")[0]);

    if (deleteError) {
      console.error("Error deleting past showtimes:", deleteError);
    }

    // 2. Find the latest existing showtime date
    const { data: latestRow } = await supabase
      .from("showtimes")
      .select("show_date")
      .order("show_date", { ascending: false })
      .limit(1)
      .single();

    const today = new Date();
    const latestDate = latestRow?.show_date ? new Date(latestRow.show_date) : today;

    // Calculate how many days to generate to maintain 30-day window
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 29);

    const daysToGenerate = Math.ceil(
      (targetDate.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysToGenerate <= 0) {
      return new Response(
        JSON.stringify({ message: "Showtimes already up to date", daysToGenerate: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Fetch movies and theaters
    const { data: movies } = await supabase
      .from("movies")
      .select("id, release_status")
      .in("release_status", ["Now Showing", "Coming Soon"]);

    const { data: theaters } = await supabase
      .from("theaters")
      .select("id, total_seats");

    if (!movies?.length || !theaters?.length) {
      return new Response(
        JSON.stringify({ error: "No movies or theaters found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Generate new showtimes
    const timeSlots = ["10:00", "14:30", "18:00", "21:30"];
    const rows: Array<{
      movie_id: string;
      theater_id: string;
      show_date: string;
      show_time: string;
      available_seats: number;
    }> = [];

    for (let d = 1; d <= daysToGenerate; d++) {
      const date = new Date(latestDate);
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split("T")[0];

      for (const movie of movies) {
        for (const theater of theaters) {
          for (const time of timeSlots) {
            rows.push({
              movie_id: movie.id,
              theater_id: theater.id,
              show_date: dateStr,
              show_time: time,
              available_seats: theater.total_seats,
            });
          }
        }
      }
    }

    // Insert in batches of 500
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      const { error: insertError } = await supabase
        .from("showtimes")
        .upsert(batch, { onConflict: "movie_id,theater_id,show_date,show_time", ignoreDuplicates: true });

      if (insertError) {
        console.error("Insert batch error:", insertError);
      }
    }

    return new Response(
      JSON.stringify({ message: `Generated ${rows.length} showtimes for ${daysToGenerate} days` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
