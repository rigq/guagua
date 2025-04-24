import { Deck } from './Deck.js';
import { EmbedBuilder } from 'discord.js';

// Game states
export const GameState = {
  BETTING: 'betting',     // Players are placing bets
  PLAYING: 'playing',     // Game in progress
  ROUND_END: 'round_end', // End of a round
  GAME_END: 'game_end'    // Game over
};

// Game rounds
export const GameRound = {
  RED_BLACK: 1,       // Round 1: Guess card color
  HIGH_LOW: 2,        // Round 2: Guess higher/lower
  IN_OUT: 3,          // Round 3: Guess in/out of range
  SUIT: 4,            // Round 4: Guess suit
  COMPLETED: 5        // All rounds complete
};

// Multipliers for each round
export const MULTIPLIERS = {
  [GameRound.RED_BLACK]: 2,
  [GameRound.HIGH_LOW]: 3,
  [GameRound.IN_OUT]: 4,
  [GameRound.SUIT]: 10
};

export class RideTheBusGame {
  constructor(channelId) {
    this.channelId = channelId;
    this.players = new Map(); // Map of player IDs to player data
    this.currentPlayerIndex = 0;
    this.deck = new Deck();
    this.state = GameState.BETTING;
    this.round = GameRound.RED_BLACK;
    this.startTime = Date.now();
    this.drawnCards = [];
    this.waitingForResponse = false;
    this.timeout = null;
  }

  addPlayer(userId, username, bet) {
    if (this.players.has(userId)) {
      return false; // Player already in game
    }

    this.players.set(userId, {
      id: userId,
      username,
      bet,
      currentWinnings: bet,
      round: GameRound.RED_BLACK,
      cards: [],
      isActive: true,
      cashOut: false
    });

    return true;
  }

  get currentPlayer() {
    const playerIds = Array.from(this.players.keys());
    if (playerIds.length === 0) return null;
    
    // Only consider active players
    const activePlayers = Array.from(this.players.values()).filter(p => p.isActive);
    if (activePlayers.length === 0) return null;
    
    return activePlayers[this.currentPlayerIndex % activePlayers.length];
  }

  nextPlayer() {
    // Get only active players
    const activePlayers = Array.from(this.players.values()).filter(p => p.isActive);
    if (activePlayers.length === 0) return null;
    
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % activePlayers.length;
    return this.currentPlayer;
  }

  drawCard() {
    const card = this.deck.deal();
    this.drawnCards.push(card);
    return card;
  }

  getRoundInstructions() {
    switch (this.currentPlayer.round) {
      case GameRound.RED_BLACK:
        return "Adivina si la próxima carta será **ROJA** o **NEGRA** (×2)";
      case GameRound.HIGH_LOW:
        return `Adivina si la próxima carta será **MÁS ALTA** o **MÁS BAJA** que ${this.currentPlayer.cards[0].displayName} (×3)`;
      case GameRound.IN_OUT:
        const [card1, card2] = this.currentPlayer.cards;
        const min = Math.min(card1.numericValue, card2.numericValue);
        const max = Math.max(card1.numericValue, card2.numericValue);
        return `Adivina si la próxima carta estará **ENTRE** (${min}-${max}) o **FUERA** del rango de tus cartas anteriores (×4)`;
      case GameRound.SUIT:
        return "Adivina el **PALO** de la próxima carta (**CORAZONES**, **DIAMANTES**, **TRÉBOLES**, **PICAS**) (×10)";
      default:
        return "¡Has completado todas las rondas!";
    }
  }

