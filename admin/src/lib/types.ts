export type Project = {
  id: string;
  slug: string;
  name: string;
  description: string;
  district: string;
  village: string;
  city: string;
  state: string;
  thumbnail_url: string;
  gallery_urls: string[];
  map_lat: number | null;
  map_lng: number | null;
  map_embed_url: string | null;
  brochure_url: string | null;
  status: "active" | "upcoming" | "sold_out";
  approval_types: string[];
  amenities: string[];
  nearby: {
    schools?: { name: string; distance: string }[];
    hospitals?: { name: string; distance: string }[];
    highway_km?: number;
    airport_km?: number;
  };
  featured: boolean;
  created_at: string;
};

export type Plot = {
  id: string;
  project_id: string;
  plot_number: string;
  area_sqyd: number;
  price_per_sqyd: number;
  facing: string;
  plot_type: "open" | "villa" | "commercial" | "farm";
  availability: "available" | "reserved" | "sold";
  latitude: number | null;
  longitude: number | null;
  images?: string[];
};

export type Location = {
  id: string;
  name: string;
  type: "village" | "city" | "district";
  state: string;
};

export type ProjectWithPlots = Project & {
  plots: Plot[];
};
