import {
  BookOpen,
  Briefcase,
  Clock,
  Code2,
  Cpu,
  Film,
  GraduationCap,
  Heart,
  Music,
  Palette,
  Sparkles,
  Utensils,
  Gamepad2,
  Plane,
  Brain,
  Camera,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  code: Code2,
  sparkles: Sparkles,
  palette: Palette,
  book: BookOpen,
  briefcase: Briefcase,
  clock: Clock,
  cpu: Cpu,
  film: Film,
  grad: GraduationCap,
  heart: Heart,
  music: Music,
  utensils: Utensils,
  gamepad: Gamepad2,
  plane: Plane,
  brain: Brain,
  camera: Camera,
};

export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS);

export const CATEGORY_COLORS = [
  "#e6b34c",
  "#e8895a",
  "#e5484d",
  "#e88ba7",
  "#8b7bd8",
  "#5aa2d8",
  "#6ac5c2",
  "#4fb477",
  "#a3b55f",
  "#c7a1d9",
];