import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton,
  IonAlert,
  IonModal,
  IonList,
  IonItem,
  IonLabel
} from '@ionic/angular';
import { PartidaHistorial, StorageService } from '../service/storage';

interface Card {
  id: number;
  key: string;
  emoji: string;
  revealed: boolean;
  matched: boolean;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonAlert,
    IonModal,
    IonList,
    IonItem,
    IonLabel,
    DatePipe
  ]
})
export class HomePage implements OnInit {

  // ALERTA PARA EL NOMBRE
  public alertButtons = [{
    text: 'OK',
    handler: (data: any) => {
      const nombre = data.nombre.trim();
      if (nombre && nombre.length > 0) {
        this.guardarNombre(nombre);
        this.nombreUsuario = nombre;
        // ✅ RECARGAR JUEGO DESPUÉS DE PONER NOMBRE
        this.newGame();
      } else {
        this.guardarNombre('Anónimo');
        this.nombreUsuario = 'Anónimo';
        this.newGame();
      }
    }
  }];
  
  public alertInputs = [
    {
      name: "nombre",
      placeholder: 'Escribe tu nombre',
      attributes: {
        maxlength: 20
      }
    }
  ];

  // ⚙️ CONFIGURACIÓN
  pairs = 8;

  // 🃏 ESTADO DEL JUEGO
  cards: Card[] = [];
  firstPick: Card | null = null;
  secondPick: Card | null = null;
  boardLocked = false;
  attempts = 0;
  matches = 0;

  // 🏆 MEJOR MARCA
  bestAttempts = 0;

  // 👤 NOMBRE USUARIO
  nombreUsuario: string = '';
  
  // 📜 HISTORIAL
  history: PartidaHistorial[] = [];
  isHistoryOpen = false;

  // 🎨 TEMA: MASCOTAS
  private emojis = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'
  ];

  constructor(
    private storageService: StorageService
  ) {}

  async ngOnInit() {
    console.log('🔄 ngOnInit ejecutado');

    await this.storageService.init();
    
    // Recuperar nombre guardado
    this.nombreUsuario = await this.storageService.getNombreUsuario();
    console.log('👤 Nombre:', this.nombreUsuario);
    
    // Si no hay nombre, mostrar alerta automáticamente
    if (!this.nombreUsuario || this.nombreUsuario === '') {
      setTimeout(() => {
        document.getElementById('present-alert')?.click();
      }, 500);
    } else {
      // ✅ Si ya hay nombre, iniciar juego
      this.bestAttempts = await this.storageService.getBestAttempts();
      console.log('🏆 Mejor récord:', this.bestAttempts);
      this.newGame();
    }
  }

  // Guardar nombre
  async guardarNombre(nombre: string) {
    await this.storageService.saveNombreUsuario(nombre);
    this.nombreUsuario = nombre;
  }

  newGame() {
    console.log('🆕 newGame ejecutado');
    this.attempts = 0;
    this.matches = 0;
    this.firstPick = null;
    this.secondPick = null;
    this.boardLocked = false;
    this.buildDeck(); // ✅ Asegurar que se construye el mazo
  }

  buildDeck() {
    console.log('🃏 buildDeck ejecutado');
    console.log('📋 Emojis disponibles:', this.emojis);
    
    const selectedEmojis = this.emojis.slice(0, this.pairs);
    console.log('📋 Emojis seleccionados:', selectedEmojis);

    let deck: Card[] = [];
    let idCounter = 0;

    selectedEmojis.forEach((emoji, index) => {
      deck.push({
        id: idCounter++,
        key: `pair-${index}`,
        emoji: emoji,
        revealed: false,
        matched: false
      });
      deck.push({
        id: idCounter++,
        key: `pair-${index}`,
        emoji: emoji,
        revealed: false,
        matched: false
      });
    });

    console.log('📦 Mazo sin barajar:', deck);

    // Barajar Fisher-Yates
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    this.cards = deck;
    console.log('✅ Cartas finales:', this.cards);
    console.log('✅ Total de cartas:', this.cards.length);
  }

  onCardClick(card: Card) {
    console.log('👆 Click en carta:', card.emoji);

    if (card.revealed || card.matched || this.boardLocked) {
      console.log('🚫 Carta bloqueada');
      return;
    }

    if (this.firstPick === null) {
      console.log('🔵 Primera carta seleccionada:', card.emoji);
      card.revealed = true;
      this.firstPick = card;
      return;
    }

    if (this.secondPick === null) {
      console.log('🟢 Segunda carta seleccionada:', card.emoji);
      card.revealed = true;
      this.secondPick = card;
      this.attempts++;
      this.boardLocked = true;

      const isMatch = this.firstPick.key === card.key;
      console.log('🔍 ¿Son pareja?', isMatch);

      if (isMatch) {
        console.log('✅ ¡ACERTARON!');
        this.firstPick.matched = true;
        this.secondPick.matched = true;
        this.matches++;
        this.resetTurn();

        if (this.finished) {
          this.onGameFinish();
        }
      } else {
        console.log('❌ Fallaron, esperando 800ms...');
        setTimeout(() => {
          if (this.firstPick) {
            this.firstPick.revealed = false;
          }
          if (this.secondPick) {
            this.secondPick.revealed = false;
          }
          this.resetTurn();
        }, 800);
      }
    }
  }

  private async onGameFinish() {
    console.log('🏆 ¡JUEGO TERMINADO!');
    console.log('🎯 Intentos:', this.attempts);

    await this.storageService.saveHistory({
      fecha: new Date().toISOString(),
      attempts: this.attempts,
      win: true,
      nombre: this.nombreUsuario
    });

    const isRecord = await this.storageService.saveBestAttemptsIfRecord(this.attempts);
    if (isRecord) {
      this.bestAttempts = this.attempts;
      console.log('🏆 ¡NUEVO RÉCORD!');
    }
  }

  resetTurn() {
    console.log('🔄 Reset turno');
    this.firstPick = null;
    this.secondPick = null;
    this.boardLocked = false;
  }

  async openHistory() {
    this.history = await this.storageService.getHistory();
    this.isHistoryOpen = true;
  }

  closeHistory() {
    this.isHistoryOpen = false;
  }

  get finished(): boolean {
    return this.matches === this.pairs;
  }
}