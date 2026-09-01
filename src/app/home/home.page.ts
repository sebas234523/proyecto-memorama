import { Component, OnInit } from '@angular/core';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton
} from '@ionic/angular';

import { CommonModule } from '@angular/common';

import { StorageService } from '../service/storage';

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
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    CommonModule
  ]

})

export class HomePage implements OnInit {

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

  // 🎨 TEMA: MASCOTAS

  private emojis = [

    '🐶',
    '🐱',
    '🐭',
    '🐹',
    '🐰',
    '🦊',
    '🐻',
    '🐼',
    '🐨',
    '🐯',
    '🦁',
    '🐮',
    '🐷',
    '🐸',
    '🐵',
    '🐔'

  ];

  constructor(
    private storageService: StorageService
  ) {}

  async ngOnInit() {

    console.log('🔄 ngOnInit ejecutado');

    // Inicializar almacenamiento

    await this.storageService.init();

    // Recuperar mejor récord

    this.bestAttempts =
      await this.storageService.getBestAttempts();

    console.log(
      '🏆 Mejor récord:',
      this.bestAttempts
    );

    // Crear nuevo juego

    this.newGame();

  }

  newGame() {

    console.log('🆕 newGame ejecutado');

    this.attempts = 0;

    this.matches = 0;

    this.firstPick = null;

    this.secondPick = null;

    this.boardLocked = false;

    this.buildDeck();

  }

  buildDeck() {

    console.log('🃏 buildDeck ejecutado');

    // Seleccionar los primeros 'pairs' emojis

    const selectedEmojis =
      this.emojis.slice(0, this.pairs);

    console.log(
      '📋 Emojis seleccionados:',
      selectedEmojis
    );

    let deck: Card[] = [];

    let idCounter = 0;

    // Crear dos cartas por cada emoji

    selectedEmojis.forEach(
      (emoji, index) => {

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

      }
    );

    console.log(
      '📦 Mazo sin barajar:',
      deck.length,
      'cartas'
    );

    // Barajar Fisher-Yates

    for (
      let i = deck.length - 1;
      i > 0;
      i--
    ) {

      const j =
        Math.floor(
          Math.random() * (i + 1)
        );

      [
        deck[i],
        deck[j]
      ] =
      [
        deck[j],
        deck[i]
      ];

    }

    this.cards = deck;

    console.log(
      '✅ Cartas finales:',
      this.cards.length,
      'cartas'
    );

  }

  onCardClick(card: Card) {

    console.log(
      '👆 Click en carta:',
      card.emoji
    );

    // Evitar seleccionar cartas bloqueadas

    if (
      card.revealed ||
      card.matched ||
      this.boardLocked
    ) {

      console.log(
        '🚫 Carta bloqueada'
      );

      return;

    }

    // Primera carta

    if (this.firstPick === null) {

      console.log(
        '🔵 Primera carta seleccionada:',
        card.emoji
      );

      card.revealed = true;

      this.firstPick = card;

      return;

    }

    // Segunda carta

    if (this.secondPick === null) {

      console.log(
        '🟢 Segunda carta seleccionada:',
        card.emoji
      );

      card.revealed = true;

      this.secondPick = card;

      // Aumentar intento

      this.attempts++;

      this.boardLocked = true;

      // Comprobar pareja

      const isMatch =
        this.firstPick.key === card.key;

      console.log(
        '🔍 ¿Son pareja?',
        isMatch
      );

      if (isMatch) {

        console.log(
          '✅ ¡ACERTARON!'
        );

        this.firstPick.matched = true;

        this.secondPick.matched = true;

        this.matches++;

        this.resetTurn();

        // Comprobar si terminó el juego

        if (this.finished) {

          this.onGameFinish();

        }

      } else {

        console.log(
          '❌ Fallaron, esperando 800ms...'
        );

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

  // 🏆 GUARDAR PARTIDA TERMINADA

  private async onGameFinish() {

    console.log(
      '🏆 ¡JUEGO TERMINADO!'
    );

    console.log(
      '🎯 Intentos:',
      this.attempts
    );

    // Guardar partida en historial

    await this.storageService.saveHistory({

      fecha: new Date().toISOString(),

      attempts: this.attempts,

      win: true

    });

    // Comprobar si consiguió récord

    const isRecord =
      await this.storageService
        .saveBestAttemptsIfRecord(
          this.attempts
        );

    // Actualizar récord en pantalla

    if (isRecord) {

      this.bestAttempts =
        this.attempts;

      console.log(
        '🏆 ¡NUEVO RÉCORD!'
      );

    }

  }

  resetTurn() {

    console.log(
      '🔄 Reset turno'
    );

    this.firstPick = null;

    this.secondPick = null;

    this.boardLocked = false;

  }

  get finished(): boolean {

    const isFinished =
      this.matches === this.pairs;

    if (isFinished) {

      console.log(
        '🏆 ¡JUEGO TERMINADO!'
      );

    }

    return isFinished;

  }

}