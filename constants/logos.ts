import { StaticImageData } from "next/image";
import BantuLogo from "@/public/bantu.png";
import GDSC from "@/public/gdsc.png";
import Shopee from "@/public/shopee.png";

export const organisationToLogo: { [key: string]: string | StaticImageData } = {
  bantu: BantuLogo,
  gdsc: GDSC,
  shopee: Shopee,
};
