import { z } from "zod";

export const youtubeUrlSchema = z
  .string()
  .trim()
  .min(1, "Paste a YouTube URL")
  .max(2048);

export const categoryNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(40, "Keep the name under 40 characters");

export const tagNameSchema = z
  .string()
  .trim()
  .min(1, "Tag is required")
  .max(40, "Keep the tag under 40 characters");

export const personalNotesSchema = z.string().max(4000).nullable().optional();

export const watchStatusSchema = z.enum(["unwatched", "watching", "watched"]);

export const videoIdSchema = z.string().uuid();

export const categoryIdSchema = z.string().uuid();

export const saveVideoSchema = z.object({
  youtubeUrl: youtubeUrlSchema,
  categoryIds: z.array(categoryIdSchema).max(30).default([]),
  tagNames: z.array(tagNameSchema).max(30).default([]),
  personalNotes: personalNotesSchema,
  isFavorite: z.boolean().default(false),
  isWatchLater: z.boolean().default(false),
  watchStatus: watchStatusSchema.default("unwatched"),
});

export const updateVideoOrganizationSchema = z.object({
  videoId: videoIdSchema,
  categoryIds: z.array(categoryIdSchema).max(30).default([]),
  tagNames: z.array(tagNameSchema).max(30).default([]),
});

export const updateVideoNotesSchema = z.object({
  videoId: videoIdSchema,
  personalNotes: personalNotesSchema,
});

export const updateVideoFlagsSchema = z.object({
  videoId: videoIdSchema,
  isFavorite: z.boolean().optional(),
  isWatchLater: z.boolean().optional(),
  watchStatus: watchStatusSchema.optional(),
});

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  parentId: z.string().uuid().optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .nullable(),
  icon: z.string().max(32).optional().nullable(),
  description: z.string().max(300).optional().nullable(),
});

export const renameCategorySchema = z.object({
  id: categoryIdSchema,
  name: categoryNameSchema,
  parentId: z.string().uuid().optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .nullable(),
  icon: z.string().max(32).optional().nullable(),
  description: z.string().max(300).optional().nullable(),
});

export const deleteCategorySchema = z.object({ id: categoryIdSchema });

export const playlistNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(60, "Keep the name under 60 characters");

export const createPlaylistSchema = z.object({
  name: playlistNameSchema,
  description: z.string().max(300).nullable().optional(),
});

export const updatePlaylistSchema = z.object({
  id: categoryIdSchema,
  name: playlistNameSchema,
  description: z.string().max(300).nullable().optional(),
});

export const deletePlaylistSchema = z.object({ id: categoryIdSchema });

export const addToPlaylistSchema = z.object({
  playlistId: categoryIdSchema,
  videoId: videoIdSchema,
});

export const removeFromPlaylistSchema = addToPlaylistSchema;

export const reorderPlaylistSchema = z.object({
  playlistId: categoryIdSchema,
  videoIds: z.array(videoIdSchema).min(1).max(500),
});

export const createTagSchema = z.object({ name: tagNameSchema });

export const pinTagSchema = z.object({ id: categoryIdSchema, isPinned: z.boolean() });

export const updateProfileSchema = z.object({
  displayName: z.string().trim().max(60).nullable().optional(),
  defaultSort: z.string().max(32).optional(),
  cardDensity: z.enum(["cozy", "comfortable", "compact", "list"]).optional(),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
