// @ts-ignore
import dagre from '../dist/index.umd.js';

describe("version", function() {
  it("should match the version from package.json", function() {
    console.log(dagre)
    expect(dagre.layout).toBeDefined();
    expect(dagre.util).toBeDefined();
  });
});


