import Image from "next/image";

import { organisationToLogo } from "@/constants/logos";

// Proper names for the organisation keys used in the data files.
const NAMES: Record<string, string> = {
  tiktok: "TikTok",
  kisi: "Kisi",
  propel: "Propel",
  shopee: "Shopee",
  bantu: "Bantu",
  gdsc: "GDSC NUS",
  nus: "NUS",
};

export const orgName = (organisation: string) =>
  NAMES[organisation] ??
  organisation.charAt(0).toUpperCase() + organisation.slice(1);

export const OrganisationLogo = ({ organisation }: { organisation: string }) => {
  const whiteLogo = organisationToLogo[`${organisation}White`];
  const logo = organisationToLogo[organisation];
  if (whiteLogo) {
    return (
      <Image
        src={whiteLogo}
        alt={orgName(organisation)}
        className="h-7 w-auto max-w-[7rem] object-contain"
      />
    );
  }
  if (logo) {
    return (
      <span className="inline-flex rounded-lg bg-white/95 px-2 py-1.5 shadow-sm">
        <Image
          src={logo}
          alt={orgName(organisation)}
          className="h-5 w-auto max-w-[6rem] object-contain"
        />
      </span>
    );
  }
  return (
    <span
      className="text-sm font-bold uppercase tracking-wider"
      style={{ color: "var(--livery)" }}
    >
      {orgName(organisation)}
    </span>
  );
};
