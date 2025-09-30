import { Component, OnInit } from '@angular/core';
import { ContactService } from './contacts.service';
import { Contact } from './types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  contacts: Contact[] = [];
  q = '';

  editing: Contact | null = null;
  form: Partial<Contact> = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
    avatarUrl: ''
  };

  constructor(private api: ContactService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.list(this.q).subscribe((cs) => (this.contacts = cs));
  }

  search() {
    this.load();
  }

  submit() {
    if (!this.form.firstName?.trim() || !this.form.email?.trim()) return;
    if (this.editing) {
      this.api.update(this.editing.id, this.form).subscribe(() => {
        this.cancel();
        this.load();
      });
    } else {
      this.api.create(this.form).subscribe(() => {
        this.reset();
        this.load();
      });
    }
  }

  edit(c: Contact) {
    this.editing = c;
    this.form = { ...c };
  }

  del(id: string) {
    if (!confirm('Delete contact?')) return;
    this.api.remove(id).subscribe(() => this.load());
  }

  cancel() {
    this.editing = null;
    this.reset();
  }

  reset() {
    this.form = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      notes: '',
      avatarUrl: ''
    };
  }
}
