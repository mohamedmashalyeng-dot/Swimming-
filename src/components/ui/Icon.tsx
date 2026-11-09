import {
  Anchor, AlertTriangle, Baby, CircleDot, Feather, Flag, Footprints, GlassWater, Glasses, HardHat, Heart,
  Layers, LifeBuoy, MoveHorizontal, Package, PlusCircle, RectangleHorizontal, Repeat, RotateCcw, ShieldCheck,
  Shirt, Smile, Trophy, User, Users, Waves, Wind, Zap, Star, Dumbbell, Timer, Sun, Droplets, type LucideIcon,
} from "lucide-react";

/** Icons the admin can choose by name (kept as a fixed whitelist). */
export const ICONS: Record<string, LucideIcon> = {
  anchor: Anchor, "alert-triangle": AlertTriangle, baby: Baby, "circle-dot": CircleDot, feather: Feather,
  flag: Flag, footprints: Footprints, "glass-water": GlassWater, glasses: Glasses, "hard-hat": HardHat,
  heart: Heart, layers: Layers, "life-buoy": LifeBuoy, "move-horizontal": MoveHorizontal, package: Package,
  "plus-circle": PlusCircle, "rectangle-horizontal": RectangleHorizontal, repeat: Repeat, "rotate-ccw": RotateCcw,
  "shield-check": ShieldCheck, shirt: Shirt, smile: Smile, trophy: Trophy, user: User, users: Users,
  waves: Waves, wind: Wind, zap: Zap, star: Star, dumbbell: Dumbbell, timer: Timer, sun: Sun, droplets: Droplets,
};

export const ICON_NAMES = Object.keys(ICONS);

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] ?? Waves;
  return <C className={className} aria-hidden="true" />;
}
