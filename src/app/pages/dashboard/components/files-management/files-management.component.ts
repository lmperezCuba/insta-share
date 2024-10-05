import { Component, inject, OnInit, signal } from '@angular/core';
import { Auth, User, user } from '@angular/fire/auth';
import { ref, Storage, uploadBytesResumable, UploadTask } from '@angular/fire/storage';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { FilesManagementService } from './files-management.service';
import { MatTableModule } from '@angular/material/table';
import { FileStatus } from './file-status.enum';

@Component({
  selector: 'app-files-manageent',
  standalone: true,
  imports: [MatIconModule, MatProgressBarModule, MatButtonModule, MatTableModule],
  templateUrl: './files-management.component.html',
  styleUrl: './files-management.component.scss'
})
export class FilesManagementComponent {
  file!: File;
  private auth: Auth = inject(Auth);
  private _snackBar = inject(MatSnackBar);
  user$ = user(this.auth);
  userSubscription: Subscription;
  private readonly storage = inject(Storage);
  loggedUser: { uid: string | undefined } = {
    uid: undefined
  };
  requiredFileType: string | undefined;
  uploadProgress = signal(-1);
  fileName = signal('');
  uploadTaskRef: UploadTask | undefined;
  displayedColumns: string[] = ['filename', 'status'];
  dataSource = signal<{ filename: any }[]>([]);

  constructor(private router: Router, private filesManagementService: FilesManagementService) {
    this.userSubscription = this.user$.subscribe((aUser: User | null) => {
      //handle user state changes here. Note, that user will be null if there is no currently logged in user.
      this.loggedUser = { uid: aUser?.uid };
      this.initLoadDatastore();
    })
    this.requiredFileType = '*';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file = input.files[0];
      this.fileName.set(this.file.name);
    }
  }

  /**
   * Upload the file to firestore
   */
  async uploadFile(): Promise<void> {
    const userId = this.loggedUser?.uid;
    if (userId && this.fileName()) {
      this.uploadProgress.set(0);
      const storageRef = ref(this.storage, `uploads/${userId}/${this.fileName()}`);
      const createdFileId = await this.filesManagementService
        .createFile({ filename: this.fileName(), userId: userId, storageRef: storageRef.fullPath });
      await this.initLoadDatastore()
      this.uploadTaskRef = uploadBytesResumable(storageRef, this.file);
      this.uploadTaskRef.on('state_changed',
        (snapshot) => {
          this.uploadProgress.set(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));           //Calculate and set the upload progress
        },
        (error) => { console.log(error); this.initLoadDatastore() },
        async () => {           //Upload is complete
          this.filesManagementService.updateFile({ userId: userId, fileId: createdFileId, status: FileStatus.Completed })
            .then(() => this.initLoadDatastore())
          this._snackBar.open('Filed uploaded', 'Close', { duration: environment.snackBarDuration });
          this.reset();
        }
      );
    } else {
      console.error('The user is not logged in');
      this.router.navigate(['login']);
    }
  }

  cancelUpload() {
    this.reset();
  }

  reset() {
    this.uploadProgress.set(-1);
    this.fileName.set('');
    this.uploadTaskRef?.cancel();
  }

  async initLoadDatastore() {
    const docs = await this.filesManagementService.getFiles(this.loggedUser?.uid);
    const data = docs?.docs.map(x => x.data()).map(f => { return { filename: f['filename'], status: f['status'] } });
    this.dataSource.set(data || []);
  }
}