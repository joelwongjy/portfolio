import { StaticImageData } from "next/image";
import BantuLogo from "@/public/bantu.svg";
import GDSC from "@/public/gdsc.png";
import Shopee from "@/public/shopee.png";
import Propel from "@/public/propel.svg";
import NUS from "@/public/nus.png";
import Kisi from "@/public/kisi.svg";
import TikTok from "@/public/tiktok.svg";
import TikTokWhite from "@/public/tiktok-white.svg";

export const organisationToLogo: { [key: string]: string | StaticImageData } = {
  bantu: BantuLogo,
  gdsc: GDSC,
  shopee: Shopee,
  propel: Propel,
  kisi: Kisi,
  nus: NUS,
  tiktok: TikTok,
  tiktokWhite: TikTokWhite,
};
