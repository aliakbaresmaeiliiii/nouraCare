import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private readonly mapboxToken = 'pk.eyJ1Ijoic2FtYW5laGJhc21lY2hpIiwiYSI6ImNrb3p0MHZsZDEzNnIydXFnb2ZzMHRkcXUifQ.5U7YQXoqKOsIMuIJR6OVgA';
  private readonly mapboxApiUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

  constructor(private http: HttpClient) {}

  reverseGeocode(lng: number, lat: number): Observable<any> {
    const url = `${this.mapboxApiUrl}/${lng},${lat}.json?accessToken=${this.mapboxToken}&types=place,address`;
    return this.http.get(url);
  }

  searchPlaces(query: string): Observable<any> {
    const url = `${this.mapboxApiUrl}/${encodeURIComponent(query)}.json?accessToken=${this.mapboxToken}&types=place,address&limit=10`;
    return this.http.get(url);
  }
}
