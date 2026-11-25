/* ==========================================================
   Efeitos compartilhados por todas as páginas:
   - barra de progresso de rolagem
   - cabeçalho que ganha vidro ao rolar
   - revelação suave dos blocos ao aparecerem na tela
   - inclinação 3D dos cartões com [data-tilt]
   - poeira dourada flutuando ao fundo (canvas)
   - botão "voltar ao topo"
   - destaque do link do menu conforme a seção visível
   Tudo é decorativo: se algo falhar, o site continua funcionando.
   ========================================================== */

(function () {
  "use strict";

  var reduzirMovimento = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ponteiroFino = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- CSS injetado ---------- */
  var css = [
    ".barra-progresso{position:fixed;top:0;left:0;height:3px;width:100%;transform-origin:0 50%;transform:scaleX(0);",
    "background:linear-gradient(90deg,#a8841f,#f7df8a,#d4af37);z-index:1000002;box-shadow:0 0 12px rgba(212,175,55,.7);pointer-events:none}",

    "html .rv{opacity:0;transform:translateY(38px);transition:opacity .9s cubic-bezier(.22,1,.36,1),transform .9s cubic-bezier(.22,1,.36,1);",
    "transition-delay:var(--rd,0s)}",
    "html .rv.rv-in{opacity:1;transform:none}",

    ".poeira-ouro{position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none}",

    ".voltar-topo{position:fixed;right:22px;bottom:24px;width:50px;height:50px;border-radius:50%;",
    "border:1px solid rgba(212,175,55,.6);background:rgba(10,10,12,.85);backdrop-filter:blur(8px);cursor:pointer;",
    "display:grid;place-items:center;z-index:9000;opacity:0;transform:translateY(20px) scale(.9);pointer-events:none;",
    "transition:opacity .4s ease,transform .5s cubic-bezier(.22,1,.36,1),box-shadow .3s ease,background .3s ease}",
    ".voltar-topo.visivel{opacity:1;transform:none;pointer-events:auto}",
    ".voltar-topo:hover{background:#d4af37;box-shadow:0 0 28px rgba(212,175,55,.6)}",
    ".voltar-topo svg{width:20px;height:20px;fill:none;stroke:#d4af37;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;transition:stroke .3s ease}",
    ".voltar-topo:hover svg{stroke:#111}",
    "@media(max-width:768px){.voltar-topo{right:14px;bottom:16px;width:44px;height:44px}}",
  ].join("");

  var estilo = document.createElement("style");
  estilo.textContent = css;
  document.head.appendChild(estilo);

  /* ---------- Barra de progresso + cabeçalho + voltar ao topo ---------- */
  var barra = document.createElement("div");
  barra.className = "barra-progresso";
  document.body.appendChild(barra);

  var botaoTopo = document.createElement("button");
  botaoTopo.type = "button";
  botaoTopo.className = "voltar-topo";
  botaoTopo.setAttribute("aria-label", "Voltar ao topo");
  botaoTopo.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  botaoTopo.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduzirMovimento ? "auto" : "smooth" });
  });
  document.body.appendChild(botaoTopo);

  var cabecalho = document.querySelector("header");
  var aguardandoFrame = false;

  function aoRolar() {
    aguardandoFrame = false;
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var total = document.documentElement.scrollHeight - window.innerHeight;
    barra.style.transform = "scaleX(" + (total > 0 ? Math.min(1, y / total) : 0) + ")";

    if (cabecalho) cabecalho.classList.toggle("rolou", y > 40);
    botaoTopo.classList.toggle("visivel", y > 700);
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!aguardandoFrame) {
        aguardandoFrame = true;
        requestAnimationFrame(aoRolar);
      }
    },
    { passive: true },
  );
  window.addEventListener("resize", aoRolar);
  aoRolar();

  /* ---------- Revelação ao rolar ---------- */
  var seletorReveal = [
    "[data-reveal]",
    ".card-video",
    ".produto-card",
    ".secao-titulo",
    ".hero-loja",
    ".painel-topo",
    ".card-publicacao",
    ".card-conteudo",
    ".card-evento",
    ".card-coordenador",
  ].join(",");

  var observador = null;

  if ("IntersectionObserver" in window && !reduzirMovimento) {
    observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (!entrada.isIntersecting) return;
          var el = entrada.target;
          observador.unobserve(el);
          el.classList.add("rv-in");

          var atraso = parseFloat(el.style.getPropertyValue("--rd")) || 0;
          setTimeout(function () {
            el.classList.remove("rv", "rv-in");
            el.style.removeProperty("--rd");
          }, 1100 + atraso * 1000);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
  }

  function prepararReveal(raiz) {
    if (!observador) return;
    var lista = raiz.matches && raiz.matches(seletorReveal) ? [raiz] : [];
    lista = lista.concat(Array.prototype.slice.call(raiz.querySelectorAll(seletorReveal)));

    lista.forEach(function (el) {
      if (el.dataset.rvOk) return;
      el.dataset.rvOk = "1";

      // atraso escalonado entre irmãos (máx. ~0,5s)
      var irmaos = el.parentElement ? Array.prototype.slice.call(el.parentElement.children) : [el];
      var idx = Math.max(0, irmaos.indexOf(el));
      el.style.setProperty("--rd", Math.min(idx, 5) * 0.1 + "s");

      el.classList.add("rv");
      observador.observe(el);
    });
  }

  prepararReveal(document.body);

  // Conteúdo carregado depois (galerias vindas do banco de dados)
  if ("MutationObserver" in window) {
    new MutationObserver(function (mutacoes) {
      mutacoes.forEach(function (m) {
        m.addedNodes.forEach(function (no) {
          if (no.nodeType === 1) prepararReveal(no);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* ---------- Inclinação 3D dos cartões ---------- */
  if (ponteiroFino && !reduzirMovimento) {
    document.addEventListener("mousemove", function (e) {
      var alvo = e.target.closest ? e.target.closest("[data-tilt]") : null;
      if (!alvo) return;

      var r = alvo.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;

      alvo.style.setProperty("--ry", ((px - 0.5) * 9).toFixed(2) + "deg");
      alvo.style.setProperty("--rx", ((0.5 - py) * 7).toFixed(2) + "deg");
      alvo.style.setProperty("--mx", (e.clientX - r.left).toFixed(0) + "px");
      alvo.style.setProperty("--my", (e.clientY - r.top).toFixed(0) + "px");
    });

    document.addEventListener(
      "mouseout",
      function (e) {
        var alvo = e.target.closest ? e.target.closest("[data-tilt]") : null;
        if (!alvo) return;
        if (e.relatedTarget && alvo.contains(e.relatedTarget)) return;
        alvo.style.setProperty("--rx", "0deg");
        alvo.style.setProperty("--ry", "0deg");
      },
      true,
    );
  }

  /* ---------- Destaque do menu conforme a seção ---------- */
  var linksMenu = Array.prototype.slice.call(document.querySelectorAll(".nav-principal a[href^='#']"));
  var secoesMenu = linksMenu
    .map(function (a) {
      var id = a.getAttribute("href");
      return id.length > 1 ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  if (linksMenu.length && secoesMenu.length) {
    var marcar = function () {
      var y = window.pageYOffset + window.innerHeight * 0.35;
      var atual = secoesMenu[0].id;
      secoesMenu.forEach(function (s) {
        if (s.offsetTop <= y) atual = s.id;
      });
      linksMenu.forEach(function (a) {
        a.classList.toggle("ativo", a.getAttribute("href") === "#" + atual);
      });
    };
    window.addEventListener("scroll", marcar, { passive: true });
    marcar();
  }

  /* ---------- Poeira dourada ao fundo ---------- */
  if (!reduzirMovimento) {
    var canvas = document.createElement("canvas");
    canvas.className = "poeira-ouro";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);

    var ctx = canvas.getContext("2d");
    var largura = 0;
    var altura = 0;
    var particulas = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rodando = true;
    var quadroAgendado = false;

    function criarParticula(inicio) {
      return {
        x: Math.random() * largura,
        y: inicio ? Math.random() * altura : altura + 10,
        r: Math.random() * 1.7 + 0.4,
        vy: Math.random() * 0.28 + 0.07,
        vx: (Math.random() - 0.5) * 0.14,
        fase: Math.random() * Math.PI * 2,
        brilho: Math.random() * 0.5 + 0.25,
      };
    }

    function ajustar() {
      largura = window.innerWidth;
      altura = window.innerHeight;
      canvas.width = largura * dpr;
      canvas.height = altura * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var quantidade = Math.min(largura < 700 ? 34 : 72, Math.round((largura * altura) / 24000));
      particulas = [];
      for (var i = 0; i < quantidade; i++) particulas.push(criarParticula(true));
    }

    function desenhar(t) {
      quadroAgendado = false;
      if (!rodando) return;
      ctx.clearRect(0, 0, largura, altura);

      for (var i = 0; i < particulas.length; i++) {
        var p = particulas[i];
        p.y -= p.vy;
        p.x += p.vx + Math.sin(t / 2600 + p.fase) * 0.12;

        if (p.y < -10 || p.x < -10 || p.x > largura + 10) {
          particulas[i] = criarParticula(false);
          continue;
        }

        var alpha = p.brilho * (0.55 + 0.45 * Math.sin(t / 900 + p.fase));
        ctx.beginPath();
        ctx.fillStyle = "rgba(247,223,138," + alpha.toFixed(3) + ")";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        if (p.r > 1.4) {
          ctx.beginPath();
          ctx.fillStyle = "rgba(212,175,55," + (alpha * 0.18).toFixed(3) + ")";
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      quadroAgendado = true;
      requestAnimationFrame(desenhar);
    }

    ajustar();
    window.addEventListener("resize", ajustar);
    document.addEventListener("visibilitychange", function () {
      rodando = !document.hidden;
      if (rodando && !quadroAgendado) {
        quadroAgendado = true;
        requestAnimationFrame(desenhar);
      }
    });
    quadroAgendado = true;
    requestAnimationFrame(desenhar);
  }
})();
