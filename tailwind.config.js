const plugin = require("tailwindcss/plugin");

const variants = ["blue", "red", "yellow"];

// note: wrote this as a POC for ['Custom "Modes/Themes" (Ex. Dark Mode)' tailwindlabs/tailwindcss#6547](https://github.com/tailwindlabs/tailwindcss/discussions/6547#discussioncomment-1820291)
const customVariants = plugin(({ addVariant, e }) => {
  // couldn't get this working
  // addVariant("blue", ".blue &");
  variants.map((variant) =>
    addVariant(variant, ({ modifySelectors, separator }) => {
      modifySelectors(({ className }) => {
        const element = e(`${variant}${separator}${className}`);
        return `.${variant} .${element}`;
      });
    }),
  );
});

// done: find better name? allows to target all (list) elements except the first
// todo: Get tailwind.config.js [types](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/tailwindcss) working for plugins [tailwindlabs/tailwindcss#1077](https://github.com/tailwindlabs/tailwindcss/discussions/1077)
// note: mentioned in [tailwindlabs/tailwindcss/#2466](https://github.com/tailwindlabs/tailwindcss/discussions/2466#discussioncomment-1871027)
/** @type {import('tailwindcss/plugin')} */
const notFirst = plugin(({ addVariant, e }) => {
  addVariant("not-first", ({ modifySelectors, separator }) => {
    modifySelectors(({ className }) => {
      const element = e(`not-first${separator}${className}`);
      // return `.${element} > * + *`;
      return `.${element} > :not(:first-child)`;
    });
  });
});

/** @type {import('tailwindcss/plugin')} */
const externalLink = plugin(({ addComponents }) => {
  addComponents({
    ".with-icon-left > i": {
      marginLeft: "0.3rem",
      marginRight: "0.5rem",
    },
    ".with-icon-right > i": {
      marginLeft: "0.5rem",
      marginRight: "0.3rem",
    },
    // code by https://css.gg/external
    ".gg-external": {
      boxSizing: "border-box",
      position: "relative",
      display: "inline-block",
      transform: "scale(var(--ggs,1))",
      width: "12px",
      height: "12px",
      boxShadow: "-2px 2px 0 0,-4px -4px 0 -2px,4px 4px 0 -2px",
      marginLeft: "-2px",
      marginTop: "1px",
      "&:before,&:after": {
        content: `""`,
        display: "block",
        boxSizing: "border-box",
        position: "absolute",
        right: "-4px",
      },
      "&:before": {
        background: "currentColor",
        transform: "rotate(-45deg)",
        width: "12px",
        height: "2px",
        top: "1px",
      },
      "&:after": {
        width: "8px",
        height: "8px",
        borderRight: "2px solid",
        borderTop: "2px solid",
        top: "-4px",
      },
    },
  });
});

