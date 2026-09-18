import { readFileSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const dados = JSON.parse(readFileSync(join(raiz, "fonte", "dados-grupos-2027.json"), "utf8"));
const saida = join(raiz, "resultado-grupos");
const cssHome = "estilos.css";
const cssGrupo = "../../estilos.css";
const cssTurma = "../../../estilos.css";
const css404 = "resultado-grupos/estilos.css";
const PRIMEIRO_40 = "visionarias-em-acao-dfb7eb";

function esc(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatarData(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${dia} de ${meses[mes - 1]} de ${ano}`;
}

function faixaVinteOuMais(faixa) {
  return faixa !== "10 a 19";
}

function ehSorteio(beneficio, sorteios) {
  if (/\(sorteio\)/i.test(beneficio)) return true;
  const texto = beneficio.toLowerCase();
  return sorteios.some((item) => {
    const s = item.toLowerCase();
    return texto.includes(s) || s.includes(texto.replace(/\s*\(sorteio\)\s*$/i, ""));
  });
}

const mapaBeneficios = [
  { chave: "Credenciamento exclusivo", teste: (b) => /credenciamento/i.test(b) },
  { chave: "Master Class exclusiva", teste: (b) => /master class/i.test(b) },
  { chave: "Camiseta exclusiva do grupo", teste: (b) => /camiseta/i.test(b) },
  { chave: "Novos Talentos", teste: (b) => /novos talentos/i.test(b) },
  { chave: "Voucher Pratyque", teste: (b) => /pratyque/i.test(b) },
  { chave: "Kit Equipilates", teste: (b) => /equipilates/i.test(b) },
  { chave: "Workshop extra exclusivo", teste: (b) => /workshop extra/i.test(b) },
  { chave: "Visita ao backstage e foto com palestrante", teste: (b) => /backstage/i.test(b) },
];

function detalhesDaFaixa(beneficios, mapa) {
  return mapaBeneficios
    .filter(({ teste }) => beneficios.some(teste))
    .map(({ chave }) => [chave, mapa[chave]])
    .filter(([, texto]) => texto);
}

function destaquePrimeiro40(grupo) {
  if (grupo.slug !== PRIMEIRO_40) return "";
  return `      <div class="marco">
        <span class="selo">Primeiro grupo a 40</span>
        <p>Este foi o primeiro grupo a chegar a 40 inscrições pagas. Por isso, vocês têm lugar marcado juntos na abertura e no encerramento.</p>
      </div>
`;
}

function listaNomes(pessoas, classe) {
  if (!pessoas.length) return `          <li class="vazio">Ninguém nesta lista.</li>`;
  return pessoas.map((m) => {
    const cancelado = /cancelado/i.test(m.status || "");
    const extra = classe === "nao-pago" && cancelado ? " cancelado" : "";
    return `          <li class="pessoa ${classe}${extra}"><span class="nome">${esc(m.nome)}</span></li>`;
  }).join("\n");
}

function blocoBeneficios(grupo, { esconderCortesia = false } = {}) {
  const lista = esconderCortesia
    ? grupo.beneficios_do_grupo.filter((b) => !/cortesia/i.test(b))
    : grupo.beneficios_do_grupo;
  const bens = lista.map((b) => {
    const sorteio = ehSorteio(b, grupo.sorteios_a_realizar);
    return `        <li${sorteio ? ' class="sorteio"' : ""}>${esc(b)}${sorteio ? '<span class="tag-sorteio">Sorteio</span>' : ""}</li>`;
  }).join("\n");
  const detalhes = detalhesDaFaixa(lista, dados.como_funciona_cada_beneficio);
  const detalhesHtml = detalhes.map(([nome, texto]) => `        <article class="detalhe"><h3>${esc(nome)}</h3><p>${esc(texto)}</p></article>`).join("\n");
  return `      <ul class="bens">
${bens}
      </ul>
      ${detalhesHtml ? `<div class="detalhes">
${detalhesHtml}
      </div>` : ""}`;
}

function cabeca(titulo, noindex, cssHref) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${noindex ? '<meta name="robots" content="noindex, nofollow, noarchive">\n' : '<meta name="robots" content="noindex, nofollow">\n'}<title>${esc(titulo)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${cssHref}">
</head>
<body>
`;
}

const rodape = `  <footer class="rodape">
    <div class="wrap">
      <p>Dúvida sobre qualquer ponto, pergunte antes de combinar com o seu grupo.</p>
    </div>
  </footer>
</body>
</html>
`;

function paginaHome() {
  return `${cabeca("Painel do líder | 12º Encontro Brasileiro de Pilates 2027", false, cssHome)}  <header class="topo">
    <div class="wrap">
      <p class="marca">12º Encontro Brasileiro de Pilates</p>
    </div>
  </header>
  <main class="neutra">
    <div class="wrap">
      <h1>O acesso ao painel do seu grupo é pelo link direto.</h1>
      <p>Se você liderou um grupo no 12º Encontro, use o endereço que a VOLL enviou. Esta página não lista grupos e não substitui o link individual.</p>
    </div>
  </main>
${rodape}`;
}

function pagina404() {
  return `${cabeca("Link não encontrado | 12º Encontro Brasileiro de Pilates 2027", true, css404)}  <header class="topo">
    <div class="wrap">
      <p class="marca">12º Encontro Brasileiro de Pilates</p>
    </div>
  </header>
  <main class="neutra">
    <div class="wrap">
      <h1>Esse link não existe.</h1>
      <p>Confira o endereço que você recebeu. Se o problema continuar, fale com quem te enviou o link.</p>
    </div>
  </main>
${rodape}`;
}

function paginaGrupo(grupo) {
  const pagos = grupo.membros.filter((m) => m.pago);
  const naoPagos = grupo.membros.filter((m) => !m.pago);
  const vinteMais = faixaVinteOuMais(grupo.faixa);
  const prazos = dados.prazos.map((item) => {
    const camiseta = /camiseta/i.test(item.o_que);
    const destaque = camiseta && vinteMais;
    return `        <div class="prazo${destaque ? " destaque" : ""}">
          <span class="quando">${esc(formatarData(item.data))}</span>
          <span class="oque">${esc(item.o_que)}</span>
        </div>`;
  }).join("\n");

  const checklist = [
    "Avisar o grupo da faixa alcançada e do que ele conquistou",
    vinteMais ? "Recolher os tamanhos de camiseta P, M e G com o grupo" : null,
    "Marcar data e horário do sorteio dentro da janela de 3 e 4 de novembro",
    "Realizar os sorteios ao vivo, um prêmio por pessoa",
    "Enviar ao time VOLL o nome dos sorteados e o prêmio de cada um",
    vinteMais ? "Enviar a quantidade de camisetas por tamanho até 5 de novembro" : null,
    "Definir o destino dos ingressos de cortesia e enviar os dados completos de cada pessoa",
    "Confirmar com o time VOLL a própria inscrição, conforme o benefício da faixa",
  ].filter(Boolean);

  const sorteios = grupo.sorteios_a_realizar.map((s) => `        <li>${esc(s)}</li>`).join("\n");
  const dadosCortesia = dados.regras.dados_da_cortesia.map((d) => `<li>${esc(d)}</li>`).join("");

  return `${cabeca(`Grupo de ${grupo.lider.nome} | 12º Encontro Brasileiro de Pilates 2027`, true, cssGrupo)}  <header class="topo">
    <div class="wrap">
      <p class="marca">12º Encontro Brasileiro de Pilates</p>
      <h1>Grupo de ${esc(grupo.lider.nome)}</h1>
      <p class="sub">27, 28 e 29 de agosto de 2027 · Expo Dom Pedro, Campinas, SP</p>
      <p class="atualizado">Atualizado em ${esc(formatarData(dados.atualizado_em))}</p>
    </div>
  </header>

  <section class="bloco">
    <div class="wrap">
      <div class="numeros">
        <article class="card-num">
          <span class="rotulo">inscrições pagas</span>
          <span class="num">${esc(grupo.totais.pagos_no_grupo)}</span>
        </article>
        <article class="card-num faixa">
          <span class="rotulo">faixa alcançada</span>
          <span class="num">${esc(grupo.faixa)}</span>
        </article>
        <article class="card-num">
          <span class="rotulo">ingressos de cortesia</span>
          <span class="num">${esc(grupo.ingressos_cortesia)}</span>
        </article>
      </div>
${destaquePrimeiro40(grupo)}      <p class="aviso">As inscrições estão encerradas e a faixa do seu grupo está fechada.</p>
      ${grupo.totais.lider_conta_na_faixa ? '<p class="aviso pequeno">A contagem inclui a sua própria inscrição.</p>' : ""}
      <div class="link-turma">
        <p>Página para enviar ao grupo, sem a lista de quem não pagou e sem as tarefas que são só suas:</p>
        <a href="turma/">Abrir a página da turma</a>
      </div>
    </div>
  </section>

  <section class="bloco">
    <div class="wrap">
      <h2>Pessoas do grupo</h2>
      <div class="listas">
        <div>
          <h3 class="lista-titulo">Pagos <span class="cont">${pagos.length}</span></h3>
          <ul class="pessoas pagos">
${listaNomes(pagos, "pago")}
          </ul>
        </div>
        <div>
          <h3 class="lista-titulo">Ainda não pagos <span class="cont">${naoPagos.length}</span></h3>
          <ul class="pessoas">
${listaNomes(naoPagos, "nao-pago")}
          </ul>
          <p class="aviso">As inscrições estão encerradas. Quem não está pago não conta para a faixa do grupo e não participa dos sorteios.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="bloco">
    <div class="wrap">
      <h2>Benefícios do grupo</h2>
${blocoBeneficios(grupo)}
    </div>
  </section>

  <section class="bloco">
    <div class="wrap">
      <h2>Sorteios que você precisa realizar <span class="cont">${grupo.sorteios_a_realizar.length}</span></h2>
      <ul class="bens">
${sorteios}
      </ul>
      <div class="regras">
        <h3>Regras do sorteio</h3>
        <ul>
          <li>Quem conduz: você, ao vivo, de forma que todo o grupo possa ver. Papel ou sorteador eletrônico.</li>
          <li>Quando: entre 3 e 4 de novembro de 2026.</li>
          <li>Quem participa: as ${esc(grupo.pessoas_no_sorteio)} pessoas pagas do grupo.</li>
          <li>O líder não entra no sorteio do próprio grupo.</li>
          <li>Cada pessoa só pode receber um prêmio.</li>
          <li>Inadimplentes perdem o direito aos prêmios.</li>
          <li>Depois de sortear, enviar ao time VOLL o nome de cada sorteado e o prêmio que levou.</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="bloco">
    <div class="wrap">
      <h2>Seus benefícios como líder</h2>
      <div class="lider-card">
        <p class="nome">${esc(grupo.lider.nome)}</p>
        <p class="faixa">Faixa ${esc(grupo.faixa)}</p>
        <p>${esc(grupo.lider.beneficio)}</p>
        <div class="cortesias">
          <p><strong>${esc(grupo.ingressos_cortesia)} ${grupo.ingressos_cortesia === 1 ? "ingresso" : "ingressos"} Standard de cortesia</strong>, de propriedade do líder. Você decide o destino: usar para si ou sortear.</p>
          <p>Dados exigidos por pessoa:</p>
          <ul>${dadosCortesia}</ul>
        </div>
      </div>
    </div>
  </section>

  <section class="bloco">
    <div class="wrap">
      <h2>Prazos</h2>
      <div class="prazos">
${prazos}
      </div>
    </div>
  </section>

  <section class="bloco">
    <div class="wrap">
      <h2>Checklist</h2>
      <ul class="check">
        ${checklist.map((item) => `<li><span class="box" aria-hidden="true"></span><span>${esc(item)}</span></li>`).join("\n        ")}
      </ul>
    </div>
  </section>

${rodape}`;
}

function paginaTurma(grupo) {
  const pagos = grupo.membros.filter((m) => m.pago);
  const vinteMais = faixaVinteOuMais(grupo.faixa);
  const sorteios = grupo.sorteios_a_realizar.map((s) => `        <li>${esc(s)}</li>`).join("\n");

  return `${cabeca(`Grupo de ${grupo.lider.nome} | 12º Encontro Brasileiro de Pilates 2027`, true, cssTurma)}  <header class="topo">
    <div class="wrap">
      <p class="marca">12º Encontro Brasileiro de Pilates</p>
      <h1>Grupo de ${esc(grupo.lider.nome)}</h1>
      <p class="sub">27, 28 e 29 de agosto de 2027 · Expo Dom Pedro, Campinas, SP</p>
      <p class="atualizado">Atualizado em ${esc(formatarData(dados.atualizado_em))}</p>
    </div>
  </header>

  <section class="bloco">
    <div class="wrap">
      <div class="numeros">
        <article class="card-num">
          <span class="rotulo">inscrições pagas</span>
          <span class="num">${esc(grupo.totais.pagos_no_grupo)}</span>
        </article>
        <article class="card-num faixa">
          <span class="rotulo">faixa alcançada</span>
          <span class="num">${esc(grupo.faixa)}</span>
        </article>
      </div>
${destaquePrimeiro40(grupo)}      <p class="aviso">As inscrições estão encerradas e a faixa do grupo está fechada.</p>
    </div>
  </section>

  <section class="bloco">
    <div class="wrap">
      <h2>Quem está no grupo <span class="cont">${pagos.length}</span></h2>
      <ul class="pessoas pagos">
${listaNomes(pagos, "pago")}
      </ul>
    </div>
  </section>

  <section class="bloco">
    <div class="wrap">
      <h2>O que o grupo conquistou</h2>
${blocoBeneficios(grupo, { esconderCortesia: true })}
    </div>
  </section>

  <section class="bloco">
    <div class="wrap">
      <h2>Sorteios do grupo <span class="cont">${grupo.sorteios_a_realizar.length}</span></h2>
      <ul class="bens">
${sorteios}
      </ul>
      <div class="regras">
        <h3>Como funciona o sorteio</h3>
        <ul>
          <li>Acontece ao vivo, entre 3 e 4 de novembro de 2026, para todo o grupo ver.</li>
          <li>Participa quem está com a inscrição paga.</li>
          <li>Cada pessoa pode receber apenas um prêmio.</li>
        </ul>
      </div>
      ${vinteMais ? '<p class="aviso">Se o líder pedir, informe o tamanho da camiseta: P, M ou G.</p>' : ""}
    </div>
  </section>

${rodape}`;
}

mkdirSync(saida, { recursive: true });
writeFileSync(join(saida, "index.html"), paginaHome());

const pastaGrupos = join(saida, "grupo");
rmSync(pastaGrupos, { recursive: true, force: true });
mkdirSync(pastaGrupos, { recursive: true });

for (const grupo of dados.grupos) {
  const pasta = join(pastaGrupos, grupo.slug);
  mkdirSync(pasta, { recursive: true });
  const htmlLider = paginaGrupo(grupo);
  const htmlTurma = paginaTurma(grupo);
  for (const html of [htmlLider, htmlTurma]) {
    if (html.includes(grupo.lider.email) || html.includes(grupo.lider.telefone)) {
      throw new Error(`Vazou contato em ${grupo.slug}`);
    }
  }
  const naoPagos = grupo.membros.filter((m) => !m.pago);
  for (const m of naoPagos) {
    if (m.nome && htmlTurma.includes(m.nome)) {
      throw new Error(`Turma de ${grupo.slug} mostra não pago: ${m.nome}`);
    }
  }
  if (htmlTurma.includes("Checklist") || htmlTurma.includes("Seus benefícios como líder") || htmlTurma.includes("Ainda não pagos") || htmlTurma.includes("Dados exigidos")) {
    throw new Error(`Turma de ${grupo.slug} tem conteúdo de líder`);
  }
  writeFileSync(join(pasta, "index.html"), htmlLider);
  mkdirSync(join(pasta, "turma"), { recursive: true });
  writeFileSync(join(pasta, "turma", "index.html"), htmlTurma);
}

writeFileSync(join(raiz, "404.html"), pagina404());

console.log(`Geradas ${dados.grupos.length} páginas de líder e ${dados.grupos.length} páginas da turma.`);
