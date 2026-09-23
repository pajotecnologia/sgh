# SGH — Modelagem de Dados e Banco

## 1. Banco de Dados

O SGH utiliza **PostgreSQL** com **Prisma ORM**. Todas as chaves primárias são UUIDs (`@id @default(uuid())`).

---

## 2. Principais Modelos e Relações

### 2.1 Acesso e Usuários
- **`Usuario`**: Profissionais de saúde e administrativos com `role`, CRM, COREN, segredo MFA e status.
- **`SessaoUsuario`**: Rastreamento de sessões persistidas, tokens SHA-256 e dispositivos.
- **`TentativaLogin`**: Registro de tentativas para proteção de força bruta.
- **`EventoMfa`**: Trilha de segurança para eventos de ativação/validação de MFA.

### 2.2 Pacientes e Identificação
- **`Paciente`**: Cadastro central com CPF criptografado, nome criptografado, hash de busca, tipo sanguíneo e metadados.
- **`Endereco`**: Endereço estruturado com CEP, logradouro, bairro, cidade e estado.
- **`Alergia`**: Alergias medicamentosas e ambientais com grau de gravidade.
- **`MedicamentoContinuo`**: Fármacos de uso contínuo do paciente.

### 2.3 Atendimento e Triagem
- **`Atendimento`**: Entidade unificadora do ciclo de cuidado. Conecta paciente, médico, leito, triagem e prontuário.
- **`Triagem`**: Classificação de risco pelo protocolo de Manchester com cores, queixa e discriminadores.
- **`SinaisVitais`**: Sinais vitais numéricos com cálculo automático de IMC.
- **`ChamadaPainel`**: Registros de acionamento do painel de espera por consultório e setor.

### 2.4 Prontuário e Prática Clínica
- **`ProntuarioMedico`**: Agregador de registros do atendimento.
- **`Anamnese`**: HDA, antecedentes pessoais, familiares, cirúrgicos e hábitos de vida em JSON.
- **`Diagnostico`**: Hipóteses diagnósticas com código CID-10 e flag de diagnóstico primário.
- **`Prescricao` & `ItemPrescricao`**: Prescrições hospitalares (PS) e receitas de alta.
- **`AplicacaoMedicamento`**: Histórico de doses aplicadas com checklist dos 5 certos.
- **`RequisicaoExame` & `ItemRequisicao`**: Pedidos de exames, laudos estruturados e anexos de PDF.
- **`EvolucaoMedica`**: Registro imutável de evolução do paciente.

### 2.5 Internamento e Leitos
- **`Clinica`**: Especialidades de internação (Clínica Médica, Cirúrgica, Obstétrica, etc.).
- **`Leito`**: Unidade de internação com código, ala, quarto, tipo (UTI, Enfermaria, Isolamento, Observação) e status (Disponível, Ocupado, Interditado).
- **`LaudoInternacao`**: Laudo SUS / AIH para autorização de internação hospitalar.
- **`FichaInternacaoAlta`**: Registro municipal de internação e sumário de alta.
- **`FichaEvolucaoTurno`**: Evoluções diurnas e noturnas com sinais vitais e condutas.
- **`FichaSinaisVitais`**: Grid horário de sinais vitais 24h e balanço hídrico.
- **`FichaSae`**: Sistematização da Assistência de Enfermagem (diagnósticos e prescrições de enfermagem).

### 2.6 Farmácia e Suprimentos
- **`TbMedicamento`**: Catálogo de medicamentos com princípio ativo, forma farmacêutica e estoque mínimo.
- **`TbMedicamentoLote`**: Controle de lotes, validade e controle FEFO.
- **`TbInteracaoMatriz`**: Matriz de risco para detecção de interações medicamentosas.
- **`TbPrescricaoCabecalho` & `TbPrescricaoItem`**: Prescrições hospitalares integradas à triagem farmacêutica.
- **`TbFarmaciaDispensacao`**: Validação e dispensação de itens.
- **`TbFornecedor` & `TbFarmaciaEntradaNf`**: Gestão de fornecedores e entradas de nota fiscal (inclusive XML).
