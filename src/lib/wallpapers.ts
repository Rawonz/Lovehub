import type { Wallpaper } from '@/types/database';

/**
 * Background presets for the couple's shared in-app wallpaper. Applied as a
 * fixed, subtle backdrop behind the whole authenticated app (see AppShell),
 * so keep these soft — cards and text sit on top of them.
 */
export const WALLPAPER_BACKGROUNDS: Record<Wallpaper, string> = {
  default:
    'radial-gradient(120% 80% at 50% -10%, hsl(346 80% 92% / 0.35), transparent 60%)',
  sunset:
    'radial-gradient(120% 90% at 20% -10%, hsl(18 92% 78% / 0.45), transparent 55%), radial-gradient(100% 80% at 100% 0%, hsl(340 85% 75% / 0.35), transparent 60%)',
  ocean:
    'radial-gradient(120% 90% at 80% -10%, hsl(195 85% 80% / 0.45), transparent 55%), radial-gradient(100% 80% at 0% 20%, hsl(210 80% 78% / 0.3), transparent 60%)',
  blossom:
    'radial-gradient(120% 90% at 50% -10%, hsl(330 85% 88% / 0.5), transparent 55%), radial-gradient(90% 70% at 90% 30%, hsl(280 70% 88% / 0.3), transparent 60%)',
  midnight:
    'radial-gradient(120% 90% at 50% -10%, hsl(250 60% 25% / 0.5), transparent 55%), radial-gradient(90% 70% at 100% 100%, hsl(340 60% 25% / 0.35), transparent 60%)',
  forest:
    'radial-gradient(120% 90% at 20% -10%, hsl(150 55% 78% / 0.4), transparent 55%), radial-gradient(90% 70% at 100% 20%, hsl(90 50% 78% / 0.3), transparent 60%)',
};

export const WALLPAPER_OPTIONS: Wallpaper[] = [
  'default',
  'sunset',
  'ocean',
  'blossom',
  'midnight',
  'forest',
];
