/** Shared shape for every `useActionState` form in the app. */
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** Field-level errors keyed by input name. */
  errors?: Record<string, string>;
};

export const idleState: ActionState = { status: "idle" };

export function errorState(
  message: string,
  errors?: Record<string, string>,
): ActionState {
  return { status: "error", message, errors };
}

export function successState(message?: string): ActionState {
  return { status: "success", message };
}
