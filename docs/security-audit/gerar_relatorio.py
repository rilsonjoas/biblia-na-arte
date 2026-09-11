#!/usr/bin/env python3
"""
Gerador do Relatório de Auditoria de Segurança — Bíblia na Arte
(api Fastify/Drizzle + web React/Vite).

Rodar com o venv local (não instala nada globalmente):
    ./.venv/bin/python gerar_relatorio.py

Regenerar depois de nova auditoria: só editar FINDINGS/STRENGTHS/
RECOMMENDATIONS/ISSUES abaixo e rodar de novo — sobrescreve o PDF no
mesmo caminho.
"""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table,
    TableStyle, Image, PageBreak, HRFlowable, KeepTogether
)
from reportlab.pdfgen import canvas as pdfcanvas

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_PDF = os.path.join(HERE, "relatorio-auditoria-seguranca.pdf")


def esc(text: str) -> str:
    """Escapa &, < e > pra texto dinâmico entrar num Paragraph do reportlab
    sem ser interpretado como tag XML (ex.: '<Chart' ou '<script>' no meio
    de uma descrição em português quebrava o parser)."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

# ---------------------------------------------------------------- paleta ----
SEV_COLORS = {
    "Crítica": "#B91C1C",
    "Alta": "#EA580C",
    "Média": "#D97706",
    "Baixa": "#2563EB",
    "Informativa": "#64748B",
}
STRONG_COLOR = "#059669"
INK = "#1E2430"
MUTED = "#5B6472"
LINE = "#DDE3EA"
BG_SOFT = "#F4F6F8"

# ---------------------------------------------------------------- dados -----
PROJECT = "Bíblia na Arte"
SCOPE = (
    "Monorepo biblia-na-arte (server/ Fastify 5 + Drizzle ORM + Postgres + "
    "@fastify/jwt, web/ React + Vite). Escopo: todas as 27 rotas de "
    "server/src/routes (8 arquivos), Policies/guards de auth "
    "(plugins/jwt-auth.ts, plugins/security.ts), queries do Drizzle "
    "(db/queries.ts), fluxo de submissão pública de artistas e upload de "
    "imagem, painel admin do app web (contexts, rotas protegidas) e "
    "superfície de renderização de conteúdo (Markdown/HTML)."
)
METHOD_NOTE = (
    "Mecanismo de isolamento de tenant/RLS: <b>não se aplica</b> — não há "
    "conta de usuário final nem dado multi-tenant; é um catálogo curado "
    "com um único time de staff (admin/revisor) que compartilha acesso "
    "total por design (achado confirmado: todas as rotas de escrita "
    "vivem só em admin.ts e submissions.ts, as outras 6 são 100% "
    "leitura pública). O equivalente real de fronteira de autorização de "
    "dado é o filtro <b>active = true</b> (obra removida por auditoria de "
    "direitos autorais não pode aparecer em rota pública) — verificado em "
    "toda query pública encontrada. \"Permissão no navegador\" mapeada "
    "para o par frontend (user?.role === 'admin', AdminProtectedRoute) × "
    "backend (authenticate/requireAdmin do @fastify/jwt, revalidado "
    "contra o banco a cada request). IDOR percorrido em toda rota "
    "com parâmetro de rota/arquivo. XSS mapeado pra stack real (React web, "
    "não app nativo): dangerouslySetInnerHTML, libs de markdown/"
    "sanitização e templates HTML no backend."
)

FINDINGS = [
    {
        "id": "B1",
        "severity": "Informativa",
        "category": "Inputs sem tratamento (equiv. XSS) / housekeeping",
        "file": "web/src/components/ui/chart.tsx",
        "lines": "77–95",
        "title": "dangerouslySetInnerHTML em componente shadcn não utilizado + pasta de admin Supabase morta ainda no repositório",
        "desc": (
            "ChartStyle usa dangerouslySetInnerHTML pra gerar um <style> a "
            "partir de config.theme/config.color (boilerplate padrão do "
            "shadcn/ui, instalado mas nunca importado — busca por <Chart "
            "em todo web/src/pages e web/src/components não encontrou "
            "nenhum uso). Sem exploração possível hoje: não há dado de "
            "usuário/API alimentando esse config em lugar nenhum do "
            "código atual. Junto: web/src/_archived-supabase-admin/ "
            "(auth antiga via Supabase, morta em 2026-08-07 segundo "
            "comentário do AdminAuthContext.tsx atual) continua no "
            "repositório — confirmado que nenhum arquivo vivo importa "
            "dessa pasta (só uma menção em comentário, não import real)."
        ),
        "code": (
            "// web/src/components/ui/chart.tsx\n"
            "<style\n"
            "  dangerouslySetInnerHTML={{\n"
            "    __html: Object.entries(THEMES).map(([theme, prefix]) => `\n"
            "      ${prefix} [data-chart=${id}] { ... ${itemConfig.color} ... }\n"
            "    `).join('\\n'),\n"
            "  }}\n"
            "/>\n"
            "// nunca importado: grep por \"<Chart\" em src/pages e src/components → 0 resultados"
        ),
        "impact": (
            "Nenhum hoje. Se o componente Chart for adotado no futuro com "
            "config vindo de dado dinâmico (ex.: nome de tema/cor definido "
            "por conteúdo do vault ou input futuro), o dangerouslySetInnerHTML "
            "atual injetaria isso sem sanitização numa tag <style> sem "
            "revisão adicional — é um código morto com um padrão sensível "
            "embutido, não uma vulnerabilidade ativa."
        ),
        "fix": (
            "Remover o componente Chart não utilizado e a pasta "
            "_archived-supabase-admin/ do repositório — reduz superfície "
            "de código que precisaria ser reauditado se algum dia for "
            "religado por engano. Se decidir manter o Chart pra uso "
            "futuro, trocar a geração de CSS por propriedades customizadas "
            "via style do React em vez de string HTML crua."
        ),
    },
]

STRENGTHS = [
    ("Fronteira pública verificada em toda query",
     "eq(artworks.active, true) (ou WHERE active no SQL bruto do Drizzle) aparece em "
     "TODA query pública encontrada em db/queries.ts — obra removida por auditoria de "
     "direitos autorais nunca aparece em rota pública, checado ponto a ponto."),
    ("Parte administrativa 100% isolada das rotas públicas",
     "As 27 rotas do server vivem em 8 arquivos; escrita (POST/PATCH/DELETE) só existe "
     "em admin.ts (atrás de authenticate/requireAdmin) e submissions.ts (1 endpoint "
     "público, rate-limited, só cria linha pendente). As outras 6 são 100% GET público."),
    ("JWT revalidado contra o banco a cada requisição",
     "authenticate/requireAdmin não confiam só na assinatura do token — fazem "
     "findUserById a cada chamada, então apagar um usuário ou trocar seu papel "
     "revoga acesso na hora, não só quando o token de 7 dias expirar sozinho."),
    ("Paridade UI (frontend) × guard (backend)",
     "canApprove = user?.role === 'admin' e AdminProtectedRoute (requireAdminRole) no "
     "app web batem 1:1 com preHandler: app.requireAdmin nas rotas /admin/submissions/"
     ":id/approve e /admin/users — nenhuma ação admin-only depende só da UI escondida."),
    ("Senha com scrypt + comparação constant-time",
     "hashPassword/verifyPassword (lib/auth.ts) usam scryptSync com salt aleatório de "
     "16 bytes e timingSafeEqual pra comparar o hash — sem vazar diferença de tempo, "
     "sem dependência nova só pra isso."),
    ("Boot falha rápido sem segredo mal configurado",
     "config.ts valida JWT_SECRET (mínimo 32 caracteres, sem valor-default) e "
     "DATABASE_URL via Zod no boot — processo sai com process.exit(1) e mensagem "
     "clara em vez de rodar em produção com config inválida."),
    ("Path traversal bloqueado explicitamente no serving de imagem",
     "GET /uploads/:filename rejeita qualquer filename com '/' ou '..' antes de montar "
     "o path no disco, e só serve do diretório de obras JÁ APROVADAS — imagem de "
     "submissão pendente fica numa rota separada, atrás de authenticate."),
    ("XSS coberto por Markdown seguro, com teste próprio provando isso",
     "Todo texto rico (artwork.description, artwork.classicCommentary, "
     "ref.passageText, artist.bio) passa pelo componente Markdown (react-markdown "
     "sem plugin rehype-raw, então HTML cru vem escapado por padrão). "
     "markdown.test.tsx testa literalmente <script>alert('x')</script> e confirma "
     "que não executa — verificado no próprio código, não é achado só desta auditoria."),
    ("Consultas parametrizadas mesmo no SQL bruto",
     "Onde o query builder do Drizzle não bastava (busca full-text, agregações), o SQL "
     "usa a tagged template sql`...${valor}...` — que parametriza cada interpolação "
     "de verdade (via postgres.js). Nenhum uso de sql.raw() encontrado no projeto."),
    ("Mensagem de erro de login genérica",
     "POST /admin/login devolve a mesma mensagem pra e-mail inexistente e senha "
     "errada — não dá pra enumerar quais e-mails têm conta só pelo comportamento do "
     "endpoint."),
    ("Proteção contra autolockout de administrador",
     "DELETE /admin/users/:id bloqueia apagar a própria conta logada e bloqueia "
     "apagar o último admin restante — sem isso seria possível zerar o painel sem "
     "ninguém conseguir recriar acesso."),
]

RECOMMENDATIONS = [
    ("P1", "(opcional, baixo esforço) Remover código morto sensível (B1)",
     "chart.tsx (dangerouslySetInnerHTML não usado) e "
     "_archived-supabase-admin/ (auth antiga, sem import real) — nenhum "
     "dos dois é explorável hoje, mas remover fecha a possibilidade de "
     "alguém religar por engano no futuro sem revisão de segurança."),
]

ISSUES = [
    {
        "title": "[Housekeeping] Remover componente shadcn Chart não utilizado e pasta de admin Supabase arquivada",
        "labels": "security, severidade:informativa, housekeeping",
        "body": (
            "**Problema**\n\n"
            "Dois itens de código morto encontrados durante auditoria de segurança, "
            "nenhum explorável hoje, mas ambos carregam um padrão que merece revisão "
            "se algum dia forem religados sem essa auditoria por perto:\n\n"
            "**1. `web/src/components/ui/chart.tsx:77-95`** — `ChartStyle` usa "
            "`dangerouslySetInnerHTML` pra gerar um `<style>` a partir de "
            "`config.theme`/`config.color`. Boilerplate padrão do shadcn/ui, "
            "instalado mas **nunca importado** (`grep \"<Chart\"` em todo "
            "`web/src/pages` e `web/src/components` → 0 resultados).\n\n"
            "**2. `web/src/_archived-supabase-admin/`** — autenticação antiga via "
            "Supabase, morta desde 2026-08-07 (comentário em "
            "`AdminAuthContext.tsx` confirma). Nenhum arquivo vivo importa dessa "
            "pasta — só uma menção em comentário.\n\n"
            "**Por que vale remover**\n\n"
            "Nenhum dos dois é explorável no estado atual (sem dado dinâmico "
            "alimentando o Chart, sem rota/import ativo pro admin antigo). Mas "
            "código morto com um padrão sensível embutido (`dangerouslySetInnerHTML`, "
            "um segundo sistema de auth completo) é o tipo de coisa que passa "
            "despercebido numa reintrodução acidental (ex.: alguém copia um exemplo "
            "do shadcn docs que usa `<Chart>` com config vindo de API, ou reimporta "
            "algo do admin antigo achando que é só um componente de UI).\n\n"
            "**Evidência**\n\n"
            "```tsx\n"
            "<style\n"
            "  dangerouslySetInnerHTML={{\n"
            "    __html: Object.entries(THEMES).map(([theme, prefix]) => `...`).join('\\n'),\n"
            "  }}\n"
            "/>\n"
            "```\n\n"
            "**Impacto**\n\n"
            "Nenhum hoje. Risco é só de reintrodução futura sem revisão.\n\n"
            "**Sugestão de correção**\n\n"
            "- Remover `web/src/components/ui/chart.tsx` (e o import do pacote "
            "`recharts` associado, se não usado em outro lugar) caso nenhum gráfico "
            "esteja planejado no roadmap próximo. Se estiver, trocar a geração de "
            "CSS por propriedades customizadas via `style` do React.\n"
            "- Remover `web/src/_archived-supabase-admin/` — já cumpriu o papel de "
            "referência histórica durante a migração pro JWT próprio.\n\n"
            "**Critérios de aceite**\n\n"
            "- [ ] `chart.tsx` removido ou sua geração de CSS deixa de usar "
            "`dangerouslySetInnerHTML`.\n"
            "- [ ] `_archived-supabase-admin/` removida do repositório.\n"
            "- [ ] Build e testes do `web/` continuam passando sem os dois.\n"
        ),
    },
]

# ---------------------------------------------------------- gráficos --------

def make_donut(path):
    order = ["Crítica", "Alta", "Média", "Baixa", "Informativa"]
    counts = {s: 0 for s in order}
    for f in FINDINGS:
        counts[f["severity"]] += 1
    labels, values, colors_ = [], [], []
    for s in order:
        if counts[s] > 0:
            labels.append(f"{s} ({counts[s]})")
            values.append(counts[s])
            colors_.append(SEV_COLORS[s])

    fig, ax = plt.subplots(figsize=(4.6, 4.0), dpi=200)
    wedges, _ = ax.pie(
        values, colors=colors_, startangle=90, counterclock=False,
        wedgeprops=dict(width=0.42, edgecolor="white", linewidth=2),
    )
    ax.legend(
        wedges, labels, loc="center left", bbox_to_anchor=(1.0, 0.5),
        frameon=False, fontsize=10, labelcolor=INK,
    )
    ax.text(0, 0.06, str(len(FINDINGS)), ha="center", va="center",
            fontsize=26, fontweight="bold", color=INK)
    ax.text(0, -0.18, "achado" if len(FINDINGS) == 1 else "achados",
            ha="center", va="center", fontsize=10, color=MUTED)
    ax.set_title("Achados por severidade", fontsize=12, color=INK, pad=14, loc="left")
    fig.tight_layout()
    fig.savefig(path, transparent=True, bbox_inches="tight")
    plt.close(fig)


def make_bars(path):
    cats = ["Isolamento\n/ tenant", "Permissão\nno navegador", "IDOR",
            "Chaves\nexpostas", "Inputs sem\ntratamento"]
    keymap = {
        "Isolamento\n/ tenant": [],
        "Permissão\nno navegador": [],
        "IDOR": [],
        "Chaves\nexpostas": [],
        "Inputs sem\ntratamento": ["Inputs sem tratamento (equiv. XSS) / housekeeping"],
    }
    counts = []
    bar_colors = []
    sev_order = ["Crítica", "Alta", "Média", "Baixa", "Informativa"]
    for c in cats:
        cat_findings = [f for f in FINDINGS if f["category"] in keymap[c]]
        counts.append(len(cat_findings))
        if not cat_findings:
            bar_colors.append(STRONG_COLOR)
        else:
            worst = min(cat_findings, key=lambda f: sev_order.index(f["severity"]))
            bar_colors.append(SEV_COLORS[worst["severity"]])

    display_counts = [c if c > 0 else 0.06 for c in counts]

    fig, ax = plt.subplots(figsize=(7.4, 4.0), dpi=200)
    bars = ax.bar(cats, display_counts, color=bar_colors, width=0.55, zorder=3)
    for bar, real in zip(bars, counts):
        label = "0 (ok)" if real == 0 else str(real)
        color = STRONG_COLOR if real == 0 else INK
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.05,
                 label, ha="center", va="bottom", fontsize=10, color=color, fontweight="bold")
    ax.set_ylim(0, max(counts + [1]) + 0.8)
    ax.set_yticks(range(0, max(counts + [1]) + 2))
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.spines["bottom"].set_color(LINE)
    ax.tick_params(axis="x", labelsize=9, colors=INK)
    ax.tick_params(axis="y", labelsize=9, colors=MUTED)
    ax.yaxis.grid(True, color=LINE, linewidth=0.8, zorder=0)
    ax.set_axisbelow(True)
    ax.set_title("Achados por categoria (verde = nenhum achado, categoria coberta)",
                  fontsize=11, color=INK, pad=12, loc="left")
    fig.tight_layout()
    fig.savefig(path, transparent=True, bbox_inches="tight")
    plt.close(fig)


donut_path = os.path.join(HERE, "_chart_donut.png")
bars_path = os.path.join(HERE, "_chart_bars.png")
make_donut(donut_path)
make_bars(bars_path)

# --------------------------------------------------------------- estilos ----
styles = {
    "cover_title": ParagraphStyle("cover_title", fontName="Helvetica-Bold", fontSize=26,
                                    leading=31, textColor=colors.HexColor(INK)),
    "cover_sub": ParagraphStyle("cover_sub", fontName="Helvetica", fontSize=13,
                                  leading=18, textColor=colors.HexColor(MUTED)),
    "cover_meta_label": ParagraphStyle("cover_meta_label", fontName="Helvetica-Bold", fontSize=9,
                                         leading=12, textColor=colors.HexColor(MUTED),
                                         spaceAfter=1),
    "cover_meta_val": ParagraphStyle("cover_meta_val", fontName="Helvetica", fontSize=10.5,
                                       leading=14, textColor=colors.HexColor(INK),
                                       spaceAfter=10),
    "h1": ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=17, leading=21,
                           textColor=colors.HexColor(INK), spaceBefore=4, spaceAfter=10),
    "h2": ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=12.5, leading=16,
                           textColor=colors.HexColor(INK), spaceBefore=12, spaceAfter=6),
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=9.6, leading=13.6,
                             textColor=colors.HexColor(INK), spaceAfter=6),
    "body_muted": ParagraphStyle("body_muted", fontName="Helvetica", fontSize=9, leading=12.6,
                                   textColor=colors.HexColor(MUTED), spaceAfter=6),
    "small": ParagraphStyle("small", fontName="Helvetica", fontSize=8.3, leading=11.5,
                              textColor=colors.HexColor(MUTED)),
    "code": ParagraphStyle("code", fontName="Courier", fontSize=7.6, leading=10.6,
                             textColor=colors.HexColor(INK), backColor=colors.HexColor(BG_SOFT),
                             borderPadding=(6, 8, 6, 8), spaceAfter=6),
    "issue_body": ParagraphStyle("issue_body", fontName="Courier", fontSize=7.4, leading=10.2,
                                   textColor=colors.HexColor(INK)),
}


def sev_chip(sev):
    color = SEV_COLORS.get(sev, MUTED)
    t = Table([[Paragraph(f'<font color="white"><b>{sev}</b></font>',
                           ParagraphStyle("chip", fontName="Helvetica-Bold", fontSize=7.6,
                                          textColor=colors.white, alignment=TA_CENTER))]],
               colWidths=[2.35 * cm], rowHeights=[0.48 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(color)),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROUNDEDCORNERS", [5, 5, 5, 5]),
    ]))
    return t


# --------------------------------------------------------------- doc --------
doc = BaseDocTemplate(OUT_PDF, pagesize=A4,
                       leftMargin=2 * cm, rightMargin=2 * cm,
                       topMargin=2.6 * cm, bottomMargin=2.2 * cm,
                       title=f"Relatório de Auditoria de Segurança — {PROJECT}")

REPORT_NAME = f"Auditoria de Segurança — {PROJECT}"


def header_footer(canv: pdfcanvas.Canvas, d):
    canv.saveState()
    page_num = canv.getPageNumber()
    if page_num > 1:
        canv.setStrokeColor(colors.HexColor(LINE))
        canv.setLineWidth(0.6)
        canv.line(2 * cm, A4[1] - 1.6 * cm, A4[0] - 2 * cm, A4[1] - 1.6 * cm)
        canv.setFont("Helvetica", 8.3)
        canv.setFillColor(colors.HexColor(MUTED))
        canv.drawString(2 * cm, A4[1] - 1.35 * cm, REPORT_NAME)
        canv.drawRightString(A4[0] - 2 * cm, A4[1] - 1.35 * cm, "2026-09-08")
    canv.setStrokeColor(colors.HexColor(LINE))
    canv.setLineWidth(0.6)
    canv.line(2 * cm, 1.7 * cm, A4[0] - 2 * cm, 1.7 * cm)
    canv.setFont("Helvetica", 8.3)
    canv.setFillColor(colors.HexColor(MUTED))
    canv.drawString(2 * cm, 1.35 * cm, REPORT_NAME)
    canv.drawRightString(A4[0] - 2 * cm, 1.35 * cm, f"Página {page_num}")
    canv.restoreState()


frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=header_footer)])

story = []

# ---- Capa -----------------------------------------------------------------
story.append(Spacer(1, 2.2 * cm))
story.append(Paragraph(f"Relatório de Auditoria de<br/>Segurança — {PROJECT}", styles["cover_title"]))
story.append(Spacer(1, 0.5 * cm))
story.append(Paragraph(
    "Isolamento de tenant, permissões, IDOR, segredos e inputs sem tratamento",
    styles["cover_sub"]))
story.append(Spacer(1, 1.6 * cm))

meta_rows = [
    ("Data", "2026-09-08"),
    ("Repositório", "github.com/rilsonjoas/biblia-na-arte"),
    ("Escopo auditado", SCOPE),
    ("Nota metodológica", METHOD_NOTE),
]
for label, val in meta_rows:
    story.append(Paragraph(label.upper(), styles["cover_meta_label"]))
    story.append(Paragraph(val, styles["cover_meta_val"]))

story.append(Spacer(1, 1.0 * cm))
sev_counts = {}
for f in FINDINGS:
    sev_counts[f["severity"]] = sev_counts.get(f["severity"], 0) + 1
summary_line = "  ·  ".join(f"{v} {k}" for k, v in sev_counts.items())
story.append(Table([[Paragraph(
    f'<b>{len(FINDINGS)} achado</b>  —  {summary_line}  '
    f'—  <font color="{STRONG_COLOR}"><b>nenhuma vulnerabilidade explorável encontrada</b></font>',
    styles["body"])]], colWidths=[doc.width]))

story.append(PageBreak())

# ---- Resumo executivo -------------------------------------------------
story.append(Paragraph("Resumo executivo", styles["h1"]))
story.append(Paragraph(
    f'<font color="{STRONG_COLOR}"><b>Auditoria limpa.</b></font> '
    f"Das 5 categorias verificadas em código real, 4 não tiveram nenhum achado "
    f"(isolamento/RLS não se aplica à stack — sem multi-tenant — e foi "
    f"verificado o equivalente real; permissão no navegador, IDOR e chaves "
    f"expostas foram checados rota por rota, sem violação). O único item "
    f"registrado (B1) é <b>informativo/housekeeping</b>: código morto que "
    f"carrega um padrão sensível mas não é explorável hoje. Nada aqui bloqueia "
    f"produção nem exige correção urgente.",
    styles["body"]))

story.append(Spacer(1, 0.3 * cm))
chart_table = Table([
    [Image(donut_path, width=8.6 * cm, height=7.4 * cm),
     Image(bars_path, width=8.6 * cm, height=7.4 * cm)]
], colWidths=[8.6 * cm, 8.6 * cm])
chart_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
story.append(chart_table)

story.append(Spacer(1, 0.4 * cm))
story.append(Paragraph("Pontos fortes (verificados, com evidência)", styles["h2"]))
for title, desc in STRENGTHS:
    story.append(Paragraph(f'<font color="{STRONG_COLOR}"><b>✓ {esc(title)}</b></font> — {esc(desc)}',
                            styles["body"]))

story.append(Paragraph("Pontos fracos", styles["h2"]))
story.append(Paragraph(
    "Nenhum risco central de segurança identificado. O item B1 é hardening "
    "preventivo de código morto — vale fazer por higiene de repositório, "
    "não porque exista exploração hoje.", styles["body"]))

story.append(PageBreak())

# ---- Tabela de achados ------------------------------------------------
story.append(Paragraph("Achados detalhados", styles["h1"]))

for f in FINDINGS:
    block = []
    head = Table([
        [sev_chip(f["severity"]),
         Paragraph(f'<b>{esc(f["id"])} · {esc(f["category"])}</b>', styles["body"]),
         Paragraph(f'<font face="Courier" size="8">{esc(f["file"])}:{esc(f["lines"])}</font>', styles["small"])]
    ], colWidths=[2.6 * cm, 6.0 * cm, doc.width - 8.6 * cm])
    head.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    block.append(head)
    block.append(Paragraph(f'<b>{esc(f["title"])}</b>', styles["body"]))
    block.append(Paragraph(esc(f["desc"]), styles["body"]))
    code_escaped = esc(f["code"]).replace("\n", "<br/>")
    block.append(Paragraph(code_escaped, styles["code"]))
    block.append(Paragraph(f'<b>Impacto:</b> {esc(f["impact"])}', styles["body_muted"]))
    block.append(Paragraph(f'<b>Correção sugerida:</b> {esc(f["fix"])}', styles["body_muted"]))
    block.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor(LINE),
                              spaceBefore=8, spaceAfter=12))
    story.append(KeepTogether(block))

story.append(Spacer(1, 0.4 * cm))
story.append(Paragraph(
    "Categorias sem achado (verificadas explicitamente)", styles["h2"]))
no_finding_rows = [
    ("1 — Isolamento de tenant / RLS",
     "Não se aplica: sem conta de usuário final, sem dado multi-tenant. "
     "Equivalente real (active = true) verificado em toda query pública."),
    ("2 — Permissão definida no navegador",
     "Todo gate de UI (is_owner/role no frontend) tem correspondência "
     "exata no backend (authenticate/requireAdmin). Nenhuma ação sensível "
     "depende só da UI escondida."),
    ("3 — IDOR",
     "Todas as 27 rotas revisadas. Escrita só em admin.ts (staff-only, "
     "sem conceito de posse por usuário) e submissions.ts (1 endpoint "
     "público, cria linha pendente). Path traversal bloqueado em /uploads."),
    ("4 — Chaves expostas",
     "Nenhum hardcode. JWT_SECRET sem default (mín. 32 chars, boot falha "
     "sem ele), scrypt+timingSafeEqual pra senha, Zod valida env no boot."),
]
for title, desc in no_finding_rows:
    story.append(Paragraph(f'<font color="{STRONG_COLOR}"><b>✓ {esc(title)}</b></font> — {esc(desc)}',
                            styles["body"]))

story.append(PageBreak())

# ---- Recomendações ------------------------------------------------------
story.append(Paragraph("Recomendações priorizadas", styles["h1"]))
rec_rows = [[Paragraph("<b>Prior.</b>", styles["small"]),
             Paragraph("<b>Ação</b>", styles["small"]),
             Paragraph("<b>Por quê</b>", styles["small"])]]
for prio, action, why in RECOMMENDATIONS:
    rec_rows.append([Paragraph(f"<b>{esc(prio)}</b>", styles["body"]),
                      Paragraph(esc(action), styles["body"]),
                      Paragraph(esc(why), styles["body_muted"])])
rec_table = Table(rec_rows, colWidths=[1.6 * cm, 6.4 * cm, doc.width - 8.0 * cm])
rec_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(BG_SOFT)),
    ("LINEBELOW", (0, 0), (-1, 0), 0.8, colors.HexColor(LINE)),
    ("LINEBELOW", (0, 1), (-1, -1), 0.4, colors.HexColor(LINE)),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story.append(rec_table)
story.append(Spacer(1, 0.3 * cm))
story.append(Paragraph(
    "Sem P2/P3 — não há mais nenhuma ação de segurança pendente identificada "
    "nesta auditoria.", styles["body_muted"]))

story.append(PageBreak())

# ---- Issues pro GitHub --------------------------------------------------
story.append(Paragraph("Issues para o GitHub", styles["h1"]))
story.append(Paragraph(
    "Texto completo em Markdown, pronto para copiar e colar. Só 1 issue "
    "aqui, de housekeeping — não há achado de segurança acionável que "
    "justifique uma issue de correção urgente.",
    styles["body_muted"]))

for i, issue in enumerate(ISSUES, start=1):
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(f"--- ISSUE {i} ---", styles["small"]))
    story.append(Paragraph(f'<b>{esc(issue["title"])}</b>', styles["h2"]))
    story.append(Paragraph(f'<b>Labels:</b> {esc(issue["labels"])}', styles["body_muted"]))
    body_escaped = esc(issue["body"]).replace("\n", "<br/>")
    story.append(Paragraph(body_escaped, styles["issue_body"]))
    story.append(Paragraph(f"--- FIM ISSUE {i} ---", styles["small"]))
    story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor(LINE),
                              spaceBefore=10, spaceAfter=10))

doc.build(story)
print(f"PDF gerado: {OUT_PDF}")
