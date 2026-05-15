// tikkieteddielab: audited reference colors used to avoid exact CI color matches.
export const appBrandPalette = {
  marineBlue: "#0D6F8F",
  seaMist: "#76B8C8",
  seaSoft: "#E3F3F5",
  blondeGray: "#B7B4AA",
  blondeSoft: "#ECE9E1",
  blondeWash: "#F4F2EC",
  blondeLine: "#D7D2C8",
  marineInk: "#2E3840",
  marineMuted: "#667276",
};

export const auditedBrandColors = [
  { company: "PTT", market: "Thailand energy", hex: "#1C75BC" },
  { company: "PTT", market: "Thailand energy", hex: "#26275F" },
  { company: "Toyota", market: "Japan/US/Global automotive", hex: "#EB0A1E" },
  { company: "Toyota", market: "Japan/US/Global automotive", hex: "#58595B" },
  { company: "Tesla", market: "US/Global automotive", hex: "#E31937" },
  { company: "Tesla", market: "US/Global automotive", hex: "#E82127" },
  { company: "BYD", market: "China/Global automotive", hex: "#EC1C24" },
  { company: "Honda", market: "Japan/US/Global automotive", hex: "#CC0000" },
  { company: "BMW", market: "Europe/US/Global automotive", hex: "#0166B1" },
  { company: "BMW", market: "Europe/US/Global automotive", hex: "#1C69D4" },
  { company: "BMW", market: "Europe/US/Global automotive", hex: "#6F6F6F" },
  { company: "BMW", market: "Europe/US/Global automotive", hex: "#A8A8A8" },
  { company: "Mercedes-Benz", market: "Europe/US/Global automotive", hex: "#A6A6A6" },
  { company: "Volkswagen", market: "Europe/China/US automotive", hex: "#001E50" },
  { company: "Chevron", market: "US/Global energy", hex: "#0054A4" },
  { company: "Chevron", market: "US/Global energy", hex: "#01AEF0" },
  { company: "Chevron", market: "US/Global energy", hex: "#5F6A72" },
  { company: "Chevron", market: "US/Global energy", hex: "#2459A9" },
  { company: "Shell", market: "Europe/US/Asia energy", hex: "#FBCE07" },
  { company: "Shell", market: "Europe/US/Asia energy", hex: "#DD1D21" },
  { company: "ExxonMobil", market: "US/Global energy", hex: "#ED1B2F" },
  { company: "BP", market: "Europe/US/Global energy", hex: "#009B00" },
  { company: "TotalEnergies", market: "Europe/Global energy", hex: "#ED1B2E" },
];

export const paletteAuditSummary = {
  scope:
    "Exact HEX collision check against researched public CI/logo color references for major energy, oil, transport, and automotive companies in Thailand, the United States, China, Japan, and Europe. This is not a universal registry of every company.",
  checkedAt: "2026-05-15",
};

export const findExactPaletteCollisions = () => {
  const appColors = Object.entries(appBrandPalette).map(([name, hex]) => ({
    name,
    hex: hex.toUpperCase(),
  }));
  const auditedColors = auditedBrandColors.map((item) => ({
    ...item,
    hex: item.hex.toUpperCase(),
  }));

  return appColors.flatMap((appColor) =>
    auditedColors
      .filter((brandColor) => brandColor.hex === appColor.hex)
      .map((brandColor) => ({
        appColor: appColor.name,
        appHex: appColor.hex,
        company: brandColor.company,
        market: brandColor.market,
      })),
  );
};
