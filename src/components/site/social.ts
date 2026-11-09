import { FacebookIcon, InstagramIcon, TiktokIcon, XIcon, YoutubeIcon } from "@/components/ui/SocialIcons";
import type { SiteSettings } from "@/lib/types";

export function socialLinks(s: SiteSettings) {
  return [
    { href: s.facebook_url, label: "Facebook", Icon: FacebookIcon },
    { href: s.instagram_url, label: "Instagram", Icon: InstagramIcon },
    { href: s.youtube_url, label: "YouTube", Icon: YoutubeIcon },
    { href: s.tiktok_url, label: "TikTok", Icon: TiktokIcon },
    { href: s.x_url, label: "X", Icon: XIcon },
  ].filter((x) => !!x.href) as { href: string; label: string; Icon: typeof FacebookIcon }[];
}
