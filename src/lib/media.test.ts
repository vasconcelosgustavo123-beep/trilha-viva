import { describe, it, expect } from "vitest";
import { toEmbedUrl } from "./media";

describe("toEmbedUrl", () => {
  it("converts youtube watch links", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });
  it("converts youtu.be links", () => {
    expect(toEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });
});
