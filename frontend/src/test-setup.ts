// NOTE: jsdom has no modal dialogs
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false;
    // As browsers do, so onClose handlers run
    this.dispatchEvent(new Event("close"));
};
