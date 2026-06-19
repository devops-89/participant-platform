import {
  Montserrat,
  Poppins,
  Roboto_Slab,
  Science_Gothic,
} from "next/font/google";

export const science_gothic = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-science-gothic",
});

export const roboto = Roboto_Slab({
  weight: "variable",
  subsets: ["latin"],
});

export const montserrat = Montserrat({
  weight: "variable",
  subsets: ["latin"],
});
