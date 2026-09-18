import { readFileSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const dados = JSON.parse(readFileSync(join(raiz, "fonte", "dados-grupos-2027.json"), "utf8"));
const saida = join(raiz, "resultado-grupos");
const cssHome = "estilos.css";
const cssGrupo = "../../estilos.css";
const css404 = "resultado-grupos/estilos.css";

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
  const detalhes = detalhesDaFaixa(grupo.beneficios_do_grupo, dados.como_funciona_cada_beneficio);
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

  const listaPagos = pagos.length
    ? pagos.map((m) => `          <li class="pessoa pago"><span class="nome">${esc(m.nome)}</span><span class="meta">${esc(m.plano || "Pago")}</span></li>`).join("\n")
    : `          <li class="vazio">Nenhuma inscrição paga nesta lista.</li>`;

  const listaNao = naoPagos.length
    ? naoPagos.map((m) => {
        const cancelado = /cancelado/i.test(m.status);
        return `          <li class="pessoa ${cancelado ? "cancelado" : "nao-pago"}"><span class="nome">${esc(m.nome)}</span><span class="meta">${esc(m.status)}</span></li>`;
      }).join("\n")
    : `          <li class="vazio">Ninguém nesta lista.</li>`;

  const bens = grupo.beneficios_do_grupo.map((b) => {
    const sorteio = ehSorteio(b, grupo.sorteios_a_realizar);
    return `        <li${sorteio ? ' class="sorteio"' : ""}>${esc(b)}${sorteio ? '<span class="tag-sorteio">Sorteio</span>' : ""}</li>`;
  }).join("\n");

  const sorteios = grupo.sorteios_a_realizar.map((s) => `        <li>${esc(s)}</li>`).join("\n");
  const detalhesHtml = detalhes.map(([nome, texto]) => `        <article class="detalhe"><h3>${esc(nome)}</h3><p>${esc(texto)}</p></article>`).join("\n");
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
      <p class="aviso">As inscrições estão encerradas e a faixa do seu grupo está fechada.</p>
      ${grupo.totais.lider_conta_na_faixa ? '<p class="aviso pequeno">A contagem inclui a sua própria inscrição.</p>' : ""}
    </div>
  </section>

  <section class="bloco">
    <div class="wrap">
      <h2>Pessoas do grupo</h2>
      <div class="listas">
        <div>
          <h3 class="lista-titulo">Pagos <span class="cont">${pagos.length}</span></h3>
          <ul class="pessoas pagos">
${listaPagos}
          </ul>
        </div>
        <div>
          <h3 class="lista-titulo">Ainda não pagos <span class="cont">${naoPagos.length}</span></h3>
          <ul class="pessoas">
${listaNao}
          </ul>
          <p class="aviso">As inscrições estão encerradas. Quem não está pago não conta para a faixa do grupo e não participa dos sorteios.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="bloco">
    <div class="wrap">
      <h2>Benefícios do grupo</h2>
      <ul class="bens">
${bens}
      </ul>
      ${detalhesHtml ? `<div class="detalhes">
${detalhesHtml}
      </div>` : ""}
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

mkdirSync(saida, { recursive: true });
writeFileSync(join(saida, "index.html"), paginaHome());

const pastaGrupos = join(saida, "grupo");
rmSync(pastaGrupos, { recursive: true, force: true });
mkdirSync(pastaGrupos, { recursive: true });

for (const grupo of dados.grupos) {
  const pasta = join(pastaGrupos, grupo.slug);
  mkdirSync(pasta, { recursive: true });
  const html = paginaGrupo(grupo);
  if (html.includes(grupo.lider.email) || html.includes(grupo.lider.telefone)) {
    throw new Error(`Vazou contato em ${grupo.slug}`);
  }
  writeFileSync(join(pasta, "index.html"), html);
}

writeFileSync(join(raiz, "404.html"), pagina404());

console.log(`Geradas ${dados.grupos.length} páginas de grupo.`);
