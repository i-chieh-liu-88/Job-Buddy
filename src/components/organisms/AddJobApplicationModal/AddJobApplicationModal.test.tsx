import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
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

    expect(screen.getByRole("dialog", { name: "Add application" })).toHaveAttribute(
      "open",
    );
    expect(screen.getByLabelText("Company")).toHaveValue("");
    expect(screen.getByLabelText("Position")).toHaveValue("");
    expect(screen.getByLabelText("Job URL")).toHaveValue("");
    expect(screen.getByLabelText("Status")).toHaveValue("saved");
    expect(screen.getByLabelText("Applied date")).toHaveValue("");
    expect(screen.getByLabelText("Notes")).toHaveValue("");
    expect(screen.getByLabelText("Resume version")).toHaveValue("");
    expect(screen.getByLabelText("Company")).toHaveFocus();
    expect(screen.getByRole("button", { name: "Add application" }).closest("form"))
      .toHaveAttribute("novalidate");
  });

  it.each(["Cancel", "Close dialog"])(
    "discards the draft through %s",
    async (buttonName) => {
      const user = userEvent.setup();
      const { props } = renderModal();

      await user.type(screen.getByLabelText("Company"), "Unsaved draft");
      await user.click(screen.getByRole("button", { name: buttonName }));

      expect(props.onCreate).not.toHaveBeenCalled();
      expect(props.onClose).toHaveBeenCalledOnce();
    },
  );

  it("discards the draft through the native cancel event when idle", () => {
    const { props } = renderModal();

    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));

    expect(props.onCreate).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it("focuses the first invalid field and links Zod errors", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.type(screen.getByLabelText("Job URL"), "not a URL");
    await user.click(screen.getByRole("button", { name: "Add application" }));

    const company = screen.getByLabelText("Company");
    const position = screen.getByLabelText("Position");
    expect(company).toHaveFocus();
    expect(company).toHaveAttribute("aria-invalid", "true");
    expect(position).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Company is required.")).toBeVisible();
    expect(screen.getByText("Position is required.")).toBeVisible();
    expect(screen.getByText("Enter a valid URL.")).toBeVisible();
    expect(props.onCreate).not.toHaveBeenCalled();

    await user.type(company, "Acme");
    await user.type(position, "Engineer");
    await user.click(screen.getByRole("button", { name: "Add application" }));
    expect(screen.getByLabelText("Job URL")).toHaveFocus();
  });

  it("submits the normalized complete draft and closes after success", async () => {
    const user = userEvent.setup();
    const onCreate = vi
      .fn<(input: JobApplicationFormData) => Promise<unknown>>()
      .mockResolvedValue(undefined);
    renderModal({ onCreate });

    await user.type(screen.getByLabelText("Company"), "  Acme  ");
    await user.type(screen.getByLabelText("Position"), "  Engineer  ");
    await user.type(
      screen.getByLabelText("Job URL"),
      "  https://example.com/jobs/1  ",
    );
    await user.selectOptions(screen.getByLabelText("Status"), "interview");
    await user.type(screen.getByLabelText("Applied date"), "2026-08-10");
    await user.type(screen.getByLabelText("Notes"), "  Keep spacing  ");
    await user.type(screen.getByLabelText("Resume version"), "  v3  ");
    await user.click(screen.getByRole("button", { name: "Add application" }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({
        company: "Acme",
        position: "Engineer",
        job_url: "https://example.com/jobs/1",
        status: "interview",
        applied_date: "2026-08-10",
        notes: "  Keep spacing  ",
        resume_version: "v3",
      });
    });
    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute(
      "open",
    );
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
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
  });

  it("disables controls and prevents native cancel while creating", () => {
    const { props } = renderModal({ isCreating: true });
    const dialog = screen.getByRole("dialog");

    expect(screen.getByLabelText("Company")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Close dialog" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add application" })).toBeDisabled();

    const cancelEvent = new Event("cancel", { cancelable: true });
    fireEvent(dialog, cancelEvent);

    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(dialog).toHaveAttribute("open");
    expect(props.onClose).not.toHaveBeenCalled();
  });
});
