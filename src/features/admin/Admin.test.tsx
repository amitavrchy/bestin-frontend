// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it } from "vitest";
import { BookEditor } from "./AdminPages";
afterEach(cleanup);
function renderEditor() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <BookEditor isNew />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
it("requires a book file before upload", async () => {
  renderEditor();
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "A book" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Upload book" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Choose a book file first.",
  );
});
it("rejects an unsupported dropped book", async () => {
  renderEditor();
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "A book" },
  });
  const zone = screen.getByText("Drop your book here").closest("label")!;
  fireEvent.drop(zone, {
    dataTransfer: { files: [new File(["data"], "book.exe")] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Upload book" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Choose a PDF, EPUB, TXT or Markdown file.",
  );
});
