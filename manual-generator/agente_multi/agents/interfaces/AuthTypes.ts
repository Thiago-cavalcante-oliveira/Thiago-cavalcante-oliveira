export interface AuthMethodResponse {
  authMethods: {
    standard: {
      available: boolean;
      requiredFields: string[];
      optionalFields: string[];
    };
    oauth: {
      providers: string[];
      location: string;
    };
    additional: {
      passwordRecovery: boolean;
      registration: boolean;
      twoFactor: boolean;
    };
  };
  recommendations: string[];
  warnings: string[];
}

export interface AuthDetectionResult {
  standardAuth: {
    available: boolean;
    fields: {
      required: string[];
      optional: string[];
    };
  };
  oauthProviders: {
    name: string;
    buttonSelector: string;
    location: string;
  }[];
  additionalFeatures: {
    passwordRecovery: {
      available: boolean;
      link?: string;
    };
    registration: {
      available: boolean;
      link?: string;
    };
    twoFactor: boolean;
  };
}
