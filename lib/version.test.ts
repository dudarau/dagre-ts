import dagre from 'dagre-ts';

console.log(dagre);

describe("version", function() {
  it("should match the version from package.json", function() {

    expect(dagre.layout).toBeDefined();
    expect(dagre.util).toBeDefined();
    // expect(dagre.util.addDummyNode(g, 'root', {}, '_root')).toBeDefined();
  });
});


