import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { JobApplicationFormData } from "../../molecules/JobApplicationFormFields/jobApplicationFormSchema";
import { AddJobApplicationModal } from "./AddJobApplicationModal";

type ModalProps = ComponentProps<typeof AddJobApplicationModal>;

function renderModal(overrides: Partial<ModalProps> = {}) {
  const props: ModalProps = {
    hasCreateError: false,
    isCreating: false,
    onClose: vi.fn(),
    onCreate: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  const rendered = render(<AddJobApplicationModal {...props} />);

  return { ...rendered, props };
}

describe("AddJobApplicationModal", () => {
  afterEach(cleanup);

  it("groups the cancel and primary submission actions", () => {
    renderModal();

    const actions = screen.getByRole("group", {
      name: "Add application actions",
    });

    expect(within(actions).getByRole("button", { name: "Cancel" })).toBeVisible();
    expect(
      within(actions).getByRole("button", { name: "Add application" }),
    ).toBeVisible();
  });

  it("focuses Company after native showModal moves focus", () => {
    const showModal = vi
      .spyOn(HTMLDialogElement.prototype, "showModal")
      .mockImplementation(function showModalLikeBrowser(
        this: HTMLDialogElement,
      ) {
        this.open = true;
        this.querySelector("button")?.focus();
      });

    try {
      renderModal();
      expect(screen.getByLabelText("Company")).toHaveFocus();
    } finally {
      showModal.mockRestore();
    }
  });

  it("opens with a complete empty Saved draft and Company focused", () => {
    renderModal();

    expect(screen.getByRole("dialog", { name: "Add application" })).toBeVisible();
    expect(screen.getByLabelText("Company")).toHaveValue("");
    expect(screen.getByLabelText("Position")).toHaveValue("");
    expect(screen.getByLabelText("Job URL")).toHaveValue("");
    expect(screen.getByLabelText("Status")).toHaveValue("saved");
    expect(screen.getByLabelText("Applied date")).toHaveValue("");
    expect(screen.getByLabelText("Notes")).toHaveValue("");
    expect(screen.queryByLabelText("Resume version")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Company")).toHaveFocus();
    expect(screen.getByRole("button", { name: "Add application" }).closest("form"))
      .toHaveAttribute("novalidate");
  });

  it.each(["Cancel", "Close dialog"])(
    "discards the draft through %s",
    async (buttonName) => {
      const user = userEvent.setup();
      const { props, unmount } = renderModal();

      await user.type(screen.getByLabelText("Company"), "Unsaved draft");
      await user.click(screen.getByRole("button", { name: buttonName }));

      expect(props.onCreate).not.toHaveBeenCalled();
      await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
      unmount();
    },
  );

  it("discards the draft through Escape when idle", async () => {
    const { props, unmount } = renderModal();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(props.onCreate).not.toHaveBeenCalled();
    await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
    unmount();
  });

  it("submits the normalized complete draft and closes after success", async () => {
    const user = userEvent.setup();
    const onCreate = vi
      .fn<(input: JobApplicationFormData) => Promise<unknown>>()
      .mockResolvedValue(undefined);
    const { props, unmount } = renderModal({ onCreate });

    await user.type(screen.getByLabelText("Company"), "  Acme  ");
    await user.type(screen.getByLabelText("Position"), "  Engineer  ");
    await user.type(
      screen.getByLabelText("Job URL"),
      "  https://example.com/jobs/1  ",
    );
    await user.selectOptions(screen.getByLabelText("Status"), "interview");
    await user.type(screen.getByLabelText("Notes"), "  Keep spacing  ");
    await user.click(screen.getByRole("button", { name: "Add application" }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({
        company: "Acme",
        position: "Engineer",
        job_url: "https://example.com/jobs/1",
        status: "interview",
        applied_date: null,
        notes: "  Keep spacing  ",
        resume_id: null,
      });
    });
    await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
    unmount();
  });

  it("keeps the edited draft open after a rejected create", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockRejectedValue(new Error("create failed"));
    const { rerender } = renderModal({ onCreate });

    await user.type(screen.getByLabelText("Company"), "Acme");
    await user.type(screen.getByLabelText("Position"), "Engineer");
    await user.click(screen.getByRole("button", { name: "Add application" }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());

    rerender(
      <AddJobApplicationModal
        hasCreateError
        isCreating={false}
        onClose={vi.fn()}
        onCreate={onCreate}
      />,
    );

    expect(
      screen.getByText("The application could not be created. Please try again."),
    ).toBeVisible();
    expect(screen.getByLabelText("Company")).toHaveValue("Acme");
    expect(screen.getByRole("dialog", { name: "Add application" })).toBeVisible();
  });

  it("opens the wheel picker and only commits a date after Done", async () => {
    const user = userEvent.setup();
    renderModal();
    const dateControl = screen.getByRole("button", { name: "Applied date" });

    await user.click(dateControl);
    expect(screen.getByRole("dialog", { name: "Applied date picker" })).toBeVisible();
    expect(dateControl).toHaveTextContent("Select date");

    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.queryByRole("dialog", { name: "Applied date picker" })).not.toBeInTheDocument();
    expect(dateControl).not.toHaveTextContent("Select date");
  });

  it("disables controls and prevents Escape dismissal while creating", () => {
    const { props } = renderModal({ isCreating: true });
    const dialog = screen.getByRole("dialog", { name: "Add application" });

    expect(screen.getByLabelText("Company")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Close dialog" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Adding…" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByRole("button", { name: "Adding…" })).toBeDisabled();

    const escapeEvent = new KeyboardEvent("keydown", {
      cancelable: true,
      key: "Escape",
    });
    fireEvent(window, escapeEvent);

    expect(escapeEvent.defaultPrevented).toBe(false);
    expect(dialog).toBeVisible();
    expect(props.onClose).not.toHaveBeenCalled();
  });
});
