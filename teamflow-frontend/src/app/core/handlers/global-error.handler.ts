import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    constructor(private snackBar: MatSnackBar, private zone: NgZone) { }

    handleError(error: any): void {
        console.error('An error occurred:', error);

        let message = 'An unexpected error occurred.';
        if (error?.message) {
            message = error.message;
        }
        if (error?.error?.message) {
            message = error.error.message;
        }

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
