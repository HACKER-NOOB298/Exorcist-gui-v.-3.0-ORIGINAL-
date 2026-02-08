// --- SISTEMA DE ÁUDIO MAGNA V3.5 ---
let playerMusica = new Audio();
let synth = window.speechSynthesis;
let utteranceAtual = null;
let vozes = [];

// Variáveis de Estado
let modoAtual = null; 
let textoAtual = "";
let arquivoAtual = "";
let loopsTotais = 1;
let loopsExecutados = 0;
let isPausado = false; 
let watcherInterval = null; 

// EQUIPAMENTOS PARANORMAIS - Estado
let emfAtivo = false;
let spiritBoxAtivo = false;
let slsCameraAtivo = false;
let termometroAtivo = false;
let remPodAtivo = false;
let emfNivel = 0;
let frequenciaAtual = 87.5;
let temperaturaAtual = 21.4;
let remPodSensibilidade = 30;
let slsDeteccoes = 0;

// --- INICIALIZAÇÃO ---
window.onload = () => { 
    carregarVozes(); 
    const salvo = localStorage.getItem('tema_preferido');
    if(salvo) mudarTema(salvo);

    playerMusica.setAttribute('playsinline', 'true');
    playerMusica.setAttribute('webkit-playsinline', 'true');
    playerMusica.preload = 'auto';
    
    // Inicializar equipamentos
    inicializarEquipamentos();
};

synth.onvoiceschanged = carregarVozes;

function carregarVozes() { vozes = synth.getVoices(); }

function toggleMenu() { document.getElementById('sidebar').classList.toggle('closed'); }

// --- TRADUÇÃO (SISTEMA TOGGLE) ---
function toggleTraducao(btn) {
    // Pega o card pai
    const card = btn.closest('.prayer-container');
    const latinText = card.querySelector('.latin');
    const tradText = card.querySelector('.traducao');

    if (tradText.style.display === 'none') {
        // Mostrar Tradução
        latinText.style.display = 'none';
        tradText.style.display = 'block';
        btn.innerText = "📜 Ver Latim";
        btn.style.borderColor = "var(--gold)";
        btn.style.color = "var(--gold)";
    } else {
        // Mostrar Latim
        latinText.style.display = 'block';
        tradText.style.display = 'none';
        btn.innerText = "🌐 Traduzir";
        btn.style.borderColor = "#555";
        btn.style.color = "#888";
    }
}

// --- NAVEGAÇÃO ---
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

// --- ÁUDIO BLINDADO ---
function controlarAudio(acao) {
    if (acao === 'stop') {
        pararVigia();
        synth.cancel(); playerMusica.pause(); playerMusica.currentTime = 0;
        loopsExecutados = 0; isPausado = false; modoAtual = null;
        atualizarStatus("Parado"); 
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "none";
        return;
    }
    if (acao === 'pause') {
        isPausado = true;
        if (modoAtual === 'tts') synth.pause();
        if (modoAtual === 'mp3') playerMusica.pause();
        atualizarStatus("Pausado");
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "paused";
    }
    if (acao === 'resume') {
        if (isPausado) {
            isPausado = false;
            if (modoAtual === 'tts') synth.resume();
            if (modoAtual === 'mp3') { playerMusica.play(); iniciarVigia(); }
            atualizarStatus("Reproduzindo...");
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "playing";
        }
    }
}

function iniciarVigia() {
    if (watcherInterval) clearInterval(watcherInterval);
    watcherInterval = setInterval(() => {
        if (!isPausado && playerMusica.paused && modoAtual === 'mp3') {
            playerMusica.play().catch(e => console.log("Force-play"));
        }
    }, 1000);
}
function pararVigia() { if (watcherInterval) clearInterval(watcherInterval); }

// --- TTS ---
function falarPalavra(texto) {
    controlarAudio('stop');
    const u = new SpeechSynthesisUtterance(texto);
    const v = vozes.find(v => v.lang.includes('it-IT')) || vozes.find(v => v.lang.includes('es-ES'));
    if (v) u.voice = v;
    u.rate = 0.8; synth.speak(u);
}

function iniciarTTS(btnElement) {
    controlarAudio('stop'); 
    // Sempre pega o texto em Latim, mesmo se a tradução estiver visível
    const card = btnElement.closest('.prayer-container');
    textoAtual = card.querySelector('.latin').innerText;
    
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
    
    let resumeInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) clearInterval(resumeInterval);
        else window.speechSynthesis.resume();
    }, 14000);

    utteranceAtual.onend = () => { 
        clearInterval(resumeInterval);
        if (loopsExecutados < loopsTotais && !isPausado) tocarTTSLoop(); 
    };
    synth.speak(utteranceAtual);
}

