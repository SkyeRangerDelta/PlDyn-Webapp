import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private backendHost = '/api/v1/GetSettings';

  constructor() { }
}
