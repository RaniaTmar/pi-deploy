import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { RendezVousService } from '../../services/rendezvous.service';
import { StatutRendezVous } from '../../models/rendezvous.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-rendezvous-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './rendezvous-form.component.html',
  styleUrls: ['./rendezvous-form.component.css']
})
export class RendezVousFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  editId: string | null = null;
  loading = false;
  submitting = false;
  success = '';
  error = '';
  currentUser: any = null;

  statutOptions: StatutRendezVous[] = ['PLANIFIE', 'CONFIRME', 'ANNULE', 'TERMINE'];
  statutLabels: Record<StatutRendezVous, string> = {
    PLANIFIE: 'Planifié',
    CONFIRME: 'Confirmé',
    ANNULE: 'Annulé',
    TERMINE: 'Terminé'
  };

  // Minimum date: today
  get minDate(): string {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  constructor(
    private fb: FormBuilder,
    private service: RendezVousService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.buildForm();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.editId = id;
      this.loadExisting(this.editId);
    }
  }

  buildForm(): void {
    const initialPatientId = this.currentUser?.role === 'PATIENT' ? this.currentUser.id : null;
    const initialMedecinId = this.currentUser?.role === 'DOCTOR' ? this.currentUser.id : null;

    this.form = this.fb.group({
      patientId: [initialPatientId, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      medecinId: [initialMedecinId, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      dateHeure: ['', [Validators.required, this.futureDateValidator.bind(this)]],
      motif: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      observations: ['', [Validators.maxLength(500)]],
      statut: ['PLANIFIE', Validators.required]
    });
  }

  futureDateValidator(control: AbstractControl) {
    if (!control.value) return null;
    const selected = new Date(control.value);
    const now = new Date();
    // For edit, allow past dates
    if (this.isEdit) return null;
    if (selected <= now) {
      return { pastDate: true };
    }
    return null;
  }

  loadExisting(id: string): void {
    this.loading = true;
    this.service.getById(id).subscribe({
      next: (rv) => {
        // Check access
        if (this.currentUser) {
          if (this.currentUser.role === 'DOCTOR' && rv.medecinId !== this.currentUser.id) {
            this.error = 'Accès refusé. Ce rendez-vous ne vous est pas assigné.';
            this.loading = false;
            // Disable form to prevent modifications
            this.form.disable();
            return;
          }
          if (this.currentUser.role === 'PATIENT' && rv.patientId !== this.currentUser.id) {
            this.error = 'Accès refusé. Ce rendez-vous ne vous est pas assigné.';
            this.loading = false;
            // Disable form to prevent modifications
            this.form.disable();
            return;
          }
        }

        const dateStr = rv.dateHeure
          ? new Date(rv.dateHeure).toISOString().slice(0, 16)
          : '';
        this.form.patchValue({
          patientId: rv.patientId,
          medecinId: rv.medecinId,
          dateHeure: dateStr,
          motif: rv.motif,
          observations: rv.observations ?? '',
          statut: rv.statut ?? 'PLANIFIE'
        });
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load the appointment.';
        this.loading = false;
      }
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'This field is required.';
    if (ctrl.errors['min']) return `Minimum value is ${ctrl.errors['min'].min}.`;
    if (ctrl.errors['pattern']) return 'Please enter a positive integer.';
    if (ctrl.errors['minlength']) return `Minimum ${ctrl.errors['minlength'].requiredLength} characters required.`;
    if (ctrl.errors['maxlength']) return `Maximum ${ctrl.errors['maxlength'].requiredLength} characters allowed.`;
    if (ctrl.errors['pastDate']) return 'Date must be in the future.';
    return 'Invalid value.';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.error = '';
    this.success = '';

    const payload = this.form.value;

    if (this.isEdit && this.editId !== null) {
      this.service.update(this.editId, payload).subscribe({
        next: () => {
          this.success = 'Appointment updated successfully!';
          this.submitting = false;
          setTimeout(() => this.router.navigate(['/rendezvous']), 1500);
        },
        error: () => {
          this.error = 'Error updating. Please try again.';
          this.submitting = false;
        }
      });
    } else {
      this.service.create(payload).subscribe({
        next: () => {
          this.success = 'Appointment created successfully!';
          this.submitting = false;
          setTimeout(() => this.router.navigate(['/rendezvous']), 1500);
        },
        error: () => {
          this.error = 'Error creating. Please try again.';
          this.submitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/rendezvous']);
  }
}