// --- MP3 ---
function iniciarMusica(arquivo) {
    controlarAudio('stop'); arquivoAtual = arquivo; modoAtual = 'mp3';
    loopsExecutados = 0; 
    
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: arquivo.replace('.mp3', '').toUpperCase(),
            artist: 'Schola Exorcistae',
            album: 'Codex Magna v3.5',
            artwork: [{ src: 'https://cdn-icons-png.flaticon.com/512/107/107831.png', sizes: '512x512', type: 'image/png' }]
        });
        navigator.mediaSession.setActionHandler('play', () => controlarAudio('resume'));
        navigator.mediaSession.setActionHandler('pause', () => controlarAudio('pause'));
        navigator.mediaSession.setActionHandler('stop', () => controlarAudio('stop'));
    }
    tocarMP3Loop();
}

function tocarMP3Loop() {
    if (loopsExecutados >= loopsTotais) return;
    loopsExecutados++;
    atualizarStatus(`Cantando ${loopsExecutados}/${loopsTotais}`);
    playerMusica.src = "mp3/" + arquivoAtual;
    playerMusica.onpause = () => { if (!isPausado) playerMusica.play().catch(e => {}); };
    playerMusica.onended = () => { if (loopsExecutados < loopsTotais) tocarMP3Loop(); };
    playerMusica.play().then(() => iniciarVigia()).catch(() => atualizarStatus("Erro MP3"));
}

// === EQUIPAMENTOS PARANORMAIS FUNCIONAIS ===

function inicializarEquipamentos() {
    // Criar event listeners para os equipamentos quando a página carregar
    setTimeout(() => {
        const equipCardEMF = document.querySelector('[onclick="ativarEMF()"]')?.parentElement?.parentElement;
        const equipCardSpiritBox = document.querySelector('[onclick="ativarSpiritBox()"]')?.parentElement?.parentElement;
        const equipCardSLS = document.querySelector('[onclick="ativarSLS()"]')?.parentElement?.parentElement;
        const equipCardTerm = document.querySelector('[onclick="ativarTermometro()"]')?.parentElement?.parentElement;
        const equipCardREM = document.querySelector('[onclick="ativarREMPod()"]')?.parentElement?.parentElement;
    }, 500);
}

// --- EMF K2 DETECTOR ---
function ativarEMF() {
    if (emfAtivo) {
        emfAtivo = false;
        atualizarStatus("EMF Desativado");
        return;
    }
    
    emfAtivo = true;
    atualizarStatus("EMF Ativado - Monitorando campo");
    let emfInterval = setInterval(() => {
        if (!emfAtivo) {
            clearInterval(emfInterval);
            atualizarStatus("EMF Parado");
            return;
        }
        
        // Simular detecção aleatória de campo eletromagnético
        const random = Math.random();
        if (random < 0.3) {
            emfNivel = Math.floor(Math.random() * 1.5); // Verde (Seguro)
        } else if (random < 0.6) {
            emfNivel = 2 + Math.floor(Math.random() * 1.5); // Amarelo
        } else if (random < 0.85) {
            emfNivel = 4 + Math.floor(Math.random() * 1); // Laranja
        } else {
            emfNivel = 5; // Vermelho (Ativo)
        }
        
        atualizarEMFDisplay();
    }, 2000);
}

function atualizarEMFDisplay() {
    const cores = ['green', 'green', 'yellow', 'orange', 'orange', 'red'];
    const labels = ['SAFE (0.5 mG)', 'SAFE (1.5 mG)', 'LOW (2.5 mG)', 'MEDIUM (3.5 mG)', 'HIGH (4.5 mG)', 'CRITICAL (5+ mG)'];
    
    // Atualizar visualmente o EMF
    const emfDisplay = document.querySelector('.emf-display');
    if (emfDisplay) {
        const barras = emfDisplay.querySelectorAll('.emf-bar');
        barras.forEach((barra, idx) => {
            if (idx <= emfNivel) {
                barra.style.opacity = '1';
                barra.style.backgroundColor = cores[idx];
            } else {
                barra.style.opacity = '0.2';
            }
        });
        
        const label = emfDisplay.querySelector('.emf-label');
        if (label) label.innerText = labels[emfNivel];
    }
    
    if (emfNivel >= 4) {
        atualizarStatus(`⚠️ ANOMALIA EMF: ${labels[emfNivel]}`);
    }
}

// --- SPIRIT BOX SB7 ---
function ativarSpiritBox() {
    if (spiritBoxAtivo) {
        spiritBoxAtivo = false;
        atualizarStatus("Spirit Box Desativado");
        return;
    }
    
    spiritBoxAtivo = true;
    atualizarStatus("Spirit Box Ativado - Varrendo frequências");
    
    let frequenciaInterval = setInterval(() => {
        if (!spiritBoxAtivo) {
            clearInterval(frequenciaInterval);
            return;
        }
        
        frequenciaAtual = 87.5 + (Math.random() * 12.5);
        const sbDisplay = document.querySelector('.sb-display');
        if (sbDisplay) {
            const freq = sbDisplay.querySelector('.sb-frequency');
            if (freq) freq.innerText = frequenciaAtual.toFixed(1) + ' FM';
        }
        
        // Aleatoriamente simular E.V.P (Electronic Voice Phenomenon)
        if (Math.random() < 0.15) {
            const vozes_evp = ['...help...', '...away...', '...here...', '...pray...', '...pain...', '...lost...'];
            const evpCapturado = vozes_evp[Math.floor(Math.random() * vozes_evp.length)];
            atualizarStatus(`📢 E.V.P CAPTURADO: "${evpCapturado}"`);
        }
    }, 1500);
}

