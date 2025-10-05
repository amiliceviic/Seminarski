import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contact } from './types';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private apiUrl = 'https://contacts-api.calmgrass-236dc35b.francecentral.azurecontainerapps.io/api/contacts';

  constructor(private http: HttpClient) {}

  list(q?: string): Observable<Contact[]> {
    let params = new HttpParams();
    if (q?.trim()) params = params.set('q', q.trim());
    return this.http.get<Contact[]>(this.apiUrl, { params });
  }

  get(id: string): Observable<Contact> {
    return this.http.get<Contact>(`${this.apiUrl}/${id}`);
  }

  create(body: Partial<Contact>): Observable<Contact> {
    return this.http.post<Contact>(this.apiUrl, body);
  }

  update(id: string, body: Partial<Contact>): Observable<Contact> {
    return this.http.put<Contact>(`${this.apiUrl}/${id}`, body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
