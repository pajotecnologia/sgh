// lib/cadastros/kits-hospitalares-padrao.ts
// Catálogo padrão de kits automáticos de materiais e insumos hospitalares.
// Alinhado às melhores práticas de gestão hospitalar (Tasy, MV, Wareline).

export interface ItemKitHospitalarPadrao {
  descricaoItem: string;
  quantidadePadrao: number;
  unidade: string;
  obrigatorio?: boolean;
}

export interface KitHospitalarPadrao {
  codigo: string;
  nome: string;
  descricao: string;
  tipoVinculo: 'VIA_ADMINISTRACAO' | 'PROCEDIMENTO';
  viaAdministracao?: string;
  procedimentoNome?: string;
  itens: ItemKitHospitalarPadrao[];
}

export const KITS_HOSPITALARES_PADRAO: KitHospitalarPadrao[] = [
  // 1. KITS POR VIA DE ADMINISTRAÇÃO
  {
    codigo: 'KIT-VIA-EV',
    nome: 'Kit Injeção / Aplicação Endovenosa (EV)',
    descricao: 'Materiais básicos dispensados para administração de fármacos por via intravenosa.',
    tipoVinculo: 'VIA_ADMINISTRACAO',
    viaAdministracao: 'INTRAVENOSA',
    itens: [
      { descricaoItem: 'Seringa descartável 10ml luer lock sem agulha', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Agulha hipodérmica 40x12 (aspiração/reconstituição)', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Ampola de Água Destilada 10ml (diluição)', quantidadePadrao: 1, unidade: 'AMP' },
      { descricaoItem: 'Swab de álcool isopropílico 70%', quantidadePadrao: 2, unidade: 'UN' },
      { descricaoItem: 'Par de luvas de procedimento (tamanho M)', quantidadePadrao: 1, unidade: 'PAR' },
    ],
  },
  {
    codigo: 'KIT-VIA-IM',
    nome: 'Kit Injeção Intramuscular (IM)',
    descricao: 'Materiais dispensados para administração de medicamentos por via intramuscular.',
    tipoVinculo: 'VIA_ADMINISTRACAO',
    viaAdministracao: 'INTRAMUSCULAR',
    itens: [
      { descricaoItem: 'Seringa descartável 3ml ou 5ml luer lock', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Agulha hipodérmica 40x12 (aspiração)', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Agulha hipodérmica 25x7 ou 30x7 (aplicação adulto)', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Algodão hidrófilo estéril com álcool 70%', quantidadePadrao: 2, unidade: 'UN' },
      { descricaoItem: 'Curativo adesivo pós-injeção tipo Band-aid', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Par de luvas de procedimento', quantidadePadrao: 1, unidade: 'PAR' },
    ],
  },
  {
    codigo: 'KIT-VIA-SC',
    nome: 'Kit Injeção Subcutânea (SC)',
    descricao: 'Materiais para aplicação de insulinas, heparinas ou enoxaparina.',
    tipoVinculo: 'VIA_ADMINISTRACAO',
    viaAdministracao: 'SUBCUTANEA',
    itens: [
      { descricaoItem: 'Seringa para insulina 1ml com agulha integrada 13x4,5 (ou 8x0,3)', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Algodão hidrófilo estéril com álcool 70%', quantidadePadrao: 2, unidade: 'UN' },
      { descricaoItem: 'Par de luvas de procedimento', quantidadePadrao: 1, unidade: 'PAR' },
    ],
  },
  {
    codigo: 'KIT-VIA-INAL',
    nome: 'Kit Inalação / Nebulização',
    descricao: 'Conjunto para aerossolterapia e nebulização com oxigênio ou ar comprimido.',
    tipoVinculo: 'VIA_ADMINISTRACAO',
    viaAdministracao: 'INALATORIA',
    itens: [
      { descricaoItem: 'Conjunto de micronebulizador com máscara facial adulto e copo dosador', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Extensão plástica intermediária para oxigênio/ar (2 metros)', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Ampola de Soro Fisiológico (SF 0,9%) 10ml', quantidadePadrao: 1, unidade: 'AMP' },
      { descricaoItem: 'Seringa 5ml para dosagem de broncodilatador', quantidadePadrao: 1, unidade: 'UN' },
    ],
  },

  // 2. KITS POR PROCEDIMENTOS / CUIDADOS DE ENFERMAGEM
  {
    codigo: 'KIT-PUNCAO-VENOSA',
    nome: 'Kit Acesso Venoso Periférico (Punção Venosa)',
    descricao: 'Materiais para abertura e fixação de acesso venoso para hidratação e infusão contínua.',
    tipoVinculo: 'PROCEDIMENTO',
    procedimentoNome: 'Acesso Venoso Periférico / Punção Venosa',
    itens: [
      { descricaoItem: 'Cateter intravenoso periférico com dispositivo de segurança (Jelco 20G ou 22G)', quantidadePadrao: 2, unidade: 'UN' },
      { descricaoItem: 'Extensor multivias com clamp e conectores luer-lock (Polifix 2 vias)', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Garrote elétrico ou látex descartável', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Curativo transparente estéril para fixação de cateter com fendas e tiras', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Swab com clorexidina alcoólica 0,5% para antissepsia', quantidadePadrao: 2, unidade: 'UN' },
      { descricaoItem: 'Seringa 10ml com SF 0,9% para flush e salinização', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Par de luvas de procedimento', quantidadePadrao: 1, unidade: 'PAR' },
    ],
  },
  {
    codigo: 'KIT-CURATIVO-SIMPLES',
    nome: 'Kit Curativo Simples / Oclusivo',
    descricao: 'Materiais para limpeza e cobertura de lesões limpas, escoriações ou incisões pós-operatórias.',
    tipoVinculo: 'PROCEDIMENTO',
    procedimentoNome: 'Curativo Simples',
    itens: [
      { descricaoItem: 'Pacote de gaze estéril 7,5 x 7,5cm com 10 unidades', quantidadePadrao: 2, unidade: 'PCT' },
      { descricaoItem: 'Frasco de Soro Fisiológico 0,9% 100ml para irrigação', quantidadePadrao: 1, unidade: 'FR' },
      { descricaoItem: 'Fita microporosa hipoalergênica 50mm x 10m', quantidadePadrao: 1, unidade: 'RL' },
      { descricaoItem: 'Clorexidina aquosa 0,2% ou degermante (frasco aplicador)', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Par de luvas estéreis cirúrgicas (nº 7.5 ou 8.0)', quantidadePadrao: 1, unidade: 'PAR' },
    ],
  },
  {
    codigo: 'KIT-CURATIVO-ESPECIAL',
    nome: 'Kit Curativo Especial / Queimaduras / Úlceras',
    descricao: 'Materiais para curativos de feridas extensas, queimaduras ou úlceras com proteção de crepom.',
    tipoVinculo: 'PROCEDIMENTO',
    procedimentoNome: 'Curativo Especial / Queimaduras',
    itens: [
      { descricaoItem: 'Pacotes de gaze estéril 7,5 x 7,5cm (10 unidades)', quantidadePadrao: 4, unidade: 'PCT' },
      { descricaoItem: 'Atadura de crepom 15cm x 1,8m', quantidadePadrao: 2, unidade: 'UN' },
      { descricaoItem: 'Atadura de crepom 10cm x 1,8m', quantidadePadrao: 2, unidade: 'UN' },
      { descricaoItem: 'Frasco de Soro Fisiológico 0,9% 250ml', quantidadePadrao: 1, unidade: 'FR' },
      { descricaoItem: 'Fita microporosa hipoalergênica', quantidadePadrao: 1, unidade: 'RL' },
      { descricaoItem: 'Espátula de madeira estéril para pomadas', quantidadePadrao: 2, unidade: 'UN' },
      { descricaoItem: 'Par de luvas estéreis cirúrgicas', quantidadePadrao: 2, unidade: 'PAR' },
    ],
  },
  {
    codigo: 'KIT-SVD',
    nome: 'Kit Sondagem Vesical de Demora (SVD)',
    descricao: 'Conjunto estéril para drenagem contínua de urina em sistema fechado.',
    tipoVinculo: 'PROCEDIMENTO',
    procedimentoNome: 'Sondagem Vesical de Demora (SVD)',
    itens: [
      { descricaoItem: 'Sonda Foley 2 vias em silicone/látex (nº 14 ou 16 Fr)', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Bolsa coletora de urina sistema fechado com válvula anti-refluxo 2000ml', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Seringa descartável 20ml luer lock', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Ampola de Água Destilada 20ml estéril (inflar balonete)', quantidadePadrao: 1, unidade: 'AMP' },
      { descricaoItem: 'Gel lubrificante anestésico (Lidocaína geleia 2% bisnaga)', quantidadePadrao: 1, unidade: 'TB' },
      { descricaoItem: 'Campo cirúrgico estéril fenestrado descartável', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Pacote de gaze estéril', quantidadePadrao: 2, unidade: 'PCT' },
      { descricaoItem: 'Solução antisséptica de clorexidina aquosa 0,2%', quantidadePadrao: 1, unidade: 'FR' },
      { descricaoItem: 'Par de luvas estéreis cirúrgicas', quantidadePadrao: 2, unidade: 'PAR' },
      { descricaoItem: 'Fita adesiva hipoalergênica para fixação da sonda', quantidadePadrao: 1, unidade: 'RL' },
    ],
  },
  {
    codigo: 'KIT-SVA',
    nome: 'Kit Sondagem Vesical de Alívio (SVA)',
    descricao: 'Conjunto estéril para descompressão pontual da bexiga com sonda uretral descartável.',
    tipoVinculo: 'PROCEDIMENTO',
    procedimentoNome: 'Sondagem Vesical de Alívio (SVA)',
    itens: [
      { descricaoItem: 'Sonda uretral descartável em PVC atóxico (nº 12 ou 14 Fr)', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Cuba rim ou coletor graduado para mensuração de diurese', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Gel lubrificante estéril (Lidocaína 2% ou gel lubrificante)', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Pacote de gaze estéril', quantidadePadrao: 1, unidade: 'PCT' },
      { descricaoItem: 'Solução antisséptica aquosa', quantidadePadrao: 1, unidade: 'FR' },
      { descricaoItem: 'Par de luvas estéreis cirúrgicas', quantidadePadrao: 1, unidade: 'PAR' },
    ],
  },
  {
    codigo: 'KIT-SNG-SNE',
    nome: 'Kit Sondagem Nasogástrica / Nasoenteral (SNG/SNE)',
    descricao: 'Conjunto de materiais para drenagem gástrica ou introdução de sonda para nutrição enteral.',
    tipoVinculo: 'PROCEDIMENTO',
    procedimentoNome: 'Sondagem Nasogástrica / Enteral',
    itens: [
      { descricaoItem: 'Sonda nasogástrica tipo Levine nº 14 ou 16 Fr (ou sonda enteral com fio guia)', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Seringa 60ml com bico cônico (para aspiração e teste de ausculta)', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Gel lubrificante hidrossolúvel estéril (sachê ou tubo)', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Fita adesiva microporosa hipoalergênica para fixação nasal', quantidadePadrao: 1, unidade: 'RL' },
      { descricaoItem: 'Bolsa coletora de drenagem gástrica de circuito aberto', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Par de luvas de procedimento', quantidadePadrao: 1, unidade: 'PAR' },
      { descricaoItem: 'Toalha de papel descartável e pacote de gaze', quantidadePadrao: 1, unidade: 'PCT' },
    ],
  },
  {
    codigo: 'KIT-RETIRADA-PONTOS',
    nome: 'Kit Retirada de Pontos / Sutura',
    descricao: 'Instrumental e insumos estéreis para remoção de pontos cirúrgicos.',
    tipoVinculo: 'PROCEDIMENTO',
    procedimentoNome: 'Retirada de Pontos',
    itens: [
      { descricaoItem: 'Lâmina de bisturi nº 11 descartável estéril (ou tesoura de Spencer)', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Pinça anatômica ou dente de rato estéril descartável', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Pacote de gaze estéril com 5 unidades', quantidadePadrao: 1, unidade: 'PCT' },
      { descricaoItem: 'Swab com clorexidina alcoólica ou álcool 70%', quantidadePadrao: 2, unidade: 'UN' },
      { descricaoItem: 'Curativo adesivo hipoalergênico / micropore', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Par de luvas de procedimento', quantidadePadrao: 1, unidade: 'PAR' },
    ],
  },
  {
    codigo: 'KIT-CVC',
    nome: 'Kit Auxiliar para Acesso Venoso Central (CVC)',
    descricao: 'Materiais e EPIs estéreis para apoio ao procedimento médico de punção de cateter venoso central.',
    tipoVinculo: 'PROCEDIMENTO',
    procedimentoNome: 'Cateterismo Venoso Central (CVC)',
    itens: [
      { descricaoItem: 'Kit Cateter Venoso Central Duplo Lúmen 7 Fr x 20cm com introdutor e fio guia', quantidadePadrao: 1, unidade: 'KIT' },
      { descricaoItem: 'Avental cirúrgico impermeável estéril', quantidadePadrao: 2, unidade: 'UN' },
      { descricaoItem: 'Campo cirúrgico estéril fenestrado amplo de corpo inteiro', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Solução de Clorexidina Alcoólica 2% com aplicador estéril', quantidadePadrao: 1, unidade: 'FR' },
      { descricaoItem: 'Lidocaína 2% sem vasoconstritor frasco 20ml (anestesia local)', quantidadePadrao: 1, unidade: 'FR' },
      { descricaoItem: 'Seringa 10ml luer lock com agulha 40x12 e 25x7', quantidadePadrao: 2, unidade: 'UN' },
      { descricaoItem: 'Fio de sutura Mononylon 3-0 com agulha curva 3/8 para fixação', quantidadePadrao: 1, unidade: 'ENV' },
      { descricaoItem: 'Lâmina de bisturi nº 11', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Curativo transparente estéril com almofada de clorexidina (tipo Tegaderm CHG)', quantidadePadrao: 1, unidade: 'UN' },
      { descricaoItem: 'Pares de luvas estéreis cirúrgicas', quantidadePadrao: 2, unidade: 'PAR' },
    ],
  },
];
