const expect from "../test/chai").expect;

describe("version", function() {
  it("should match the version from package.json", function() {
    const packageVersion from "../package.json").version;
    expect(require("../dist/dagre-ts").version).toBe(packageVersion);
  });
});
