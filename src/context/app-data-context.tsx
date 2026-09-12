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
import { useAuth } from "@/context/auth-context";
import { loadSidebarData } from "@/lib/sidebar";
import { fetchAllCategories, fetchAllTags } from "@/lib/library";
import { fetchAllPlaylists } from "@/lib/playlists";
import type {
  Category,
  Tag,
  CategoryWithCount,
  TagWithCount,
  PlaylistWithCount,
  Profile,
} from "@/types/database";

interface AppData {
  categories: Category[];
  categoryCounts: CategoryWithCount[];
  tags: Tag[];
  pinnedTags: TagWithCount[];
  playlists: PlaylistWithCount[];
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
  playlists: [],
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
    playlists: [],
    totalVideos: 0,
    favoriteCount: 0,
    watchLaterCount: 0,
    profile: null,
    email: "",
    isSuperAdmin: false,
  });
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);
  const { user } = useAuth();

  // The actual data fetch, parameterised by user id so the initial load can be
  // driven directly off the subscribed auth user (see effect below) instead of
  // re-reading the session, which can race an in-flight login.
  const load = useCallback(async (userId: string) => {
    // A failure here must not degrade into a silently empty sidebar — that
    // renders as "No categories yet" and looks like real, missing data.
    const [sidebarData, categories, tags, playlists, profileRes] = await Promise.all([
      loadSidebarData(supabase, userId),
      fetchAllCategories(supabase, userId),
      fetchAllTags(supabase, userId),
      fetchAllPlaylists(supabase, userId),
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
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
      playlists,
      totalVideos: sidebarData.totalVideos,
      favoriteCount: sidebarData.favoriteCount,
      watchLaterCount: sidebarData.watchLaterCount,
      profile: profileRes.data ?? null,
      email: user?.email ?? "",
      isSuperAdmin: Boolean(profileRes.data?.is_super_admin),
    });
  }, [user?.email]);

  // Public no-arg re-fetch used after mutations elsewhere in the tree. It runs
  // only within authenticated routes, so resolving the user id via the auth
  // context (falling back to the session) is enough here.
  const refresh = useCallback(async () => {
    const userId = user?.id;
    if (!userId) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;
      return load(session.user.id);
    }
    return load(userId);
  }, [load, user?.id]);

  const userId = user?.id;
  useEffect(() => {
    // The provider only mounts once a user is signed in, but the initial
    // `getUser()`/session read can still race an in-flight login and report no
    // user, which previously left the sidebar empty until a page refresh.
    // Driving the fetch off the subscribed auth user id guarantees data loads
    // once the login has actually settled, and re-loads on account switches.
    if (!userId) return;
    mounted.current = true;
    setLoading(true);
    load(userId)
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
  }, [load, userId]);

  return (
    <AppDataContext.Provider value={{ ...data, loading, refresh }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}