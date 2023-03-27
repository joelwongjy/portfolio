import { StaticImageData } from "next/image";
import BantuLogo from "@/public/bantu.png";
import GDSC from "@/public/gdsc.png";
import Shopee from "@/public/shopee.png";
import Propel from "@/public/propel.svg";

export const organisationToLogo: { [key: string]: string | StaticImageData } = {
  bantu: BantuLogo,
  gdsc: GDSC,
  shopee: Shopee,
  propel: Propel,
};
