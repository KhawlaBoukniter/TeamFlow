import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    constructor(private snackBar: MatSnackBar, private zone: NgZone) { }

    handleError(error: any): void {
        // Log the error to console
        console.error('An error occurred:', error);

        // Extract message
        let message = 'An unexpected error occurred.';
        if (error?.message) {
            message = error.message;
        }
        if (error?.error?.message) { // Handle HttpErrorResponse body
            message = error.error.message;
        }

        // Show snackbar in Angular zone
        this.zone.run(() => {
            this.snackBar.open(message, 'Close', {
                duration: 5000,
                panelClass: ['error-snackbar'],
                horizontalPosition: 'end',
                verticalPosition: 'top'
            });
        });
    }
}
