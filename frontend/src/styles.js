// Shared style tokens across the whole app -- import from here rather
// than repeating hex codes on every page, so the visual identity
// stays consistent and is easy to adjust in one place later.

export const colors = {

  ink: "#304C5C",        // vintage navy, headings & nav

  accent: "#D29B45",     // ochre, CTAs & highlights

  accentSoft: "#F8EEDB",

  warn: "#B97832",

  warnBg: "#FFF1D6",

  good: "#5C7958",

  goodBg: "#E5EFE2",

  bad: "#B95F4B",

  badBg: "#F8E5DF",

  paper: "#F4E9D3",      // warm postcard cream

  border: "#DED2BC",

  text: "#30404A",

  textMuted: "#6F7470",

};


// Fonts
export const fonts = {

  // Fancy serif font for ALL headings and TripSync logo
  heading: "'Cormorant Garamond', Georgia, serif",

  // Keep small/normal text clean and readable
  body: "'Segoe UI', system-ui, sans-serif",

};


// Main page
export const page = {

  fontFamily: fonts.body,

  maxWidth: "1000px",

  margin: "0 auto",

  padding: "24px 24px 64px 24px",

  color: colors.text,

};


// ALL headings
export const heading = {

  fontFamily: fonts.heading,

  color: colors.ink,

  fontWeight: 600,

};


// Section headings
export const sectionTitle = {

  ...heading,

  fontSize: "24px",

  marginBottom: "12px",

  borderBottom: `1px solid ${colors.border}`,

  paddingBottom: "6px",

};


// TripSync logo
export const logo = {

  fontFamily: fonts.heading,

  fontSize: "32px",

  fontWeight: 600,

  color: colors.ink,

  letterSpacing: "0.3px",

};


// Card
export const card = {

  background: "white",

  border: `1px solid ${colors.border}`,

  borderRadius: "10px",

  padding: "18px",

  marginBottom: "16px",

};


// Buttons
export const button = {

  base: {

    padding: "10px 18px",

    borderRadius: "8px",

    border: "none",

    cursor: "pointer",

    fontSize: "14px",

    fontWeight: 600,

    fontFamily: fonts.body,

  },

  primary: {

    background: colors.accent,

    color: "white",

  },

  secondary: {

    background: "white",

    color: colors.ink,

    border: `1px solid ${colors.ink}`,

  },

};


// Inputs
export const input = {

  width: "100%",

  padding: "10px 12px",

  borderRadius: "6px",

  border: `1px solid ${colors.border}`,

  fontSize: "14px",

  fontFamily: fonts.body,

  marginBottom: "14px",

  boxSizing: "border-box",

};


// Labels
export const label = {

  display: "block",

  fontSize: "13px",

  fontWeight: 600,

  color: colors.textMuted,

  marginBottom: "6px",

};