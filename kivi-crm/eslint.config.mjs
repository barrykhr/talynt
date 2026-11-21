import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Rendering user-supplied HTML is never allowed in this app.
      "react/no-danger": "error",
    },
  },
  { ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts"] },
];

export default eslintConfig;
