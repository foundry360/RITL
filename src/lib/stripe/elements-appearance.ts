import type { Appearance } from "@stripe/stripe-js";

export const stripeElementsFontFamily =
  "Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

export const stripeElementsFonts = [
  {
    cssSrc:
      "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap",
  },
];

export const stripeElementsAppearance: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#c7cbd3",
    colorBackground: "#16181d",
    colorText: "#edeff3",
    colorTextSecondary: "#a7adb8",
    colorTextPlaceholder: "#6e7480",
    colorDanger: "#df1b41",
    borderRadius: "4px",
    fontFamily: stripeElementsFontFamily,
    fontSizeBase: "14px",
    fontWeightNormal: "400",
    accessibleColorOnColorPrimary: "#000000",
    tabIconSelectedColor: "#000000",
    tabLogoSelectedColor: "dark",
  },
  rules: {
    ".Input": {
      border: "1px solid #2b2f36",
      boxShadow: "none",
      fontFamily: stripeElementsFontFamily,
      color: "#edeff3",
    },
    ".Input:focus": {
      border: "1px solid rgba(199, 203, 211, 0.5)",
      boxShadow: "none",
    },
    ".Input::placeholder": {
      fontFamily: stripeElementsFontFamily,
      color: "#6e7480",
    },
    ".Label": {
      color: "#a7adb8",
      fontSize: "10px",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      fontFamily: stripeElementsFontFamily,
    },
    ".Tab": {
      fontFamily: stripeElementsFontFamily,
      color: "#a7adb8",
    },
    ".Tab--selected": {
      fontFamily: stripeElementsFontFamily,
      color: "#000000",
    },
    ".TabLabel--selected": {
      fontFamily: stripeElementsFontFamily,
      color: "#000000",
    },
    ".TabLabel": {
      fontFamily: stripeElementsFontFamily,
    },
    ".Block": {
      fontFamily: stripeElementsFontFamily,
    },
    ".Text": {
      fontFamily: stripeElementsFontFamily,
    },
    ".CheckboxLabel": {
      fontFamily: stripeElementsFontFamily,
    },
    ".Link": {
      fontSize: "0",
      lineHeight: "0",
      margin: "0",
      padding: "0",
      border: "none",
      boxShadow: "none",
      color: "transparent",
    },
    ".PickerItem": {
      fontFamily: stripeElementsFontFamily,
    },
    ".RedirectText": {
      fontFamily: stripeElementsFontFamily,
    },
  },
};
