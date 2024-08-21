import typescript from "@rollup/plugin-typescript"
import terser from "@rollup/plugin-terser"

/** @type {import('rollup').RollupOptions} */
const options = {
    input: {
        index: "src/index.ts",
        prisma: "src/prisma.ts"
    },
    output: {
        dir: "dist",
        entryFileNames: "bundle-[name].js",
        format: "esm",
        sourcemap: true,
    },
    plugins: [typescript(), terser()]
}

export default options