import { createRequire } from "module";
import path from "path";

const require = createRequire(import.meta.url);
const __dirname = new URL(".", import.meta.url).pathname;

const outputPath = path.join(
  __dirname,
  "../streamlit_monaco_yaml/frontend-build",
);

export default {
  context: path.resolve(__dirname, "src"),
  entry: {
    index: "./index",
  },
  output: {
    filename: "[name].js",
    clean: true,
    path: outputPath,
  },
  resolve: {
    extensions: ["*", ".mjs", ".js", ".jsx", ".tsx", ".ts"],
    fullySpecified: false,
    fallback: {
      buffer: require.resolve("buffer"),
    },
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        // Based on https://github.com/microsoft/monaco-editor/blob/3de27fe12d6ac1bf6604c195edeb1eb945bdc669/samples/browser-esm-webpack-typescript-react/webpack.config.js#L31
        test: /\.(js|jsx|tsx|ts)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve("babel-loader"),
            options: {
              presets: [
                "@babel/preset-env",
                "@babel/preset-typescript",
                "@babel/preset-react",
              ],
            },
          },
        ],
      },
      {
        // https://github.com/graphql/graphql-js/issues/2721#issuecomment-723008284
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.ttf$/,
        type: "asset",
      },
    ],
  },
  devServer: {
    static: {
      directory: "./public",
    },
    port: 3001,
    hot: false,
  },
};
