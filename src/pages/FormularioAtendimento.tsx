import React from 'react'
import { Container, Row, Col, Form, Button } from 'react-bootstrap'
import '../styles/form.css'


const opcoes = {
  funcao: ['Aluno', 'Funcionário', 'Parents/Relatives', 'ADM', 'Maint'],
  turma: ['NURSERY A', 'NURSERY B', 'NURSERY C', 'PK 3 A', 'PK 3 B'],
  motivo: ['Afta', 'Arranhão', 'Alergia', 'Azia', 'Calo'],
  medicamentos: ['Acido mefenamico cp', 'Aerolin spray', 'Alivium gts', 'Allegra 60mg', 'Allegra Sol'],
  curativos: ['ABS', 'ATADURA', 'ABAIXADOR DE LINGUA', 'BANDAID', 'BEPANTOL'],
  destino: ['DISMISS', 'HOME', 'HOSPITAL', 'OFFICE/ Special', 'NaN'],
  comunicacao: ['JUPITER', 'CALL', 'WHATSAPP', 'PRESENCIAL', '-'],
  nurse: ['Virginia Valença', 'Helena Silva']
}

const FormularioAtendimento: React.FC = () => {
  return (
    <Container className="py-4">
      <h3 className="mb-4 text-center">Formulário de Atendimento</h3>
      <Form>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group controlId="nome">
              <Form.Label>Nome</Form.Label>
              <Form.Control type="text" placeholder="Digite o nome do paciente" />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="vinculo">
              <Form.Label>Vínculo</Form.Label>
              <Form.Select>
                {opcoes.funcao.map(item => <option key={item}>{item}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="horaChegada">
              <Form.Label>Hora da chegada</Form.Label>
              <Form.Control type="time" />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Group controlId="turma">
              <Form.Label>Turma</Form.Label>
              <Form.Select>
                {opcoes.turma.map(item => <option key={item}>{item}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="motivo">
              <Form.Label>Motivo</Form.Label>
              <Form.Select>
                {opcoes.motivo.map(item => <option key={item}>{item}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3" controlId="descricao">
          <Form.Label>Descrição</Form.Label>
          <Form.Control as="textarea" rows={3} />
        </Form.Group>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Group controlId="comunicacao">
              <Form.Label>Comunicação</Form.Label>
              <Form.Select>
                {opcoes.comunicacao.map(item => <option key={item}>{item}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group controlId="temperatura">
              <Form.Label>T (°C)</Form.Label>
              <Form.Control type="text" />
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group controlId="pa">
              <Form.Label>PA (mmHg)</Form.Label>
              <Form.Control type="text" />
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group controlId="fc">
              <Form.Label>FC (bpm)</Form.Label>
              <Form.Control type="text" />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={4}>
            <Form.Group controlId="medicamentos">
              <Form.Label>Medicamentos</Form.Label>
              <Form.Select>
                {opcoes.medicamentos.map(item => <option key={item}>{item}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="curativos">
              <Form.Label>Curativos</Form.Label>
              <Form.Select>
                {opcoes.curativos.map(item => <option key={item}>{item}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="outros">
              <Form.Label>Outros</Form.Label>
              <Form.Control type="text" />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={6}>
            <Form.Group controlId="destino">
              <Form.Label>Destino</Form.Label>
              <Form.Select>
                {opcoes.destino.map(item => <option key={item}>{item}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="nurse">
              <Form.Label>Nurse</Form.Label>
              <Form.Select>
                {opcoes.nurse.map(item => <option key={item}>{item}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <div className="text-end">
          <Button variant="success" type="submit">
            Finalizar Atendimento
          </Button>
        </div>
      </Form>
    </Container>
  )
}

export default FormularioAtendimento
