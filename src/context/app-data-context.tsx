import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { loadSidebarData } from "@/lib/sidebar";
import { fetchAllCategories, fetchAllTags } from "@/lib/library";
import type {
  Category,
  Tag,
  CategoryWithCount,
  TagWithCount,
  Profile,
} from "@/types/database";

interface AppData {
  categories: Category[];
  categoryCounts: CategoryWithCount[];
  tags: Tag[];
  pinnedTags: TagWithCount[];
  totalVideos: number;
  favoriteCount: number;
  watchLaterCount: number;
  profile: Profile | null;
  email: string;
  isSuperAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AppDataContext = createContext<AppData>({
  categories: [],
  categoryCounts: [],
  tags: [],
  pinnedTags: [],
  totalVideos: 0,
  favoriteCount: 0,
  watchLaterCount: 0,
  profile: null,
  email: "",
  isSuperAdmin: false,
  loading: true,
  refresh: async () => {},
});

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Omit<AppData, "loading" | "refresh">>({
    categories: [],
    categoryCounts: [],
    tags: [],
    pinnedTags: [],
    totalVideos: 0,
    favoriteCount: 0,
    watchLaterCount: 0,
    profile: null,
    email: "",
    isSuperAdmin: false,
  });
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // A failure here must not degrade into a silently empty sidebar — that
    // renders as "No categories yet" and looks like real, missing data.
    const [sidebarData, categories, tags, profileRes] = await Promise.all([
      loadSidebarData(supabase, user.id),
      fetchAllCategories(supabase, user.id),
      fetchAllTags(supabase, user.id),
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    ]).catch((err) => {
      console.error("Failed to load app data", err);
      throw err;
    });

    if (!mounted.current) return;

    setData({
      categories,
      categoryCounts: sidebarData.categories,
      tags,
      pinnedTags: sidebarData.pinnedTags,
      totalVideos: sidebarData.totalVideos,
      favoriteCount: sidebarData.favoriteCount,
      watchLaterCount: sidebarData.watchLaterCount,
      profile: profileRes.data ?? null,
      email: user.email ?? "",
      isSuperAdmin: Boolean(profileRes.data?.is_super_admin),
    });
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh()
      .catch(() => {
        // Already logged in refresh(); swallow here so the initial mount does
        // not raise an unhandled rejection.
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
    return () => {
      mounted.current = false;
    };
  }, [refresh]);

  return (
    <AppDataContext.Provider value={{ ...data, loading, refresh }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}