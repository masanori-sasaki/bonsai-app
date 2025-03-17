import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-bulk-watering-dialog',
  templateUrl: './bulk-watering-dialog.component.html',
  styleUrls: ['./bulk-watering-dialog.component.scss']
})
export class BulkWateringDialogComponent {
  descriptionControl = new FormControl('', [Validators.required]);
  validationError = '';

  constructor(
    public dialogRef: MatDialogRef<BulkWateringDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { description: string; date: string }
  ) {
    this.descriptionControl.setValue(data.description);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.descriptionControl.invalid) {
      this.validationError = '説明は必須です';
      return;
    }
    
    this.data.description = this.descriptionControl.value;
    this.dialogRef.close(this.data);
  }
}
