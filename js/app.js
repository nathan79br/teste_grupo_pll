// public/js/app.js
const API_BASE = '/api'; // ex.: http://localhost:3000
const TOKEN_KEY = 'api_token_dev';

// --------------- Token (dev) ---------------
//função para pegar o token
function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}
function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}
async function ensureToken(e) {
  let t = getToken();
  if (!t || (e && e.status === 401)) {
    t = prompt('Informe seu API_TOKEN (Bearer):') || '';
    if (!t) throw new Error('API_TOKEN não informado');
    setToken(t.trim());
  }
  return t.trim();
}

// --------------- HTTP helpers ---------------
async function request(path, opts = {}) {
  const token = getToken();
  const headers = new Headers(opts.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (opts.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (res.status === 204) return null;

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => '');

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

const api = {
  get: (p) => request(p),
  post: (p, b) => request(p, { method: 'POST', body: JSON.stringify(b) }),
  put: (p, b) => request(p, { method: 'PUT', body: JSON.stringify(b) }),
  del: (p) => request(p, { method: 'DELETE' })
};

// --------------- Referencias ao HTML ---------------
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

// --------------- Estado local ---------------
let ESTADOS = [];
let CIDADES = [];

// --------------- Render ---------------
//função que cria elementos na lista 
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

// --------------- Ações ---------------
async function carregarEstados() {
  ESTADOS = await api.get('/estados');
  // Preenche o select
  ufSel.innerHTML = '<option value="" disabled selected>Selecione o Estado (UF)</option>';
  for (const e of ESTADOS) {
    const opt = document.createElement('option');
    opt.value = e.uf;
    opt.textContent = `${e.uf} - ${e.nome}`;
    ufSel.appendChild(opt);
  }
}

async function carregarCidades() {
  CIDADES = await api.get('/cidades?limit=1000');
  aplicarFiltro();
}

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

// --------------- Eventos ---------------
btnADD.addEventListener('click', adicionarCidade);
btnPesquisar.addEventListener('click', aplicarFiltro);
pesquisaInp.addEventListener('input', aplicarFiltro);

// --------------- Boot ---------------
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