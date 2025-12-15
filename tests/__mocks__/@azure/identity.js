// Mock for @azure/identity to avoid ESM issues in Jest tests
class ClientSecretCredential {
  constructor(tenantId, clientId, clientSecret) {
    this.tenantId = tenantId;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async getToken(scopes) {
    return {
      token: 'mock-token',
      expiresOnTimestamp: Date.now() + 3600000,
    };
  }
}

class ClientCertificateCredential {
  constructor(tenantId, clientId, options) {
    this.tenantId = tenantId;
    this.clientId = clientId;
    this.options = options;
  }

  async getToken(scopes) {
    return {
      token: 'mock-token',
      expiresOnTimestamp: Date.now() + 3600000,
    };
  }
}

module.exports = {
  ClientSecretCredential,
  ClientCertificateCredential,
};
