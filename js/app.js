/*
* Módulo para comunicação da UI e CRUD de Cidades/Estados.
* Responsabilidades:
* - Guardar/ler o token de autenticação (Bearer) no localStorage.
* - Fazer requisições HTTP à API, incluindo o token e tratando 401 com retry.
* - Fornecer um pequeno cliente `api` (get/post/put/del).
* - Popular a UI, renderizar lista e tratar ações (adicionar/editar/remover/pesquisar).
*
* Dependências globais (browser):
* - fetch / Headers
* - localStorage
* - prompt, alert, confirm
*/

/*
 * URL base das rotas da API no servidor Express (prefixo configurado no backend).
 * Ex.: o endpoint GET /api/estados será chamado como `${API_BASE}/estados`
 */
const API_BASE = '/api';
//Chave usada no localStorage para manter o token da API no ambiente de dev.
const TOKEN_KEY = 'api_token_dev';

//Token (dev) 
// Obtém o token atual armazenado no navegador.
function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

//Persiste um token no localStorage.
function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}

/*
 * Garante que há um token válido. Se não houver, solicita via prompt.
 * Também pode ser chamado após uma resposta 401 para redefinir o token.
 */
async function ensureToken(e) {
  let t = getToken();
  if (!t || (e && e.status === 401)) {
    t = prompt('Informe seu API_TOKEN (Bearer):') || '';
    if (!t) throw new Error('API_TOKEN não informado');
    setToken(t.trim());
  }
  return t.trim();
}

//HTTP helpers
/**
 * Faz uma requisição HTTP para a API aplicando automaticamente:
 * - Authorization: Bearer <token>
 * - Content-Type: application/json (quando houver body e o header não tiver sido informado)
 *
 * Regras de tratamento:
 * - 204 No Content → retorna null
 * - Resposta JSON (content-type inclui "application/json") → faz res.json(), com fallback seguro
 * - Resposta texto → faz res.text()
 * - 401 Unauthorized → chama ensureToken() e refaz a requisição apenas 1 vez
 * - Demais erros (>=400) → lança Error com message/error do backend ou "HTTP <status>"
 *
 * Observação: quando enviar JSON, serialize o corpo antes (JSON.stringify).
 */
