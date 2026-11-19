export interface Settings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  paymentInstructions: string;
  footerText: string;
  logo: string; // small image as a data URL
  brandColor: string; // like #1e40af
}

export interface SettingsResponse {
  success: boolean;
  settings: Settings;
}
