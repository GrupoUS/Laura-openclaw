const AsaasService = require('./asaas');

/**
 * Business Logic for Student Tracking and Delinquency
 * 1. 30 days overdue -> Legal Team (Cobrança)
 * 2. 60+ days overdue -> Coordination (Access cut)
 */
class StudentTracker {
  constructor(asaasApiKey) {
    this.asaas = new AsaasService(asaasApiKey);
  }

  async processDelinquency() {
    console.log('Fetching overdue payments...');
    const overduePayments = await this.asaas.getOverduePayments();
    
    const now = new Date();
    const legalAlerts = [];
    const coordinationAlerts = [];

    for (const payment of overduePayments) {
      const dueDate = new Date(payment.dueDate);
      const diffTime = Math.abs(now - dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Get student details (Asaas Customer)
      const student = await this.asaas.getCustomer(payment.customer);
      if (!student) continue;

      const record = {
        studentId: student.id,
        name: student.name,
        email: student.email,
        phone: student.mobilePhone,
        paymentId: payment.id,
        amount: payment.value,
        dueDate: payment.dueDate,
        daysOverdue: diffDays,
        course: student.externalReference || 'N/A', // External ref often holds course/turma
      };

      if (diffDays >= 60) {
        coordinationAlerts.push(record);
      } else if (diffDays >= 30) {
        legalAlerts.push(record);
      }
    }

    return {
      legal: legalAlerts,
      coordination: coordinationAlerts,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Mock for WhatsApp alert logic
   */
  async sendWhatsAppAlert(recipient, message) {
    console.log(`[WhatsApp Alert] To: ${recipient}\nMessage: ${message}`);
    // In a real implementation, this would call the WhatsApp agent or API
  }
}

module.exports = StudentTracker;
