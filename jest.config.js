module.exports = {
  transform: {
      "^.+\\.tsx?$": "ts-jest",
  },
  collectCoverageFrom: [
    "src/*.{ts,tsx}"
  ],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  testPathIgnorePatterns: ["/lib/", "/node_modules/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: true,
};