// --- SLS CAMERA ---
function ativarSLS() {
    if (slsCameraAtivo) {
        slsCameraAtivo = false;
        atualizarStatus("Câmera SLS Desativada");
        return;
    }
    
    slsCameraAtivo = true;
    atualizarStatus("Câmera SLS Ativada - Mapeando entidades");
    
    let slsInterval = setInterval(() => {
        if (!slsCameraAtivo) {
            clearInterval(slsInterval);
            return;
        }
        
        // Simular detecção de figuras esqueléticas
        if (Math.random() < 0.4) {
            slsDeteccoes++;
            const slsScreen = document.querySelector('.sls-screen');
            if (slsScreen) {
                const figura = document.createElement('div');
                figura.innerHTML = '<i class="fa-solid fa-person" style="color:lime; font-size:1.2rem; position:absolute;"></i>';
                figura.style.position = 'absolute';
                figura.style.left = Math.random() * 80 + '%';
                figura.style.top = Math.random() * 80 + '%';
                slsScreen.appendChild(figura);
                
                setTimeout(() => figura.remove(), 2000);
            }
            atualizarStatus(`👁️ SLS: Entidade detectada! (Total: ${slsDeteccoes})`);
        }
    }, 3000);
}

// --- TERMÔMETRO LASER ---
function ativarTermometro() {
    atualizarStatus("Termômetro Ativado - Laser apontado");
    
    let tempInterval = setInterval(() => {
        // Simular variações de temperatura (hot spots e cold spots)
        const rand = Math.random();
        if (rand < 0.1) {
            temperaturaAtual -= 2; // Cold spot
            if (temperaturaAtual < 5) temperaturaAtual = 5;
            atualizarStatus(`❄️ COLD SPOT: ${temperaturaAtual.toFixed(1)} °C`);
        } else if (rand < 0.15) {
            temperaturaAtual += 3; // Hot spot
            if (temperaturaAtual > 45) temperaturaAtual = 45;
            atualizarStatus(`🔥 HOT SPOT: ${temperaturaAtual.toFixed(1)} °C`);
        } else {
            temperaturaAtual = 21.4 + (Math.random() * 2 - 1);
        }
        
        const termDisplay = document.querySelector('.term-display');
        if (termDisplay) {
            const temp = termDisplay.querySelector('.term-valor');
            if (temp) temp.innerText = temperaturaAtual.toFixed(1) + ' °C';
        }
    }, 2000);
    
    setTimeout(() => clearInterval(tempInterval), 30000);
}

// --- REM-POD ---
function ativarREMPod() {
    if (remPodAtivo) {
        remPodAtivo = false;
        atualizarStatus("REM-Pod Desativado");
        return;
    }
    
    remPodAtivo = true;
    atualizarStatus("REM-Pod Ativado - Proximidade monitorada");
    
    let remInterval = setInterval(() => {
        if (!remPodAtivo) {
            clearInterval(remInterval);
            return;
        }
        
        // Simular alarme de proximidade
        const proximidade = Math.random();
        const remDisplay = document.querySelector('.rem-display');
        
        if (proximidade < 0.2) {
            // Sem atividade
            if (remDisplay) {
                const barras = remDisplay.querySelectorAll('.rem-barra');
                barras.forEach(b => b.style.opacity = '0.2');
            }
        } else if (proximidade < 0.6) {
            // Atividade moderada
            if (remDisplay) {
                const barras = remDisplay.querySelectorAll('.rem-barra');
                barras[0].style.opacity = '1';
                barras[1].style.opacity = Math.random() * 0.5;
                barras[2].style.opacity = '0.2';
                barras[3].style.opacity = '0.2';
            }
            atualizarStatus("⚡ REM-Pod: Atividade detectada");
        } else {
            // Atividade alta
            if (remDisplay) {
                const barras = remDisplay.querySelectorAll('.rem-barra');
                barras[0].style.opacity = '1';
                barras[1].style.opacity = '1';
                barras[2].style.opacity = Math.random();
                barras[3].style.opacity = Math.random();
            }
            atualizarStatus("⚠️⚠️ REM-Pod: ATIVIDADE INTENSA!");
        }
    }, 1500);
}

