/**
 * Simple Webview/Dashboard UI (React-like component)
 * To be served or rendered for the Dashboard
 */

import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Row, Col, Filter } from 'your-ui-library';

const StudentDashboard = () => {
  const [data, setData] = useState({ legal: [], coordination: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student-tracking')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(loading => false);
      });
  }, []);

  if (loading) return <div>Loading Student Data...</div>;

  return (
    <div className="dashboard-container">
      <h1>Dashboard de Acompanhamento e Inadimplência - Grupo US</h1>
      
      <Row>
        <Col md={6}>
          <Card title="Funil Jurídico (30+ Dias Atraso)">
            <p className="text-muted">Ações: Iniciar cobrança amigável e acordos.</p>
            <Table 
              data={data.legal}
              columns={[
                { title: 'Aluno', key: 'name' },
                { title: 'Atraso (Dias)', key: 'daysOverdue' },
                { title: 'Valor', key: 'amount' },
                { title: 'Vencimento', key: 'dueDate' },
                { title: 'Ações', render: (row) => <Button onClick={() => alert('Abrir Chat com Aluno')}>Chat</Button> }
              ]}
            />
          </Card>
        </Col>
        
        <Col md={6}>
          <Card title="Bloqueio de Acesso (60+ Dias Atraso)" borderVariant="danger">
            <p className="text-danger">Ações: Cortar acesso e cancelar práticas.</p>
            <Table 
              data={data.coordination}
              columns={[
                { title: 'Aluno', key: 'name' },
                { title: 'Atraso (Dias)', key: 'daysOverdue' },
                { title: 'Curso/Turma', key: 'course' },
                { title: 'Status', render: (row) => <Badge color="danger">BLOQUEAR ACESSO</Badge> },
                { title: 'Ações', render: (row) => <Button color="danger">Confirmar Bloqueio</Button> }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StudentDashboard;
