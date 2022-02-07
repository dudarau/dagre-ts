// @ts-ignore
// import * as normalize from './normalize';

// These are smoke tests to make sure the bundles look like they are working
// correctly.

// @ts-ignore
import dagre from '../dist/dagre-ts.esm.js';

const graphlib = dagre.graphlib;

describe("bundle", function() {
  it("exports dagre", function() {
    expect(typeof dagre).toBe("object");
    expect(typeof dagre.graphlib).toBe("object");
    expect(typeof dagre.layout).toBe("function");
    expect(typeof dagre.util).toBe("object");
    expect(typeof dagre.version).toBe("string");
  });

  it("can do trivial layout", function() {
    const g = new graphlib.Graph().setGraph({});
    g.setNode("a", { label: "a", width: 50, height: 100 });
    g.setNode("b", { label: "b", width: 50, height: 100 });
    g.setEdge("a", "b", { label: "ab", width: 50, height: 100 });

    dagre.layout(g);
    expect(g.node("a").x).toBeDefined();
    expect(g.node("a").y).toBeDefined();
    expect(g.node("a").x).toBeGreaterThanOrEqual(0);
    expect(g.node("a").y).toBeGreaterThanOrEqual(0);
    expect(g.edge("a", "b").x).toBeDefined();
    expect(g.edge("a", "b").y).toBeDefined();
    expect(g.edge("a", "b").x).toBeGreaterThanOrEqual(0);
    expect(g.edge("a", "b").y).toBeGreaterThanOrEqual(0);
  });
});
