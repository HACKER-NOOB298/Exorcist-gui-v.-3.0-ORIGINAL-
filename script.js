let playerMusica = new Audio();
let synth = window.speechSynthesis;
let utteranceAtual = null;
let vozes = [];

let modoAtual = null; 
let textoAtual = "";
let arquivoAtual = "";
let loopsTotais = 1;
let loopsExecutados = 0;
let isPausado = false;

window.onload = () => { 
    carregarVozes(); 
    const salvo = localStorage.getItem('tema_preferido');
    if(salvo) mudarTema(salvo);
};
synth.onvoiceschanged = carregarVozes;

function carregarVozes() { vozes = synth.getVoices(); }

function toggleMenu() { document.getElementById('sidebar').classList.toggle('closed'); }

function navegar(idTela) {
    controlarAudio('stop');
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(idTela).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(b => {
        if(b.getAttribute('onclick').includes(idTela)) b.classList.add('active');
    });

    if(idTela === 'dicionario') renderizarDicionario(dicionarioDB);
}

function mudarTema(tema) {
    document.body.classList.remove('theme-magna', 'theme-classic', 'theme-dark');
    document.body.classList.add('theme-' + tema);
    localStorage.setItem('tema_preferido', tema);
    atualizarStatus("Tema: " + tema.toUpperCase());
}

function configurarLoop() {
    let input = prompt("Quantas vezes deseja repetir a oração?", "1");
    let num = parseInt(input);
    if (!isNaN(num) && num > 0) {
        loopsTotais = num;
        atualizarStatus(`Repetição: ${num}x`);
    } else {
        loopsTotais = 1;
    }
}

function atualizarStatus(msg) { document.getElementById('status-display').innerText = msg; }

function controlarAudio(acao) {
    if (acao === 'stop') {
        synth.cancel(); playerMusica.pause(); playerMusica.currentTime = 0;
        loopsExecutados = 0; isPausado = false; modoAtual = null;
        atualizarStatus("Parado"); return;
    }
    if (acao === 'pause') {
        if (modoAtual === 'tts') synth.pause();
        if (modoAtual === 'mp3') playerMusica.pause();
        isPausado = true; atualizarStatus("Pausado");
    }
    if (acao === 'resume') {
        if (isPausado) {
            if (modoAtual === 'tts') synth.resume();
            if (modoAtual === 'mp3') playerMusica.play();
            isPausado = false; atualizarStatus("Reproduzindo...");
        }
    }
}

function falarPalavra(texto) {
    controlarAudio('stop');
    const u = new SpeechSynthesisUtterance(texto);
    const v = vozes.find(v => v.lang.includes('it-IT')) || vozes.find(v => v.lang.includes('es-ES'));
    if (v) u.voice = v;
    u.rate = 0.8; synth.speak(u);
}

function iniciarTTS(btnElement) {
    controlarAudio('stop'); 
    textoAtual = btnElement.parentElement.previousElementSibling.innerText;
    modoAtual = 'tts'; loopsExecutados = 0; tocarTTSLoop();
}

function tocarTTSLoop() {
    if (loopsExecutados >= loopsTotais) return;
    loopsExecutados++;
    atualizarStatus(`Recitando ${loopsExecutados}/${loopsTotais}`);
    utteranceAtual = new SpeechSynthesisUtterance(textoAtual);
    const vozLatina = vozes.find(v => v.lang.includes('it-IT')) || vozes.find(v => v.lang.includes('es-ES'));
    if (vozLatina) utteranceAtual.voice = vozLatina;
    utteranceAtual.rate = 0.8;
    utteranceAtual.onend = () => { if (loopsExecutados < loopsTotais) tocarTTSLoop(); };
    synth.speak(utteranceAtual);
}

function iniciarMusica(arquivo) {
    controlarAudio('stop'); arquivoAtual = arquivo; modoAtual = 'mp3';
    loopsExecutados = 0; tocarMP3Loop();
}

