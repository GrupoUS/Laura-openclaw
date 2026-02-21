const axios = require('axios');

class AsaasService {
  constructor(apiKey) {
    this.client = axios.create({
      baseURL: 'https://www.asaas.com/api/v3',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * List overdue payments
   * status: OVERDUE
   */
  async getOverduePayments() {
    try {
      const response = await this.client.get('/payments', {
        params: {
          status: 'OVERDUE',
          limit: 100
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Asaas API Error:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async getCustomer(id) {
    try {
      const response = await this.client.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching customer ${id}:`, error.message);
      return null;
    }
  }
}

module.exports = AsaasService;
