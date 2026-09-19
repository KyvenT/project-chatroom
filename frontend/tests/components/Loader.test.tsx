import { describe, expect, it } from "vitest";
import { Loader } from "../../src/components/Loader";
import { renderWithProviders } from "../renderWithProviders";

describe("Loader", () => {
  it("renders a spinner element", () => {
    const { container } = renderWithProviders(<Loader />);
    expect(container.querySelector("span")).toBeInTheDocument();
  });
});
