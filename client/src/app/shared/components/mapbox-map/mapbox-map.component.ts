import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  input,
  OnInit,
  output,
  PLATFORM_ID,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import * as mapboxGl from 'mapbox-gl';
import { LngLat } from 'mapbox-gl';
import { MapService } from '../../services/map.service';

@Component({
  selector: 'app-mapbox-map',
  templateUrl: './mapbox-map.component.html',
  styleUrl: './mapbox-map.component.scss',
  standalone: false
})
export class MapboxMapComponent implements OnInit, OnChanges {
  coordinates = input<
    {
      lat: number;
      lng: number;
    }[]
  >([]);
  zoomLevel = input<number>(14);
  markerMoved = output<any>();
  
  style = 'mapbox://styles/mapbox/streets-v11';
  lng: number = 51.375447552429875;
  lat: number = 35.744711325653654;

  map!: mapboxgl.Map;
  markerData!: LngLat;
  marker: mapboxGl.Marker = new mapboxGl.Marker();
  private platformId: Object = inject(PLATFORM_ID);
  service = inject(MapService);
  cdr = inject(ChangeDetectorRef);

  // Property to store location watch ID
  private locationWatchId: number | null = null;

  constructor() {
    this.initializeMap(0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    const coordinates = this.coordinates();
    if (changes['coordinates'] && changes['coordinates'].currentValue && coordinates) {
      this.updateMapLocation(coordinates);
    }
  }

  ngOnInit(): void {
    this.checkLocationPermission();
  }

  private async checkLocationPermission(): Promise<void> {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permission.state === 'granted') {
          this.setCurrentLocation();
        } else if (permission.state === 'prompt') {
          this.requestLocationPermission();
        } else if (permission.state === 'denied') {
          this.showLocationPermissionDeniedMessage();
        }
        
        // Listen for permission changes
        permission.onchange = () => {
          if (permission.state === 'granted') {
            this.showLocationPermissionGrantedMessage();
            this.setCurrentLocation();
          } else if (permission.state === 'denied') {
            this.showLocationPermissionDeniedMessage();
          }
        };
      } catch (error) {
        console.error('Error checking location permission:', error);
        // Fallback to direct geolocation request
        this.setCurrentLocation();
      }
    } else {
      // Fallback for browsers that don't support permissions API
      this.setCurrentLocation();
    }
  }

  private requestLocationPermission(): void {
    const message = 'This app needs access to your location to show your current position on the map. Please allow location access when prompted.';
    console.log(message);
    
    if (typeof window !== 'undefined') {
      this.showLocationPermissionRequestDialog();
    }
    
    // Try to get location anyway (this will trigger the permission prompt)
    this.setCurrentLocation();
  }

  private showLocationPermissionRequestDialog(): void {
    // Create a custom dialog explaining why we need location access
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 24px;
      border-radius: 12px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    `;

    const icon = document.createElement('div');
    icon.innerHTML = '📍';
    icon.style.cssText = `
      font-size: 48px;
      margin-bottom: 16px;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Location Access Needed';
    title.style.cssText = `
      margin: 0 0 16px 0;
      color: #333;
      font-size: 18px;
      font-weight: 600;
    `;

    const message = document.createElement('p');
    message.textContent = 'To show your current location on the map, we need access to your device location. You\'ll see a permission prompt next.';
    message.style.cssText = `
      margin: 0 0 24px 0;
      color: #666;
      line-height: 1.5;
      font-size: 14px;
    `;

    const continueButton = document.createElement('button');
    continueButton.textContent = 'Continue';
    continueButton.style.cssText = `
      background: #007AFF;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
    `;

    continueButton.addEventListener('click', () => {
      dialog.remove();
    });

    content.appendChild(icon);
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(continueButton);
    dialog.appendChild(content);

    document.body.appendChild(dialog);
  }

  private showLocationPermissionDeniedMessage(): void {
    const message = 'Location access has been denied. To use this feature, please enable location access in your device settings.';
    console.log(message);
    
    if (typeof window !== 'undefined') {
      this.showLocationSettingsDialog();
    }
  }

  private showLocationSettingsDialog(): void {
    // Create a custom dialog with options to open settings
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 24px;
      border-radius: 12px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    `;

    const title = document.createElement('h3');
    title.textContent = 'Location Access Required';
    title.style.cssText = `
      margin: 0 0 16px 0;
      color: #333;
      font-size: 18px;
      font-weight: 600;
    `;

    const message = document.createElement('p');
    message.textContent = 'This app needs access to your location to show your current position on the map. Please enable location access in your device settings.';
    message.style.cssText = `
      margin: 0 0 24px 0;
      color: #666;
      line-height: 1.5;
      font-size: 14px;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: center;
    `;

    const settingsButton = document.createElement('button');
    settingsButton.textContent = 'Open Settings';
    settingsButton.style.cssText = `
      background: #007AFF;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      flex: 1;
      max-width: 150px;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = `
      background: #f2f2f2;
      color: #333;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      flex: 1;
      max-width: 150px;
    `;

    // Add hover effects
    settingsButton.addEventListener('mouseenter', () => {
      settingsButton.style.background = '#0056CC';
    });
    settingsButton.addEventListener('mouseleave', () => {
      settingsButton.style.background = '#007AFF';
    });

    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = '#e5e5e5';
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = '#f2f2f2';
    });

    // Button click handlers
    settingsButton.addEventListener('click', () => {
      this.openDeviceSettings();
      dialog.remove();
    });

    closeButton.addEventListener('click', () => {
      dialog.remove();
    });

    // Close dialog when clicking outside
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });

    // Assemble the dialog
    buttonContainer.appendChild(settingsButton);
    buttonContainer.appendChild(closeButton);
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(buttonContainer);
    dialog.appendChild(content);

    // Add to page
    document.body.appendChild(dialog);
  }

  private openDeviceSettings(): void {
    // Try to open device settings based on platform
    if (this.isIOS()) {
      this.openIOSSettings();
    } else if (this.isAndroid()) {
      this.openAndroidSettings();
    } else {
      this.openBrowserSettings();
    }
  }

  private isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  private isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  private openIOSSettings(): void {
    // For iOS, we can try to open the Settings app
    try {
      // Try to open the Settings app using a custom URL scheme
      const settingsUrl = 'App-Prefs:Privacy&path=LOCATION';
      window.location.href = settingsUrl;
      
      // Fallback: show instructions
      setTimeout(() => {
        this.showIOSSettingsInstructions();
      }, 1000);
    } catch (error) {
      this.showIOSSettingsInstructions();
    }
  }

  private openAndroidSettings(): void {
    // For Android, try to open location settings
    try {
      // Try to open Android settings
      const settingsUrl = 'android-app://com.android.settings/.Settings$LocationSettingsActivity';
      window.location.href = settingsUrl;
      
      // Fallback: show instructions
      setTimeout(() => {
        this.showAndroidSettingsInstructions();
      }, 1000);
    } catch (error) {
      this.showAndroidSettingsInstructions();
    }
  }

  private openBrowserSettings(): void {
    // For web browsers, show instructions
    this.showBrowserSettingsInstructions();
  }

  private showIOSSettingsInstructions(): void {
    const instructions = `
1. Open the Settings app on your iPhone/iPad
2. Scroll down and tap "Privacy & Security"
3. Tap "Location Services"
4. Make sure "Location Services" is turned ON
5. Find this app in the list and tap it
6. Select "While Using App" or "Always"
7. Return to this app and refresh the page
    `;
    
    this.showInstructionsDialog('iOS Settings Instructions', instructions);
  }

  private showAndroidSettingsInstructions(): void {
    const instructions = `
1. Open the Settings app on your Android device
2. Tap "Privacy" or "Privacy & Security"
3. Tap "Location" or "Location Services"
4. Make sure "Location" is turned ON
5. Find this app in the list and tap it
6. Select "Allow all the time" or "Allow only while using app"
7. Return to this app and refresh the page
    `;
    
    this.showInstructionsDialog('Android Settings Instructions', instructions);
  }

  private showBrowserSettingsInstructions(): void {
    const instructions = `
1. Click the lock/info icon in your browser's address bar
2. Look for "Location" or "Location access"
3. Change it from "Block" to "Allow"
4. Refresh this page
5. When prompted, click "Allow" for location access

If you don't see location options, try:
- Chrome: Settings > Privacy and security > Site Settings > Location
- Firefox: Settings > Privacy & Security > Permissions > Location
- Safari: Preferences > Websites > Location
    `;
    
    this.showInstructionsDialog('Browser Settings Instructions', instructions);
  }

  private showInstructionsDialog(title: string, instructions: string): void {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 24px;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    `;

    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    titleElement.style.cssText = `
      margin: 0 0 16px 0;
      color: #333;
      font-size: 18px;
      font-weight: 600;
    `;

    const instructionsElement = document.createElement('div');
    instructionsElement.innerHTML = instructions.replace(/\n/g, '<br>');
    instructionsElement.style.cssText = `
      margin: 0 0 24px 0;
      color: #666;
      line-height: 1.6;
      font-size: 14px;
      text-align: left;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Got it!';
    closeButton.style.cssText = `
      background: #007AFF;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
    `;

    closeButton.addEventListener('click', () => {
      dialog.remove();
    });

    content.appendChild(titleElement);
    content.appendChild(instructionsElement);
    content.appendChild(closeButton);
    dialog.appendChild(content);

    document.body.appendChild(dialog);
  }

  private showLocationPermissionGrantedMessage(): void {
    // Show a success message when location permission is granted
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    const message = document.createElement('div');
    message.innerHTML = '✅ Location access granted! Getting your current location...';
    message.style.cssText = `
      font-size: 14px;
      font-weight: 500;
    `;

    dialog.appendChild(message);
    document.body.appendChild(dialog);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (dialog.parentNode) {
        dialog.remove();
      }
    }, 3000);
  }

  initializeMap(zoom: number | null = null): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout((): void => {
        const coordinates = this.coordinates();
        this.map = new mapboxGl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/streets-v12',
          zoom: zoom ? zoom : 14,
          attributionControl: true,
          accessToken: 'pk.eyJ1Ijoic2FtYW5laGJhc21lY2hpIiwiYSI6ImNrb3p0MHZsZDEzNnIydXFnb2ZzMHRkcXUifQ.5U7YQXoqKOsIMuIJR6OVgA',
          center: coordinates.length
            ? [coordinates[0].lng, coordinates[0].lat]
            : [-74.006, 40.7128],
          maxZoom: 20,
        });

        this.marker.getElement().addEventListener('click', () => {
          this.openLocationDialog(); // Call a function to open the dialog
        });
        
        const coordinatesValue = this.coordinates();
        if (coordinatesValue.length > 0 && coordinatesValue[0].lng && coordinatesValue[0].lat) {
          const lngLat: LngLat = {
            lng: parseFloat(`${coordinatesValue[0].lng}`),
            lat: parseFloat(`${coordinatesValue[0].lat}`),
          } as LngLat;
          this.marker = new mapboxGl.Marker({
            draggable: true,
            anchor: 'center',
          })
            .setLngLat(lngLat)
            .addTo(this.map);
        }

        // Use the 'move' event to keep the marker centered
        this.marker.on('dragend', (): void => {
          this.cdr.detectChanges();
          const updatedCoordinates: LngLat = this.marker.getLngLat();
          
          // Snap marker to exact coordinates
          this.marker.setLngLat(updatedCoordinates);
          
          this.getAddressFromCoordinates(
            updatedCoordinates.lng,
            updatedCoordinates.lat
          );

          // Re-center the map on the marker's new position
          this.map.flyTo({
            center: updatedCoordinates,
            zoom: this.map.getZoom(),
            speed: 1.5,
          });
        });

        // Add marker drag start event for better UX
        this.marker.on('dragstart', (): void => {
          console.log('Marker drag started');
        });

        this.map.on('click', (event: mapboxGl.MapMouseEvent): void => {
          // Remove existing marker
          if (this.marker) {
            this.marker.remove();
          }
          
          // Remove accuracy circle if it exists
          if (this.map.getSource('accuracy-circle')) {
            this.map.removeLayer('accuracy-circle-fill');
            this.map.removeLayer('accuracy-circle-border');
            this.map.removeSource('accuracy-circle');
          }
          
          const clickedCoordinates: LngLat = event.lngLat;
          
          // Create new marker at exact clicked location
          this.marker = new mapboxGl.Marker({ 
            draggable: true,
            anchor: 'center',
            color: '#FF3B30' // Red color for manually placed markers
          })
            .setLngLat(clickedCoordinates)
            .addTo(this.map);
          
          // Get address for the clicked location
          this.getAddressFromCoordinates(
            clickedCoordinates.lng,
            clickedCoordinates.lat
          );
          
          // Add drag events to the new marker
          this.marker.on('dragend', (): void => {
            this.cdr.detectChanges();
            const updatedCoordinates: LngLat = this.marker.getLngLat();
            
            // Snap marker to exact coordinates
            this.marker.setLngLat(updatedCoordinates);
            
            this.getAddressFromCoordinates(
              updatedCoordinates.lng,
              updatedCoordinates.lat
            );
          });
        });

        // Add location permission button to the map
        this.addLocationPermissionButton();
      });
    }
  }

  updateMapLocation(coordinates: [number, number] | any): void {
    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      const [lng, lat] = coordinates; // Destructure the array into lng and lat
      this.map?.flyTo({ center: [lng, lat], zoom: 6 });
      this.marker?.setLngLat({ lng, lat });
    }
  }

  getAddressFromCoordinates(lng: number, lat: number): void {
    this.service.reverseGeocode(lng, lat).subscribe(
      response => {
        const address = response.features[0]?.place_name || 'Unknown location';
        const location: any = { lat, lng, address };
        this.markerMoved.emit(location);
      },
      error => {
        console.error('Error getting address:', error);
      }
    );
  }

  setCurrentLocation(): void {
    if (navigator.geolocation) {
      // Request high accuracy location
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      };

      navigator.geolocation.getCurrentPosition(
        position => {
          const lng = position.coords.longitude;
          const lat = position.coords.latitude;
          const accuracy = position.coords.accuracy;

          console.log('Location obtained:', { lng, lat, accuracy });

          // Center the map on the user's current location
          this.map?.flyTo({
            center: [lng, lat],
            zoom: 16, // Higher zoom for better accuracy
            speed: 1.5
          });

          // Remove existing marker if any
          if (this.marker) {
            this.marker.remove();
          }

          // Create and place a new marker at the user's current location
          this.marker = new mapboxGl.Marker({
            draggable: true,
            anchor: 'center',
            color: '#007AFF' // iOS blue color
          })
            .setLngLat([lng, lat])
            .addTo(this.map);

          // Add accuracy circle if accuracy is available
          if (accuracy && accuracy > 0) {
            this.addAccuracyCircle(lng, lat, accuracy);
          }

          // Emit the location for parent component
          this.markerMoved.emit({
            lat: lat,
            lng: lng,
            address: 'Current Location',
            accuracy: accuracy
          });
        },
        error => {
          console.error('Error getting location:', error);
          this.handleLocationError(error);
        },
        options
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
      this.showLocationNotSupportedMessage();
    }
  }

  private showLocationNotSupportedMessage(): void {
    const message = 'Geolocation is not supported by this browser.';
    console.log(message);
    if (typeof window !== 'undefined') {
      alert(message);
    }
  }

  validateCoordinates(lng: number, lat: number): boolean {
    return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
  }

  private handleLocationError(error: GeolocationPositionError): void {
    let errorMessage = '';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied. Please allow location access in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable. Please try again.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please try again.';
        break;
      default:
        errorMessage = 'An unknown error occurred while getting location.';
    }
    
    console.error('Location error:', errorMessage);
    this.showLocationErrorMessage(errorMessage);
  }

  private showLocationErrorMessage(message: string): void {
    console.log(message);
    if (typeof window !== 'undefined') {
      alert(message);
    }
  }

  private addAccuracyCircle(lng: number, lat: number, accuracy: number): void {
    // Remove existing accuracy circle if any
    if (this.map.getSource('accuracy-circle')) {
      this.map.removeLayer('accuracy-circle-fill');
      this.map.removeLayer('accuracy-circle-border');
      this.map.removeSource('accuracy-circle');
    }

    // Convert accuracy from meters to degrees (approximate)
    const accuracyDegrees = accuracy / 111000; // Rough conversion

    // Add accuracy circle source
    this.map.addSource('accuracy-circle', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        properties: {}
      }
    });

    // Add accuracy circle fill layer
    this.map.addLayer({
      id: 'accuracy-circle-fill',
      type: 'circle',
      source: 'accuracy-circle',
      paint: {
        'circle-radius': accuracyDegrees * 1000000, // Scale for visibility
        'circle-color': '#007AFF',
        'circle-opacity': 0.1
      }
    });

    // Add accuracy circle border layer
    this.map.addLayer({
      id: 'accuracy-circle-border',
      type: 'circle',
      source: 'accuracy-circle',
      paint: {
        'circle-radius': accuracyDegrees * 1000000, // Scale for visibility
        'circle-color': '#007AFF',
        'circle-opacity': 0.3,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#007AFF'
      }
    });
  }

  // Method to refresh current location with high accuracy
  refreshCurrentLocation(): void {
    console.log('Refreshing current location...');
    
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for better accuracy
        maximumAge: 0 // Always get fresh location
      };

      navigator.geolocation.getCurrentPosition(
        position => {
          const lng = position.coords.longitude;
          const lat = position.coords.latitude;
          const accuracy = position.coords.accuracy;
          const heading = position.coords.heading;
          const speed = position.coords.speed;

          console.log('Refreshed location:', { lng, lat, accuracy, heading, speed });

          // Center the map on the new location
          this.map?.flyTo({
            center: [lng, lat],
            zoom: 18, // Very high zoom for maximum accuracy
            speed: 2
          });

          // Remove existing marker and accuracy circle
          if (this.marker) {
            this.marker.remove();
          }
          
          if (this.map.getSource('accuracy-circle')) {
            this.map.removeLayer('accuracy-circle-fill');
            this.map.removeLayer('accuracy-circle-border');
            this.map.removeSource('accuracy-circle');
          }

          // Create new marker at exact location
          this.marker = new mapboxGl.Marker({
            draggable: true,
            anchor: 'center',
            color: '#007AFF'
          })
            .setLngLat([lng, lat])
            .addTo(this.map);

          // Add accuracy circle
          if (accuracy && accuracy > 0) {
            this.addAccuracyCircle(lng, lat, accuracy);
          }

          // Emit the refreshed location
          this.markerMoved.emit({
            lat: lat,
            lng: lng,
            address: 'Current Location (Refreshed)',
            accuracy: accuracy,
            heading: heading,
            speed: speed
          });
        },
        error => {
          console.error('Error refreshing location:', error);
          this.handleLocationError(error);
        },
        options
      );
    }
  }

  // Method to watch location changes (for continuous updates)
  startLocationWatching(): void {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000 // Update every 30 seconds
      };

      const watchId = navigator.geolocation.watchPosition(
        position => {
          const lng = position.coords.longitude;
          const lat = position.coords.latitude;
          const accuracy = position.coords.accuracy;

          console.log('Location updated:', { lng, lat, accuracy });

          // Update marker position smoothly
          if (this.marker) {
            this.marker.setLngLat([lng, lat]);
          }

          // Update accuracy circle
          if (accuracy && accuracy > 0) {
            this.addAccuracyCircle(lng, lat, accuracy);
          }
        },
        error => {
          console.error('Error watching location:', error);
        },
        options
      );

      // Store watch ID for cleanup
      this.locationWatchId = watchId;
    }
  }

  // Method to stop location watching
  stopLocationWatching(): void {
    if (this.locationWatchId) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
      console.log('Location watching stopped');
    }
  }

  openLocationDialog() {
    // This will be handled by the parent component
    const currentPosition = this.marker.getLngLat();
    this.markerMoved.emit({
      lat: currentPosition.lat,
      lng: currentPosition.lng,
      address: 'Selected location'
    });
  }

  // Method to manually request location permission
  requestLocationPermissionManually(): void {
    console.log('Manually requesting location permission...');
    
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        position => {
          console.log('Location permission granted manually:', position);
          this.showLocationPermissionGrantedMessage();
          this.setCurrentLocation();
        },
        error => {
          console.error('Manual location request failed:', error);
          if (error.code === error.PERMISSION_DENIED) {
            this.showLocationPermissionDeniedMessage();
          } else {
            this.handleLocationError(error);
          }
        },
        options
      );
    } else {
      this.showLocationNotSupportedMessage();
    }
  }

  // Method to add a location permission button to the map
  addLocationPermissionButton(): void {
    if (!this.map) return;

    // Create a custom control for location permission
    const locationButton = document.createElement('button');
    locationButton.className = 'mapboxgl-ctrl-group mapboxgl-ctrl';
    locationButton.style.cssText = `
      width: 30px;
      height: 30px;
      background: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
      margin: 10px;
    `;

    locationButton.innerHTML = '📍';
    locationButton.title = 'Request Location Access';

    locationButton.addEventListener('click', () => {
      this.requestLocationPermissionManually();
    });

    // Add the button to the map
    const controlContainer = document.createElement('div');
    controlContainer.className = 'mapboxgl-ctrl-top-right';
    controlContainer.appendChild(locationButton);

    this.map.getContainer().appendChild(controlContainer);
  }
}