  processGuess(guess) {
    const player = this.currentPlayer;
    if (!player) return { success: false, message: "No hay jugador activo." };

    let card, success, message;

    switch (player.round) {
      case GameRound.RED_BLACK:
        card = this.drawCard();
        player.cards.push(card);
        success = (guess.toLowerCase() === 'roja' && card.color === 'RED') || 
                  (guess.toLowerCase() === 'negra' && card.color === 'BLACK');
        
        if (success) {
          player.currentWinnings *= MULTIPLIERS[GameRound.RED_BLACK];
          player.round = GameRound.HIGH_LOW;
          message = `¡Correcto! La carta es ${card.displayName}. Tus ganancias actuales: ${player.currentWinnings} créditos.`;
        } else {
          player.isActive = false;
          message = `¡Incorrecto! La carta es ${card.displayName}. Has perdido tu apuesta de ${player.bet} créditos.`;
        }
        break;

      case GameRound.HIGH_LOW:
        card = this.drawCard();
        player.cards.push(card);
        const prevCard = player.cards[0];
        
        success = (guess.toLowerCase() === 'alta' && card.numericValue > prevCard.numericValue) ||
                  (guess.toLowerCase() === 'baja' && card.numericValue < prevCard.numericValue);
        
        // If equal, player loses
        if (card.numericValue === prevCard.numericValue) {
          success = false;
          message = `¡Mala suerte! La carta es ${card.displayName}, igual que tu carta anterior. Has perdido tu apuesta de ${player.bet} créditos.`;
        } else if (success) {
          player.currentWinnings *= MULTIPLIERS[GameRound.HIGH_LOW];
          player.round = GameRound.IN_OUT;
          message = `¡Correcto! La carta es ${card.displayName}. Tus ganancias actuales: ${player.currentWinnings} créditos.`;
        } else {
          player.isActive = false;
          message = `¡Incorrecto! La carta es ${card.displayName}. Has perdido tu apuesta de ${player.bet} créditos.`;
        }
        break;

      case GameRound.IN_OUT:
        card = this.drawCard();
        player.cards.push(card);
        const [card1, card2] = [player.cards[0], player.cards[1]];
        const min = Math.min(card1.numericValue, card2.numericValue);
        const max = Math.max(card1.numericValue, card2.numericValue);
        
        const isInRange = card.numericValue > min && card.numericValue < max;
        
        success = (guess.toLowerCase() === 'entre' && isInRange) ||
                  (guess.toLowerCase() === 'fuera' && !isInRange);
        
        if (success) {
          player.currentWinnings *= MULTIPLIERS[GameRound.IN_OUT];
          player.round = GameRound.SUIT;
          message = `¡Correcto! La carta es ${card.displayName}. Tus ganancias actuales: ${player.currentWinnings} créditos.`;
        } else {
          player.isActive = false;
          message = `¡Incorrecto! La carta es ${card.displayName}. Has perdido tu apuesta de ${player.bet} créditos.`;
        }
        break;

      case GameRound.SUIT:
        card = this.drawCard();
        player.cards.push(card);
        
        // Convert Spanish suit names to English for comparison
        const guessSuit = guess.toLowerCase();
        let matchingSuit = null;
        
        if (guessSuit === 'corazones') matchingSuit = 'hearts';
        else if (guessSuit === 'diamantes') matchingSuit = 'diamonds';
        else if (guessSuit === 'tréboles') matchingSuit = 'clubs';
        else if (guessSuit === 'picas') matchingSuit = 'spades';
        
        success = card.suitName === matchingSuit;
        
        if (success) {
          player.currentWinnings *= MULTIPLIERS[GameRound.SUIT];
          player.round = GameRound.COMPLETED;
          message = `¡INCREÍBLE! Adivinaste el palo. La carta es ${card.displayName}. Has ganado ${player.currentWinnings} créditos.`;
          player.cashOut = true; // Auto cash out after completing all rounds
        } else {
          player.isActive = false;
          message = `¡Incorrecto! La carta es ${card.displayName}. Has perdido tu apuesta de ${player.bet} créditos.`;
        }
        break;

      default:
        return { success: false, message: "Ronda inválida." };
    }

    return {
      success,
      message,
      card,
      player,
      isGameOver: this.checkGameOver()
    };
  }

  cashOut(userId) {
    const player = this.players.get(userId);
    if (!player) return { success: false, message: "Jugador no encontrado." };
    if (!player.isActive) return { success: false, message: "No puedes retirarte si ya has perdido." };
    
    player.cashOut = true;
    player.isActive = false;
    
    return {
      success: true,
      message: `¡Te has retirado con ${player.currentWinnings} créditos!`,
      player,
      isGameOver: this.checkGameOver()
    };
  }

  checkGameOver() {
    // Game is over if no active players remain
    return Array.from(this.players.values()).every(p => !p.isActive);
  }

  createGameEmbed() {
    const embed = new EmbedBuilder()
      .setTitle("🎲 La Guagua - Juego de Apuestas 🎲")
      .setColor(0x0099FF)
      .setTimestamp();

    let description = "**Estado del juego:**\n";
    
    if (this.state === GameState.BETTING) {
      description += "Esperando a que los jugadores se unan. Usa `/apostar` para unirte.\n\n";
    } else {
      const currentPlayer = this.currentPlayer;
      if (currentPlayer) {
        description += `Turno de: ${currentPlayer.username}\n`;
        description += `Ronda: ${currentPlayer.round} de 4\n`;
        description += `Apuesta inicial: ${currentPlayer.bet} créditos\n`;
        description += `Ganancias actuales: ${currentPlayer.currentWinnings} créditos\n\n`;
        description += `**Instrucciones:** ${this.getRoundInstructions()}\n\n`;
      }
    }

    // Add player status
    if (this.players.size > 0) {
      description += "**Jugadores:**\n";
      for (const player of this.players.values()) {
        const status = player.isActive ? "🎮 Jugando" : player.cashOut ? "💰 Retirado" : "❌ Perdió";
        description += `${player.username} - ${status} - ${player.currentWinnings} créditos\n`;
      }
    }

    embed.setDescription(description);
    return embed;
  }
}