async function request(path, opts = {}) {
  const token = getToken();
  const headers = new Headers(opts.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  // Define JSON por padrão quando há corpo e o chamador não definiu o Content-Type
  if (opts.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  // 204 No Content → sem corpo
  if (res.status === 204) return null;
  // Decide o parse com base no content-type
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => '');
  // Tratamento de erros
  if (!res.ok) {
    // Se 401, pedir/redefinir token e tentar 1x
    if (res.status === 401 && !opts.__retried) {
      await ensureToken(res);
      return request(path, { ...opts, __retried: true });
    }
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/*
 * Cliente simplificado para a API com métodos REST.
 * - post/put: serializam automaticamente o corpo para JSON.
 */
const api = {
  /** @param {string} p */
  get: (p) => request(p),
  /** @param {string} p @param {any} b */
  post: (p, b) => request(p, { method: 'POST', body: JSON.stringify(b) }),
  /** @param {string} p @param {any} b */
  put: (p, b) => request(p, { method: 'PUT', body: JSON.stringify(b) }),
  /** @param {string} p */
  del: (p) => request(p, { method: 'DELETE' })
};

//Referencias ao HTML
//referente a lista de seleção de UF
const ufSel = document.getElementById('uf');
//referente ao campo de inserção de cidade
const cidadeInp = document.getElementById('cidade');
//referente ao botão de adicionar
const btnADD = document.getElementById('btnADD');
//referencias ao campo de pesquisa e botão de pesquisa
const pesquisaInp = document.getElementById('pesquisa');
const btnPesquisar = document.getElementById('btnPesquisar');
//referente a lista de estados e cidades
const lista = document.getElementById('lista');

//Estado local
let ESTADOS = [];
let CIDADES = [];

//Render
/*
 * Renderiza a lista de cidades no <ul id="lista">.
 * Cria elementos: UF, nome, botões Editar/Excluir e associa os handlers.
 */
function renderLista(cidades) {
  lista.innerHTML = '';
  for (const c of cidades) {

    const li = document.createElement('li');
    li.dataset.id = c.id;

    const spanUF = document.createElement('span');
    spanUF.className = 'estado';
    spanUF.textContent = c.estado_uf;

    const spanCidade = document.createElement('span');
    spanCidade.className = 'cidade';
    spanCidade.textContent = c.nome;

    const btnEditar = document.createElement('button');
    btnEditar.className = 'buttonCRUD';
    btnEditar.type = 'button';
    btnEditar.innerHTML = '<i class="fa-solid fa-pen"></i>';
    btnEditar.addEventListener('click', () => editarCidade(c));

    const btnExcluir = document.createElement('button');
    btnExcluir.className = 'buttonCRUD';
    btnExcluir.type = 'button';
    btnExcluir.innerHTML = '<i class="fa-solid fa-trash"></i>';
    btnExcluir.addEventListener('click', () => removerCidade(c.id));

    li.append(spanUF, spanCidade, btnEditar, btnExcluir);
    lista.appendChild(li);
  }
}

/*
 * Aplica filtro de pesquisa por nome de cidade ou UF (case-insensitive)
 * e re-renderiza a lista.
 */
function aplicarFiltro() {
  const q = (pesquisaInp.value || '').trim().toLowerCase();
  const filtradas = q
    ? CIDADES.filter(c =>
        c.nome.toLowerCase().includes(q) ||
        c.estado_uf.toLowerCase().includes(q)
      )
    : CIDADES;
  renderLista(filtradas);
}

//Ações
//Carrega estados da API e preenche o <select id="uf">.

async function carregarEstados() {
  ESTADOS = await api.get('/estados');
  //preenche a seleção com as opções disponiveis no banco de dados
  ufSel.innerHTML = '<option value="" disabled selected>Selecione o Estado (UF)</option>';
  for (const e of ESTADOS) {
    const opt = document.createElement('option');
    opt.value = e.uf;
    opt.textContent = `${e.uf} - ${e.nome}`;
    ufSel.appendChild(opt);
  }
}

//Carrega cidades da API (limit=1000), aplica o filtro e renderiza.
async function carregarCidades() {
  CIDADES = await api.get('/cidades?limit=1000');
  aplicarFiltro();
}

/*
 * Adiciona uma nova cidade (nome + UF) via API e atualiza a lista.
 * Valida campos e exibe feedbacks via alert.
 */
async function adicionarCidade() {
  const nome = (cidadeInp.value || '').trim();
  const estado_uf = (ufSel.value || '').trim().toUpperCase();

  if (!estado_uf) return alert('Selecione a UF');
  if (!nome) return alert('Informe o nome da cidade');

  try {
    await api.post('/cidades', { nome, estado_uf });
    cidadeInp.value = '';
    await carregarCidades();
    alert('Cidade adicionada!');
  } catch (e) {
    alert(e.message || 'Erro ao adicionar cidade');
  }
}

//Edita uma cidade existente solicitando novos valores via prompt.
async function editarCidade(c) {
  const novoNome = prompt('Novo nome da cidade:', c.nome);
  if (novoNome === null) return;

  const novaUF = prompt('Nova UF (ex.: SP):', c.estado_uf);
  if (novaUF === null) return;

  try {
    await api.put(`/cidades/${c.id}`, {
      nome: String(novoNome).trim(),
      estado_uf: String(novaUF).trim().toUpperCase()
    });
    await carregarCidades();
    alert('Cidade atualizada!');
  } catch (e) {
    alert(e.message || 'Erro ao atualizar cidade');
  }
}

//Remove uma cidade após confirmação do usuário.
async function removerCidade(id) {
  if (!confirm('Confirma remover a cidade?')) return;
  try {
    await api.del(`/cidades/${id}`);
    await carregarCidades();
    alert('Cidade removida!');
  } catch (e) {
    alert(e.message || 'Erro ao remover cidade');
  }
}

//Eventos
//Botões e inputs: adicionar e pesquisar (live-search no input)
btnADD.addEventListener('click', adicionarCidade);
btnPesquisar.addEventListener('click', aplicarFiltro);
pesquisaInp.addEventListener('input', aplicarFiltro);

//Boot
/*
 * Inicialização da página:
 * - Garante token (pede via prompt se necessário)
 * - Carrega estados e cidades
 * - Em caso de falha, mostra alerta de diagnóstico
 */
(async function init() {
  try {
    if (!getToken()) await ensureToken();
    await carregarEstados();
    await carregarCidades();
  } catch (e) {
    console.error(e);
    alert('Erro ao inicializar. Verifique se o servidor está rodando e informe o API_TOKEN.');
  }
})();