function tocarMP3Loop() {
    if (loopsExecutados >= loopsTotais) return;
    loopsExecutados++;
    atualizarStatus(`Cantando ${loopsExecutados}/${loopsTotais}`);
    playerMusica.src = "mp3/" + arquivoAtual;
    playerMusica.onended = () => { if (loopsExecutados < loopsTotais) tocarMP3Loop(); };
    playerMusica.play().catch(() => atualizarStatus("Erro MP3"));
}

const dicionarioDB = [
    { latin: "Absolutio", pt: "Absolvição" },
    { latin: "Adsum", pt: "Aqui estou" },
    { latin: "Agnus Dei", pt: "Cordeiro de Deus" },
    { latin: "Altare", pt: "Altar" },
    { latin: "Amen", pt: "Assim seja" },
    { latin: "Angele", pt: "Anjo" },
    { latin: "Anima", pt: "Alma" },
    { latin: "Aqua", pt: "Água" },
    { latin: "Basilica", pt: "Basílica" },
    { latin: "Beatus", pt: "Bem-aventurado" },
    { latin: "Benedictus", pt: "Bendito" },
    { latin: "Caelum", pt: "Céu" },
    { latin: "Caritas", pt: "Caridade" },
    { latin: "Confiteor", pt: "Eu confesso" },
    { latin: "Corpus Christi", pt: "Corpo de Cristo" },
    { latin: "Credo", pt: "Eu creio" },
    { latin: "Crux", pt: "Cruz" },
    { latin: "Daemon", pt: "Demônio" },
    { latin: "Deus", pt: "Deus" },
    { latin: "Diabolus", pt: "Diabo" },
    { latin: "Dominus", pt: "Senhor" },
    { latin: "Ecclesia", pt: "Igreja" },
    { latin: "Et", pt: "E" },
    { latin: "Eucharistia", pt: "Eucaristia" },
    { latin: "Exorcizamus", pt: "Exorcizamos" },
    { latin: "Fides", pt: "Fé" },
    { latin: "Filius", pt: "Filho" },
    { latin: "Gloria", pt: "Glória" },
    { latin: "Gratia", pt: "Graça" },
    { latin: "Habemus", pt: "Temos" },
    { latin: "Hostia", pt: "Hóstia / Vítima" },
    { latin: "Infernum", pt: "Inferno" },
    { latin: "Inri", pt: "Rei dos Judeus" },
    { latin: "Kyrie Eleison", pt: "Senhor tende piedade" },
    { latin: "Laudes", pt: "Louvores" },
    { latin: "Lux", pt: "Luz" },
    { latin: "Malo", pt: "Mal" },
    { latin: "Mea Culpa", pt: "Minha culpa" },
    { latin: "Miserere", pt: "Tende piedade" },
    { latin: "Mundus", pt: "Mundo" },
    { latin: "Omnipotens", pt: "Todo-poderoso" },
    { latin: "Ora pro nobis", pt: "Rogai por nós" },
    { latin: "Pater", pt: "Pai" },
    { latin: "Pax", pt: "Paz" },
    { latin: "Peccatum", pt: "Pecado" },
    { latin: "Regnum", pt: "Reino" },
    { latin: "Requiem", pt: "Repouso" },
    { latin: "Sacra", pt: "Sagrada" },
    { latin: "Sanctus", pt: "Santo" },
    { latin: "Satanas", pt: "Satanás" },
    { latin: "Spiritus", pt: "Espírito" },
    { latin: "Vade Retro", pt: "Afasta-te" },
    { latin: "Verbum", pt: "Verbo" },
    { latin: "Virgo", pt: "Virgem" }
];

function renderizarDicionario(lista) {
    const container = document.getElementById('lista-palavras');
    container.innerHTML = lista.map(i => `
        <div class="dict-item">
            <div><strong style="color:var(--gold)">${i.latin}</strong> ➔ ${i.pt}</div>
            <button class="btn-play" style="flex:none; min-width:auto; padding:5px 10px;" onclick="falarPalavra('${i.latin}')">🔊</button>
        </div>
    `).join('');
}

function pesquisar() {
    const t = document.getElementById('searchInput').value.toLowerCase();
    const f = dicionarioDB.filter(i => i.latin.toLowerCase().includes(t) || i.pt.toLowerCase().includes(t));
    renderizarDicionario(f);
}
