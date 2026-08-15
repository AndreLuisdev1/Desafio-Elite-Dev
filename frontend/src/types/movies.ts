export interface Movie {
  tmdb_id: number;
  title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  poster_url: string | null;
}