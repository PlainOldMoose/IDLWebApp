import {type Key, type ReactNode, type RefObject, type SubmitEvent, useId, useState} from "react";

interface FormDialogProps {
    // The caller opens it with dialogRef.current?.showModal()
    dialogRef: RefObject<HTMLDialogElement | null>;
    title: ReactNode;
    onSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
    // Reset on close, so the dialog opens again without the last attempt's error
    mutation: { isPending: boolean, isError: boolean, error: Error | null, reset: () => void };
    submitLabel: ReactNode;
    children: ReactNode;
    // Shown instead of the server's reason when the mutation fails
    errorMessage?: string;
    // For actions that can't be undone: submit stays disabled until this word is typed
    confirmWord?: string;
    // Before Cancel, pushed to the left
    extraButton?: ReactNode;
    formKey?: Key;
    formRef?: RefObject<HTMLFormElement | null>;
    className?: string;
}

// The native modal every admin and sign-up form uses: title, the form's fields, its error, then Cancel and submit.
// Cancel comes first, so a dialog with no fields opens on it and a stray Enter backs out
export default function FormDialog({dialogRef, title, onSubmit, mutation, submitLabel, children, errorMessage, confirmWord,
                                       extraButton, formKey, formRef, className = ""}: FormDialogProps) {
    const titleId = useId();
    const [typed, setTyped] = useState("");
    const onClose = () => {
        mutation.reset();
        setTyped("");
    };
    return (
        <dialog ref={dialogRef} aria-labelledby={titleId} onClose={onClose} className={`dialog ${className}`}>
            <h2 id={titleId} className="font-display text-3xl font-bold">{title}</h2>
            <form key={formKey} ref={formRef} onSubmit={onSubmit} className="mt-4 space-y-4">
                {children}
                {confirmWord && (
                    <label className="block">
                        Type <strong>{confirmWord}</strong> to confirm
                        <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off"
                               className="text-input mt-2 block w-full"/>
                    </label>
                )}
                {mutation.isError && <p role="alert" className="text-sm text-ash">{errorMessage ?? mutation.error?.message}</p>}
                <div className="flex justify-end gap-3">
                    {extraButton}
                    <button type="button" className="secondary-button" onClick={() => dialogRef.current?.close()}>Cancel</button>
                    <button type="submit" className="primary-button" disabled={mutation.isPending || (!!confirmWord && typed !== confirmWord)}>
                        {submitLabel}
                    </button>
                </div>
            </form>
        </dialog>
    );
}