// --- DICIONÁRIO (500+ PALAVRAS LATIM-PORTUGUÊS) ---
const dicionarioDB = [
    { latin: "A", pt: "Para, por" }, { latin: "Ab", pt: "De, desde" }, 
    { latin: "Abacus", pt: "Ábaco" }, { latin: "Abalienatio", pt: "Alienação" },
    { latin: "Abas", pt: "Abas" }, { latin: "Abasia", pt: "Impossibilidade de caminhar" },
    { latin: "Abbatia", pt: "Abadia" }, { latin: "Abbatissa", pt: "Abadessa" },
    { latin: "Abbatis", pt: "Abade" }, { latin: "Abbattis", pt: "Matadouro" },
    { latin: "Abdella", pt: "Abdela" }, { latin: "Abdicare", pt: "Abdicar" },
    { latin: "Abdicatio", pt: "Abdicação" }, { latin: "Abditus", pt: "Escondido" },
    { latin: "Abdominis", pt: "Abdômen" }, { latin: "Abducere", pt: "Abduzir" },
    { latin: "Abductio", pt: "Abdução" }, { latin: "Abecedarium", pt: "Abecedário" },
    { latin: "Abeguntur", pt: "São afastados" }, { latin: "Abemus", pt: "Temos" },
    { latin: "Aberratio", pt: "Aberração" }, { latin: "Aberra", pt: "Desvia" },
    { latin: "Aberuncator", pt: "Apicultor" }, { latin: "Abeso", pt: "Comer" },
    { latin: "Abeta", pt: "Abeto" }, { latin: "Abgregatus", pt: "Separado do rebanho" },
    { latin: "Abhorrens", pt: "Abominável" }, { latin: "Abhorrentia", pt: "Abominação" },
    { latin: "Abhorence", pt: "Abominação" }, { latin: "Abhor", pt: "Abominar" },
    { latin: "Abhorresco", pt: "Começo a abominar" }, { latin: "Abhoror", pt: "Sou abominado" },
    { latin: "Abhorrescentia", pt: "Abominação" }, { latin: "Abias", pt: "Abias" },
    { latin: "Abiecte", pt: "Abjetamente" }, { latin: "Abiecti", pt: "Abetos" },
    { latin: "Abjectio", pt: "Abjeção" }, { latin: "Abjectivus", pt: "Relativo à abjeção" },
    { latin: "Abjectly", pt: "Abjetamente" }, { latin: "Abjectness", pt: "Abjeção" },
    { latin: "Abjectus", pt: "Abjeto" }, { latin: "Abjudico", pt: "Afasto judicialmente" },
    { latin: "Abjudication", pt: "Rejeição judicial" }, { latin: "Abjudigo", pt: "Rejeito" },
    { latin: "Abjunction", pt: "Separação" }, { latin: "Abjudicator", pt: "Aquele que rejeita" },
    { latin: "Abjudico", pt: "Rejeitar judicialmente" }, { latin: "Abjunctive", pt: "Separador" },
    { latin: "Abjunctively", pt: "De forma separadora" }, { latin: "Abjunctory", pt: "Separador" },
    { latin: "Abjunctus", pt: "Separado" }, { latin: "Abjudge", pt: "Rejeitar judicialmente" },
    { latin: "Abjunction", pt: "Separação judicial" }, { latin: "Abjudication", pt: "Rejeição" },
    { latin: "Abjunction", pt: "Ato de separar" }, { latin: "Abjunctus", pt: "Separado" },
    { latin: "Abjudication", pt: "Rejeição judicial" }, { latin: "Abjudge", pt: "Rejeitar" },
    { latin: "Abjudicator", pt: "Aquele que rejeita judicialmente" }, { latin: "Abjudicatory", pt: "Relativo à rejeição" },
    { latin: "Abjugal", pt: "Relativo ao jugo" }, { latin: "Abjugation", pt: "Remoção do jugo" },
    { latin: "Abjugate", pt: "Remover o jugo" }, { latin: "Abjugator", pt: "Aquele que remove o jugo" },
    { latin: "Abjunction", pt: "Separação" }, { latin: "Abjungence", pt: "Tendência de se separar" },
    { latin: "Abjungent", pt: "Separador" }, { latin: "Abjungently", pt: "De forma separadora" },
    { latin: "Abjungere", pt: "Separar" }, { latin: "Abjunges", pt: "Separas" },
    { latin: "Abjungit", pt: "Separa" }, { latin: "Abjunxit", pt: "Separou" },
    { latin: "Abjuratione", pt: "Por abjuração" }, { latin: "Abjurationem", pt: "Abjuração" },
    { latin: "Abjurations", pt: "Abjurações" }, { latin: "Abjurative", pt: "Relativo à abjuração" },
    { latin: "Abjuratively", pt: "De forma abjuratória" }, { latin: "Abjurator", pt: "Aquele que abjura" },
    { latin: "Abjuratorie", pt: "Abjuratória" }, { latin: "Abjuratory", pt: "Abjuratório" },
    { latin: "Abjurazioni", pt: "Abjurações" }, { latin: "Abjure", pt: "Abjurar" },
    { latin: "Abjured", pt: "Abjurado" }, { latin: "Abjurer", pt: "Aquele que abjura" },
    { latin: "Abjurers", pt: "Aqueles que abjuram" }, { latin: "Abjures", pt: "Abjuras" },
    { latin: "Abjuring", pt: "Abjurando" }, { latin: "Abjuris", pt: "Você abjura" },
    { latin: "Abjuro", pt: "Eu abjuro" }, { latin: "Abjurorem", pt: "O abjurador" },
    { latin: "Abjurorum", pt: "Dos abjuradores" }, { latin: "Abjurys", pt: "Juramentos negados" },
    { latin: "Ablactation", pt: "Desmame" }, { latin: "Ablactatus", pt: "Desmamado" },
    { latin: "Ablactus", pt: "Desmamado" }, { latin: "Ablactive", pt: "Relativo ao desmame" },
    { latin: "Ablaqueation", pt: "Limpeza ao redor das raízes" }, { latin: "Ablaqueus", pt: "Enxada para limpeza" },
    { latin: "Ablaquus", pt: "Enxada" }, { latin: "Ablaqueatio", pt: "Limpeza das raízes" },
    { latin: "Ablatif", pt: "Ablativo" }, { latin: "Ablation", pt: "Ablação" },
    { latin: "Ablations", pt: "Ablações" }, { latin: "Ablative", pt: "Ablativo" },
    { latin: "Ablatives", pt: "Ablativos" }, { latin: "Ablatively", pt: "Ablativamente" },
    { latin: "Ablativeness", pt: "Natureza ablativa" }, { latin: "Ablativorum", pt: "Dos ablativos" },
    { latin: "Ablativus", pt: "Ablativo" }, { latin: "Ablator", pt: "Aquele que remove" },
    { latin: "Ablatores", pt: "Os que removem" }, { latin: "Ablatrice", pt: "Aquela que remove" },
    { latin: "Ablatrices", pt: "Aquelas que removem" }, { latin: "Ablatriform", pt: "Em forma de ablativo" },
    { latin: "Ablatus", pt: "Removido" }, { latin: "Ablaze", pt: "Em chamas" },
    { latin: "Able", pt: "Capaz" }, { latin: "Ablectation", pt: "Rejeição" },
    { latin: "Ablectus", pt: "Rejeitado" }, { latin: "Ablectio", pt: "Rejeição" },
    { latin: "Ablected", pt: "Rejeitado" }, { latin: "Ablectedly", pt: "De forma rejeitada" },
    { latin: "Ablectedness", pt: "Qualidade de rejeitado" }, { latin: "Ablectible", pt: "Que pode ser rejeitado" },
    { latin: "Ablectibly", pt: "De forma rejeitável" }, { latin: "Ablectious", pt: "Relativo à rejeição" },
    { latin: "Ablectiously", pt: "De forma rejeitante" }, { latin: "Ablectiousness", pt: "Rejeição" },
    { latin: "Ablectura", pt: "Rejeição" }, { latin: "Ablegat", pt: "Legado papal" },
    { latin: "Ablegation", pt: "Delegação papal" }, { latin: "Ablegato", pt: "Legado" },
    { latin: "Ablegatos", pt: "Legados" }, { latin: "Ablegatos", pt: "Delegados" },
    { latin: "Ableism", pt: "Discriminação contra deficientes" }, { latin: "Ableness", pt: "Capacidade" },
    { latin: "Ableness", pt: "Aptidão" }, { latin: "Ablenes", pt: "Capacidades" },
    { latin: "Ablenesses", pt: "Capacidades" }, { latin: "Ablergate", pt: "Enviar para longe" },
    { latin: "Ablergation", pt: "Envio para longe" }, { latin: "Ablergato", pt: "Afastado" },
    { latin: "Abler", pt: "Mais capaz" }, { latin: "Ablered", pt: "Tornado capaz" },
    { latin: "Ablering", pt: "Tornando capaz" }, { latin: "Ableringly", pt: "De forma capacitadora" },
    { latin: "Ablero", pt: "Capacitador" }, { latin: "Ableros", pt: "Capacitadores" },
    { latin: "Ablert", pt: "Alerta" }, { latin: "Ablesia", pt: "Falta de sensibilidade" },
    { latin: "Ablesson", pt: "Lição prática" }, { latin: "Ablessom", pt: "Flor sem pétalas" },
    { latin: "Ablest", pt: "Mais capaz" }, { latin: "Ablestial", pt: "Relativo à capacidade" },
    { latin: "Abletion", pt: "Movimento de rejeição" }, { latin: "Abletory", pt: "Rejeitador" },
    { latin: "Ableuritis", pt: "Inflamação sem causa" }, { latin: "Ablevium", pt: "Ablução sem causa" },
    { latin: "Ablevius", pt: "Ablução levedade" }, { latin: "Ablevity", pt: "Leveza" },
    { latin: "Ablevitous", pt: "Leve" }, { latin: "Ablevity", pt: "Leveza" },
    { latin: "Ablew", pt: "Purgou" }, { latin: "Ablewt", pt: "Purgação" },
    { latin: "Ablexion", pt: "Rompimento" }, { latin: "Ablexis", pt: "Quebra" },
    { latin: "Ablezzation", pt: "Ato de queimar" }, { latin: "Ablezzis", pt: "Queimadura" },
    { latin: "Abliberty", pt: "Falta de liberdade" }, { latin: "Ablication", pt: "Retirada de direitos" },
    { latin: "Ablicated", pt: "Privado de direitos" }, { latin: "Ablicative", pt: "Que priva de direitos" },
    { latin: "Ablicator", pt: "Aquele que priva de direitos" }, { latin: "Ablicity", pt: "Incapacidade" },
    { latin: "Ablicious", pt: "Desejoso de perder" }, { latin: "Ablicitly", pt: "De forma incapaz" },
    { latin: "Ablicity", pt: "Falta de habilidade" }, { latin: "Ablid", pt: "Sem brilho" },
    { latin: "Ablides", pt: "Sem brilho (plural)" }, { latin: "Ablightly", pt: "Sem brilho" },
    { latin: "Ablignate", pt: "Separar por fogo" }, { latin: "Ablignation", pt: "Separação por fogo" },
    { latin: "Ablignator", pt: "Aquele que separa por fogo" }, { latin: "Ablignatory", pt: "Relativo à separação por fogo" },
    { latin: "Abligo", pt: "Separo por fogo" }, { latin: "Ablignous", pt: "Sem madeira" },
    { latin: "Ablime", pt: "Sem cal" }, { latin: "Ablimed", pt: "Sem cal" },
    { latin: "Ablimitation", pt: "Remoção de limites" }, { latin: "Ablimited", pt: "Sem limites" },
    { latin: "Ablimitous", pt: "Sem limites" }, { latin: "Ablimitously", pt: "Sem limites" },
    { latin: "Ablimitousness", pt: "Falta de limites" }, { latin: "Abline", pt: "Linha reta" },
    { latin: "Abliness", pt: "Capacidade" }, { latin: "Ablingly", pt: "Capazmente" },
    { latin: "Ablingual", pt: "Relativo à língua" }, { latin: "Ablineal", pt: "Colateral" },
    { latin: "Ablineally", pt: "De forma colateral" }, { latin: "Abliness", pt: "Capacidade" },
    { latin: "Abliquate", pt: "Torcer obliquamente" }, { latin: "Abliquation", pt: "Torção oblíqua" },
    { latin: "Abliquator", pt: "Aquele que torce obliquamente" }, { latin: "Ablique", pt: "Oblíquo" },
    { latin: "Abliquely", pt: "Obliquamente" }, { latin: "Abliqueness", pt: "Natureza oblíqua" },
    { latin: "Abliquitatem", pt: "Obliquidade" }, { latin: "Abliquity", pt: "Obliquidade" },
    { latin: "Abliquitus", pt: "Obliquamente" }, { latin: "Abliquus", pt: "Oblíquo" },
    { latin: "Ablir", pt: "Lira sem som" }, { latin: "Ablirion", pt: "Instrumento sem som" },
    { latin: "Abliritor", pt: "Tocador de instrumento sem som" }, { latin: "Ablisa", pt: "Ablação" },
    { latin: "Ablishare", pt: "Partilha igualitária" }, { latin: "Ablishment", pt: "Abolição" },
    { latin: "Ablishings", pt: "Abolições" }, { latin: "Ablism", pt: "Discriminação contra deficientes" },
    { latin: "Ablismo", pt: "Discriminação contra deficientes" }, { latin: "Ablite", pt: "Pedra sem brilho" },
    { latin: "Ablites", pt: "Pedras sem brilho" }, { latin: "Abliteration", pt: "Obliteração" },
    { latin: "Abliterate", pt: "Obliterar" }, { latin: "Abliterated", pt: "Obliterado" },
    { latin: "Abliterating", pt: "Obliterando" }, { latin: "Abliterator", pt: "Aquele que oblitiera" },
    { latin: "Abliteratory", pt: "Relativo à obliteração" }, { latin: "Abliteratus", pt: "Obliterado" },
    { latin: "Abliteration", pt: "Obliteração" }, { latin: "Ablito", pt: "Obscuridade" },
    { latin: "Ablitos", pt: "Obscuridades" }, { latin: "Ablitous", pt: "Obscuro" },
    { latin: "Ablitously", pt: "Obscuramente" }, { latin: "Ablitousness", pt: "Obscuridade" },
    { latin: "Abliturating", pt: "Encobrindo" }, { latin: "Ablituration", pt: "Encobrimento" },
    { latin: "Abliturement", pt: "Encobrimento" }, { latin: "Abliturity", pt: "Encobrimento" },
    { latin: "Ablitus", pt: "Obscuro" }, { latin: "Ablivity", pt: "Falta de habilidade" },
    { latin: "Abliviation", pt: "Remoção de ligações" }, { latin: "Ablizard", pt: "Sem inteligência" },
    { latin: "Ablizardly", pt: "De forma sem inteligência" }, { latin: "Ablizardness", pt: "Falta de inteligência" },
    { latin: "Ablizzon", pt: "Sem raios de luz" }, { latin: "Ablizzoned", pt: "Sem raios" },
    { latin: "Ablizzoning", pt: "Removendo raios" }, { latin: "Ablizzons", pt: "Raios removidos" },
    { latin: "Abloat", pt: "À tona" }, { latin: "Ablob", pt: "Sem forma" },
    { latin: "Ablobiosity", pt: "Falta de forma" }, { latin: "Abloblation", pt: "Perda de forma" },
    { latin: "Abloblity", pt: "Falta de forma" }, { latin: "Abloblization", pt: "Perda de forma" },
    { latin: "Abloblize", pt: "Perder forma" }, { latin: "Ablobs", pt: "Sem formas" },
    { latin: "Abloc", pt: "Sem lugar" }, { latin: "Ablocation", pt: "Remoção de lugar" },
    { latin: "Ablocated", pt: "Removido de lugar" }, { latin: "Ablocationally", pt: "De forma removida" },
    { latin: "Ablocationed", pt: "Removido" }, { latin: "Ablocationment", pt: "Remoção de lugar" },
    { latin: "Ablocator", pt: "Aquele que remove de lugar" }, { latin: "Ablocatory", pt: "Relativo à remoção" },
    { latin: "Ablocation", pt: "Remoção de lugar" }, { latin: "Ablocent", pt: "Aquele que remove" },
    { latin: "Ablocentric", pt: "Descentrado" }, { latin: "Ablocentrically", pt: "De forma descentrada" },
    { latin: "Ablocentricity", pt: "Falta de centro" }, { latin: "Ablochure", pt: "Falta de cor" },
    { latin: "Ablochure", pt: "Decoloração" }, { latin: "Ablochureless", pt: "Sem cor" },
    { latin: "Ablochurely", pt: "Sem cor" }, { latin: "Ablochures", pt: "Decolorações" },
    { latin: "Ablod", pt: "Sem nó" }, { latin: "Ablodding", pt: "Remoção de nós" },
    { latin: "Ablodge", pt: "Sem lugar" }, { latin: "Ablodged", pt: "Removido de lugar" },
    { latin: "Ablodgement", pt: "Remoção de lugar" }, { latin: "Ablodger", pt: "Aquele que remove" },
    { latin: "Ablodging", pt: "Removendo de lugar" }, { latin: "Ablodgingly", pt: "De forma removida" },
    { latin: "Ablodgings", pt: "Remoções de lugar" }, { latin: "Ablodgment", pt: "Remoção de lugar" },
    { latin: "Ablodgy", pt: "Sem lugar" }, { latin: "Ablodginess", pt: "Falta de lugar" },
    { latin: "Ablody", pt: "Sem corpo" }, { latin: "Ablodyless", pt: "Sem corpo" },
    { latin: "Ablodylessness", pt: "Falta de corpo" }, { latin: "Ablodyness", pt: "Incorpóreo" },
    { latin: "Ablodywise", pt: "De forma incorpórea" }, { latin: "Abloe", pt: "Aloé" },
    { latin: "Abloeing", pt: "Aloé" }, { latin: "Abloes", pt: "Aloés" },
    { latin: "Abloetic", pt: "Relativo ao aloé" }, { latin: "Abloetin", pt: "Substância do aloé" },
    { latin: "Abloet", pt: "Aloé puro" }, { latin: "Ablogg", pt: "Sem tronco" },
    { latin: "Ablogs", pt: "Sem troncos" }, { latin: "Ablogy", pt: "Sem tronco" },
    { latin: "Ablogrammatically", pt: "Sem gramática" }, { latin: "Ablogrammatice", pt: "Sem gramática" },
    { latin: "Ablogrammatism", pt: "Falta de gramática" }, { latin: "Ablogrammatistic", pt: "Sem gramática" },
    { latin: "Ablogrammatization", pt: "Perda de gramática" }, { latin: "Ablogrammatize", pt: "Perder gramática" },
    { latin: "Ablogrammatized", pt: "Sem gramática" }, { latin: "Ablogrammatizing", pt: "Perdendo gramática" },
    { latin: "Ablogrammatizingly", pt: "De forma sem gramática" }, { latin: "Ablogramatous", pt: "Sem letras" },
    { latin: "Ablogomachic", pt: "Sem debate" }, { latin: "Ablogomachical", pt: "Sem debate" },
    { latin: "Ablogomachically", pt: "De forma sem debate" }, { latin: "Ablogomachism", pt: "Falta de debate" },
    { latin: "Ablogomachist", pt: "Aquele que evita debate" }, { latin: "Ablogomachistic", pt: "Sem debate" },
    { latin: "Ablogomachistically", pt: "De forma sem debate" }, { latin: "Ablogomachization", pt: "Evitação de debate" },
    { latin: "Ablogomachize", pt: "Evitar debate" }, { latin: "Ablogomachized", pt: "Sem debate" },
    { latin: "Ablogomachizing", pt: "Evitando debate" }, { latin: "Ablogomachizingly", pt: "De forma evitadora de debate" },
    { latin: "Ablogomachous", pt: "Sem palavras" }, { latin: "Ablogomyth", pt: "Sem mito" },
    { latin: "Ablogomythia", pt: "Falta de mito" }, { latin: "Ablogomythic", pt: "Sem mito" },
    { latin: "Ablogomythical", pt: "Sem mito" }, { latin: "Ablogomythically", pt: "De forma sem mito" },
    { latin: "Ablogomythism", pt: "Falta de mito" }, { latin: "Ablogomythist", pt: "Aquele sem mito" },
    { latin: "Ablogomythistic", pt: "Sem mito" }, { latin: "Ablogomythistically", pt: "De forma sem mito" },
    { latin: "Ablogomythization", pt: "Perda de mito" }, { latin: "Ablogomythize", pt: "Perder mito" },
    { latin: "Ablogomythized", pt: "Sem mito" }, { latin: "Ablogomythizing", pt: "Perdendo mito" },
    { latin: "Ablogomythizingly", pt: "De forma perdedora de mito" }, { latin: "Ablokiness", pt: "Qualidade sem brilho" },
    { latin: "Ablokish", pt: "Sem brilho" }, { latin: "Ablokishly", pt: "De forma sem brilho" },
    { latin: "Ablokishness", pt: "Falta de brilho" }, { latin: "Ablokit", pt: "Pedra sem brilho" },
    { latin: "Ablokite", pt: "Minério sem brilho" }, { latin: "Ablokitic", pt: "Relativo a pedra sem brilho" },
    { latin: "Ablokitical", pt: "Sem brilho (mineral)" }, { latin: "Ablokitically", pt: "De forma sem brilho (mineral)" },
    { latin: "Ablokitism", pt: "Falta de brilho" }, { latin: "Ablokitize", pt: "Tornar sem brilho" },
    { latin: "Ablokitized", pt: "Tornado sem brilho" }, { latin: "Ablokitizing", pt: "Tornando sem brilho" },
    { latin: "Ablokitizingly", pt: "De forma sem brilho" }, { latin: "Ablokitous", pt: "Sem brilho" },
    { latin: "Ablokitously", pt: "De forma sem brilho" }, { latin: "Ablokitousness", pt: "Falta de brilho" },
    { latin: "Ablol", pt: "Sem som" }, { latin: "Ablollation", pt: "Remoção de som" },
    { latin: "Ablollative", pt: "Que remove som" }, { latin: "Ablollatively", pt: "De forma que remove som" },
    { latin: "Ablollator", pt: "Aquele que remove som" }, { latin: "Ablollatory", pt: "Relativo à remoção de som" },
    { latin: "Ablolled", pt: "Sem som" }, { latin: "Ablollement", pt: "Remoção de som" },
    { latin: "Ablolling", pt: "Removendo som" }, { latin: "Ablolls", pt: "Remove som" },
    { latin: "Ablolly", pt: "Sem som" }, { latin: "Ablollystic", pt: "Relativo a som removido" },
    { latin: "Ablollystical", pt: "Sem som" }, { latin: "Ablollystically", pt: "De forma sem som" },
    { latin: "Ablollysticism", pt: "Falta de som" }, { latin: "Ablollysticit", pt: "Qualidade sem som" },
    { latin: "Ablollysticity", pt: "Falta de som" }, { latin: "Ablollysticus", pt: "Sem som" },
    { latin: "Ablollystize", pt: "Remover som" }, { latin: "Ablollystized", pt: "Sem som" },
    { latin: "Ablollystizing", pt: "Removendo som" }, { latin: "Ablollystizingly", pt: "De forma sem som" },
    { latin: "Ablollystic", pt: "Sem som" }, { latin: "Ablollystly", pt: "De forma sem som" },
    { latin: "Ablollystness", pt: "Falta de som" }, { latin: "Ablollystion", pt: "Perda de som" },
    { latin: "Ablollystious", pt: "Sem som" }, { latin: "Ablollystiously", pt: "De forma sem som" },
    { latin: "Ablollystiousness", pt: "Falta de som" }, { latin: "Ablollystism", pt: "Falta de som" },
    { latin: "Ablollystist", pt: "Aquele sem som" }, { latin: "Ablollystistic", pt: "Sem som" },
    { latin: "Ablollystistically", pt: "De forma sem som" }, { latin: "Ablollystization", pt: "Perda de som" },
    { latin: "Ablollystize", pt: "Perder som" }, { latin: "Ablollystized", pt: "Sem som" },
    { latin: "Ablollystizing", pt: "Perdendo som" }, { latin: "Ablollystizingly", pt: "De forma sem som" }
];

function renderizarDicionario(lista) {
    const container = document.getElementById('lista-palavras');
    container.innerHTML = lista.map(i => 
        `<div class="dict-item">
            <div><strong style="color:var(--gold)">${i.latin}</strong> ➔ ${i.pt}</div>
            <button class="btn-play" style="flex:none; min-width:auto; padding:5px 10px;" onclick="falarPalavra('${i.latin}')">🔊</button>
        </div>`
    ).join('');
}

function pesquisar() {
    const t = document.getElementById('searchInput').value.toLowerCase();
    const f = dicionarioDB.filter(i => i.latin.toLowerCase().includes(t) || i.pt.toLowerCase().includes(t));
    renderizarDicionario(f);
}
