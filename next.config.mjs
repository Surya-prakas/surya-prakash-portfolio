import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // @splinetool/react-spline@4 declares only an "import" condition for its
    // "." export (no "require", no "default"), so a static ESM import resolves
    // but next/dynamic's import() — resolved through the CJS condition set —
    // fails with "Package path . is not exported". Alias straight at the ESM
    // build to bypass the export map. Remove once upstream adds a "default".
    config.resolve.alias["@splinetool/react-spline$"] = path.join(
      process.cwd(),
      "node_modules/@splinetool/react-spline/dist/react-spline.js"
    );
    return config;
  },
};

export default nextConfig;