/** @type {import('tailwindcss/tailwind-config').TailwindConfig} */
module.exports = {
  // note: disable JIT until [prettier-plugin-tailwind#29](https://github.com/Acidic9/prettier-plugin-tailwind/issues/29)
  mode: process.env.NODE_ENV ? "jit" : undefined,
  content: ["./{app,content}/**/*.{ts,tsx}"],
  // done: don't remove (defaults to media) until light mode has been fixed (by me 🥲)!
  // todo: make theme toggling, based on class, default to auto (via code), be customizable but also revertible to auto ([theme-change](https://github.com/saadeghi/theme-change)) [tweet](https://mobile.twitter.com/chaphasilor/status/1472142142109851652) [discord](https://discord.com/channels/770287896669978684/771068344320786452/922672997754605568)
  // darkMode: "class",
  plugins: [
    // done: TailwindCSS Typography plugins' styles, or remove it 🤨 Wait for [tailwindcss-typography#102](https://github.com/tailwindlabs/tailwindcss-typography/issues/102) and [tailwindlabs/tailwindcss/discussions/5711](https://github.com/tailwindlabs/tailwindcss/discussions/5711)
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/line-clamp"),
    notFirst,
    externalLink,
  ],
  theme: {
    // screens: {
    //   md: "640px",
    //   lg: "1024px",
    //   xl: "1500px", // this is the "design resolution"
    // },
    extend: {
      // note: colors in extend to not override tailwinds colors (for now)
      colors: {
        skin: {
          accent: withOpacity("--color-accent"),
          text: withOpacity("--color-text"),
          "text-dark": withOpacity("--color-text-dark"),
          "text-darker": withOpacity("--color-text-darker"),
          "text-darkest": withOpacity("--color-text-darkest"),
          bg: withOpacity("--color-bg"),
          "bg-light": withOpacity("--color-bg-light"),
          "bg-lighter": withOpacity("--color-bg-lighter"),
          "bg-lightest": withOpacity("--color-bg-lightest"),
        },
        // from https://tailwind.simeongriggs.dev/?limegreen=B4CC4E&orange=FFC600&magenta=853A76&green=277647&darkpurple=4B0C3B
        // green has Lightness Minimum 10
        // orange Lightness Minimum 20
        brand: {
          green: {
            50: "#E4F6EB",
            100: "#C9EDD8",
            200: "#94DCB0",
            300: "#5ECA89",
            400: "#39AC67",
            500: "#277647",
            600: "#22673E",
            700: "#1C5432",
            800: "#174529",
            900: "#123620",
          },
          limegreen: {
            50: "#F8FAEF",
            100: "#F0F5DB",
            200: "#E1EAB8",
            300: "#D2E094",
            400: "#C3D670",
            500: "#B4CC4E",
            600: "#97AE32",
            700: "#728326",
            800: "#4C5719",
            900: "#262C0D",
          },
          orange: {
            50: "#FFF9E5",
            100: "#FFF4CC",
            200: "#FFE999",
            300: "#FFDE66",
            400: "#FFD333",
            500: "#FFC600",
            600: "#E0B000",
            700: "#C29800",
            800: "#A38000",
            900: "#856800",
          },
          magenta: {
            50: "#F6EAF3",
            100: "#ECD4E8",
            200: "#D8A6CE",
            300: "#C67CB7",
            400: "#B24D9E",
            500: "#853A76",
            600: "#6B2E5F",
            700: "#522448",
            800: "#35172F",
            900: "#1C0C19",
          },
          darkpurple: {
            50: "#F9DCF2",
            100: "#F3B4E3",
            200: "#E86EC9",
            300: "#DC23AE",
            400: "#951876",
            500: "#4B0C3B",
            600: "#3E0A31",
            700: "#2C0723",
            800: "#1F0518",
            900: "#0D020A",
          },
        },
      },
      // fontSize: {
      //   xl: "1.375rem", // 22px
      //   "2xl": "1.5625rem", // 25px
      //   "3xl": "1.875rem", // 30px
      //   "4xl": "2.5rem", // 40px
      //   "5xl": "3.125rem", // 50px
      //   "6xl": "3.75rem", // 60px
      //   "7xl": "4.375rem", // 70px
      // },
      spacing: {
        // 96: "24rem", just for reference
        144: "36rem",
        160: "40rem",
        172: "43rem",
        192: "48rem",
        "5vw": "5vw", // pull featured sections and navbar in the margin
        "8vw": "8vw", // positions hero img inside the margin
        "10vw": "10vw", // page margin
      },
      maxWidth: {
        "8xl": "96rem",
        "90vw": "90vw", // page margin
      },
      minHeight: {
        60: "15rem",
        "75vh": "75vh",
      },
      maxHeight: {
        "50vh": "50vh", // max height for medium size hero images
        "75vh": "75vh", // max height for giant size hero images
      },
      borderRadius: {
        // todo: write about the egg somewhere 🤙
        egg: "30% 70% 70% 30% / 30% 30% 70% 70%",
      },
      gridTemplateColumns: {
        layout:
          "1fr 1fr minmax(auto,7rem) minmax(auto,5rem) 20px minmax(auto,34.8rem) 20px minmax(auto,5rem) minmax(auto,7rem) 1fr 1fr",
      },
      keyframes: {
        eggout: {
          "0%": { borderRadius: ".5rem" },
        },
        eggin: {
          "100%": { borderRadius: ".5rem" },
        },
      },
      // typography: (theme) => {
      //   // some fontSizes return [size, props], others just size :/
      //   const fontSize = (size) => {
      //     const result = theme(`fontSize.${size}`);
      //     return Array.isArray(result) ? result[0] : result;
      //   };
      //   const breakout = {
      //     marginLeft: 0,
      //     marginRight: 0,
      //     gridColumn: "2 / span 10",
      //   };
      //   return {
      //     // DEFAULT only holds shared stuff and not the things that change
      //     // between light/dark
      //     DEFAULT: {
      //       css: [
      //         {
      //           "> *": {
      //             gridColumn: "1 / -1",
      //             [`@media (min-width: ${theme("screens.lg")})`]: {
      //               gridColumn: "3 / span 8",
      //             },
      //           },
      //           p: {
      //             marginTop: theme("spacing.8"),
      //             marginBottom: 0,
      //             fontSize: fontSize("lg"),
      //           },
      //           "> div": {
      //             marginTop: theme("spacing.8"),
      //             marginBottom: 0,
      //             fontSize: fontSize("lg"),
      //           },
      //           a: {
      //             textDecoration: "none",
      //           },
      //           "a:hover,a:focus": {
      //             textDecoration: "underline",
      //             outline: "none",
      //           },
      //           strong: {
      //             fontWeight: theme("fontWeight.medium"),
      //             fontSize: fontSize("lg"),
      //           },
      //           hr: {
      //             marginTop: theme("spacing.8"),
      //             marginBottom: theme("spacing.16"),
      //           },
      //           pre: {
      //             color: "var(--base05)",
      //             backgroundColor: "var(--base00)",
      //             position: "relative",
      //             marginTop: theme("spacing.8"),
      //             marginBottom: 0, // theme("spacing.8"),
      //             marginLeft: `-${theme("spacing.10vw")}`,
      //             marginRight: `-${theme("spacing.10vw")}`,
      //             padding: theme("spacing.8"),
      //             borderRadius: 0,
      //             [`@media (min-width: ${theme("screens.lg")})`]: {
      //               borderRadius: theme("borderRadius.lg"),
      //               ...breakout,
      //             },
      //           },
      //           ".embed": {
      //             position: "relative",
      //             marginLeft: "-10vw",
      //             marginRight: "-10vw",
      //             [`@media (min-width: ${theme("screens.lg")})`]: {
      //               ...breakout,
      //             },
      //           },
      //           ".embed > div": {
      //             height: "0px",
      //           },
      //           ".embed > div > iframe": {
      //             height: "100% !important",
      //             width: "100% !important",
      //             top: "0",
      //             left: "0",
      //             position: "absolute",
      //             border: "none",
      //             borderRadius: "0 !important",
      //             [`@media (min-width: ${theme("screens.lg")})`]: {
      //               borderRadius: "0.5rem !important",
      //             },
      //           },
      //           ul: {
      //             marginTop: theme("spacing.8"),
      //             marginBottom: 0,
      //           },
      //           ol: {
      //             marginTop: theme("spacing.8"),
      //             marginBottom: 0,
      //           },
      //           "h1, h2, h3, h4, h5, h6": {
      //             marginTop: theme("spacing.8"),
      //             marginBottom: 0,
      //             fontWeight: theme("fontWeight.normal"),
      //             [`@media (min-width: ${theme("screens.lg")})`]: {
      //               fontWeight: theme("fontWeight.medium"),
      //             },
      //           },
      //           // tailwind doesn't stick to this property order, so we can't make 'h3' overrule 'h2, h3, h4'
      //           "h1, h2": {
      //             fontSize: fontSize("2xl"),
      //             marginTop: theme("spacing.20"),
      //             marginBottom: 0, // theme("spacing.10"),
      //             [`@media (min-width: ${theme("screens.lg")})`]: {
      //               fontSize: fontSize("3xl"),
      //             },
      //           },
      //           h3: {
      //             fontSize: fontSize("xl"),
      //             marginTop: theme("spacing.16"),
      //             marginBottom: 0, // theme("spacing.10"),
      //             [`@media (min-width: ${theme("screens.lg")})`]: {
      //               fontSize: fontSize("2xl"),
      //             },
      //           },
      //           "h4, h5, h6": {
      //             fontSize: fontSize("lg"),
      //             [`@media (min-width: ${theme("screens.lg")})`]: {
      //               fontSize: fontSize("xl"),
      //             },
      //           },
      //           img: {
      //             // images are wrapped in <p>, which already has margin
      //             marginTop: 0,
      //             marginBottom: 0,
      //             borderRadius: theme("borderRadius.lg"),
      //           },
      //           blockquote: {
      //             fontWeight: theme("fontWeight.normal"),
      //             border: "none",
      //             borderRadius: theme("borderRadius.lg"),
      //             padding: theme("spacing.8"),
      //             marginTop: theme("spacing.10"),
      //             marginBottom: 0,
      //           },
      //           "blockquote > :first-child": {
      //             marginTop: 0,
      //           },
      //         },
      //       ],
      //     },
      //     // use prose-light instead of default, so it's easier to see theme differences
      //     light: {
      //       css: [
      //         {
      //           color: theme("colors.gray.500"),
      //           a: {
      //             color: theme("colors.team.current"),
      //           },
      //           strong: {
      //             color: theme("colors.black"),
      //           },
      //           hr: {
      //             borderColor: theme("colors.gray.200"),
      //           },
      //           code: {
      //             color: theme("colors.gray.800"),
      //           },
      //           "h1, h2, h3, h4, h5, h6": {
      //             color: theme("colors.black"),
      //           },
      //           blockquote: {
      //             color: theme("colors.gray.500"),
      //             backgroundColor: theme("colors.gray.100"),
      //           },
      //           "thead, tbody tr": {
      //             borderBottomColor: theme("colors.gray.200"),
      //           },
      //         },
      //       ],
      //     },
      //     dark: {
      //       css: [
      //         {
      //           color: theme("colors.blueGray.500"),
      //           a: {
      //             color: theme("colors.indigo.500"),
      //           },
      //           strong: {
      //             color: theme("colors.white"),
      //           },
      //           hr: {
      //             borderColor: theme("colors.gray.600"),
      //           },
      //           code: {
      //             color: theme("colors.gray.100"),
      //           },
      //           "h1, h2, h3, h4, h5, h6": {
      //             color: theme("colors.white"),
      //           },
      //           blockquote: {
      //             color: theme("colors.blueGray.500"),
      //             backgroundColor: theme("colors.gray.800"),
      //           },
      //           "thead, tbody tr": {
      //             borderBottomColor: theme("colors.gray.600"),
      //           },
      //         },
      //       ],
      //     },
      //   };
      // },
    },
  },
};

function withOpacity(variable) {
  return ({ opacityValue }) => {
    if (opacityValue === undefined) {
      return `rgb(var(${variable}))`;
    }
    return `rgb(var(${variable}) / ${opacityValue})`;
  };
}
