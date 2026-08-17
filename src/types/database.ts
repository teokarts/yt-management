export type WatchStatus = "unwatched" | "watching" | "watched";
export type CardDensity = "cozy" | "comfortable" | "compact";

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  default_sort: string;
  card_density: CardDensity;
  created_at: string;
  updated_at: string;
};

export type Video = {
  id: string;
  user_id: string;
  youtube_video_id: string;
  youtube_url: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  channel_name: string | null;
  channel_id: string | null;
  published_at: string | null;
  duration: string | null;
  personal_notes: string | null;
  is_favorite: boolean;
  is_watch_later: boolean;
  watch_status: WatchStatus;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: string;
  user_id: string;
  name: string;
  normalized_name: string;
  slug: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

/** Video with its categories and tags materialized. */
export type VideoWithRelations = Video & {
  categories: Category[];
  tags: Tag[];
};

export type CategoryWithCount = Category & {
  video_count: number;
};

export type TagWithCount = Tag & {
  video_count: number;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          default_sort?: string;
          card_density?: CardDensity;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Profile>;
        Relationships: [];
      };
      videos: {
        Row: Video;
        Insert: {
          user_id: string;
          youtube_video_id: string;
          youtube_url: string;
          title: string;
          description?: string | null;
          thumbnail_url?: string | null;
          channel_name?: string | null;
          channel_id?: string | null;
          published_at?: string | null;
          duration?: string | null;
          personal_notes?: string | null;
          is_favorite?: boolean;
          is_watch_later?: boolean;
          watch_status?: WatchStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Video>;
        Relationships: [
          {
            foreignKeyName: "video_categories_video_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "video_categories";
            referencedColumns: ["video_id"];
          },
          {
            foreignKeyName: "video_tags_video_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "video_tags";
            referencedColumns: ["video_id"];
          },
        ];
      };
      categories: {
        Row: Category;
        Insert: {
          user_id: string;
          name: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Category>;
        Relationships: [
          {
            foreignKeyName: "video_categories_category_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "video_categories";
            referencedColumns: ["category_id"];
          },
        ];
      };
      tags: {
        Row: Tag;
        Insert: {
          user_id: string;
          name: string;
          normalized_name?: string;
          slug?: string;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Tag>;
        Relationships: [
          {
            foreignKeyName: "video_tags_tag_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "video_tags";
            referencedColumns: ["tag_id"];
          },
        ];
      };
      video_categories: {
        Row: { video_id: string; category_id: string };
        Insert: { video_id: string; category_id: string };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "video_categories_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "video_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      video_tags: {
        Row: { video_id: string; tag_id: string };
        Insert: { video_id: string; tag_id: string };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "video_tags_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "video_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      add_video_with_relations: {
        Args: {
          p_youtube_video_id: string;
          p_youtube_url: string;
          p_title: string;
          p_description: string;
          p_thumbnail_url: string;
          p_channel_name: string;
          p_channel_id: string;
          p_published_at: string | null;
          p_duration: string | null;
          p_notes: string | null;
          p_favorite: boolean;
          p_watch_later: boolean;
          p_status: string;
          p_categories: string[];
          p_tags: string[];
        };
        Returns: string;
      };
      set_video_relations: {
        Args: {
          p_video: string;
          p_categories: string[];
          p_tags: string[];
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
