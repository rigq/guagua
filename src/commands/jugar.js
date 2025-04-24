import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { RideTheBusGame } from '../game/GameManager.js';

export const data = new SlashCommandBuilder()
  .setName('jugar')
  .setDescription('Únete a la partida actual de Ride the Bus');

export async function execute(interaction, client) {
  const userId = interaction.user.id;
  const username = interaction.user.username;
  const channelId = interaction.channelId;
  
  // Check if player has placed a bet
  if (!client.pendingBets || !client.pendingBets.has(userId)) {
    return interaction.reply({
      content: 'Primero debes realizar una apuesta con el comando /apostar.',
      ephemeral: true
    });
  }
  
  const pendingBet = client.pendingBets.get(userId);
  
  // Verify the bet is for this channel
  if (pendingBet.channelId !== channelId) {
    return interaction.reply({
      content: 'Tu apuesta fue realizada en otro canal. Por favor, usa /jugar en el mismo canal donde hiciste la apuesta.',
      ephemeral: true
    });
  }
  
  // Check for existing game or create new one
  let game = client.activeGames.get(channelId);
  if (!game) {
    game = new RideTheBusGame(channelId);
    client.activeGames.set(channelId, game);
  }
  
  // Add player to the game
  const added = game.addPlayer(userId, username, pendingBet.betAmount);
  
  if (!added) {
    return interaction.reply({
      content: 'Ya estás participando en esta partida.',
      ephemeral: true
    });
  }
  
  // Clear the pending bet
  client.pendingBets.delete(userId);
  
  await interaction.reply(`¡${username} se ha unido a la partida con ${pendingBet.betAmount} créditos!`);
  
  // If this is the first player, start the game
  if (game.players.size === 1) {
    game.state = 'playing';
    
    // Send game status
    const gameEmbed = game.createGameEmbed();
    const message = await interaction.channel.send({ embeds: [gameEmbed] });
    
    // Start game loop
    await startPlayerTurn(interaction.channel, game, client);
  } else {
    // Update game status for all players
    const gameEmbed = game.createGameEmbed();
    await interaction.channel.send({ embeds: [gameEmbed] });
  }
}

async function startPlayerTurn(channel, game, client) {
  if (game.checkGameOver()) {
    await endGame(channel, game, client);
    return;
  }
  
  const currentPlayer = game.currentPlayer;
  if (!currentPlayer) {
    await endGame(channel, game, client);
    return;
  }
  
  const instructions = game.getRoundInstructions();
  const embed = new EmbedBuilder()
    .setTitle(`Turno de ${currentPlayer.username}`)
    .setDescription(`${instructions}\n\nResponde directamente en el chat con tu elección o escribe "retirar" para cobrar tus ganancias actuales.`)
    .setColor(0x00AE86);
  
  await channel.send({ content: `<@${currentPlayer.id}>, es tu turno!`, embeds: [embed] });
  
  // Set up a message collector to wait for player's response
  game.waitingForResponse = true;
  
  const filter = m => m.author.id === currentPlayer.id;
  const collector = channel.createMessageCollector({ filter, time: 30000, max: 1 });
  
  collector.on('collect', async message => {
    const response = message.content.toLowerCase();
    
    // Handle cash out request
    if (response === 'retirar' || response === 'cobrar') {
      const result = game.cashOut(currentPlayer.id);
      await channel.send(result.message);
      
      if (result.isGameOver) {
        await endGame(channel, game, client);
      } else {
        // Move to next player
        game.nextPlayer();
        await startPlayerTurn(channel, game, client);
      }
      return;
    }
    
    // Handle guess
    let validGuess = false;
    switch (currentPlayer.round) {
      case 1: // RED_BLACK
        validGuess = ['roja', 'negra'].includes(response);
        break;
      case 2: // HIGH_LOW
        validGuess = ['alta', 'baja'].includes(response);
        break;
      case 3: // IN_OUT
        validGuess = ['entre', 'fuera'].includes(response);
        break;
      case 4: // SUIT
        validGuess = ['corazones', 'diamantes', 'tréboles', 'picas'].includes(response);
        break;
    }
    
    if (!validGuess) {
      await channel.send('Respuesta no válida. Por favor, intenta de nuevo con una opción válida.');
      collector.stop();
      // Restart turn
      await startPlayerTurn(channel, game, client);
      return;
    }
    
    const result = game.processGuess(response);
    await channel.send(result.message);
    
    // Display the game status
    const gameEmbed = game.createGameEmbed();
    await channel.send({ embeds: [gameEmbed] });
    
    if (result.success && currentPlayer.round === 5) { // COMPLETED all rounds
      await channel.send(`¡${currentPlayer.username} ha completado todas las rondas y ganado ${currentPlayer.currentWinnings} créditos!`);
      
      // Update player stats in DB
      const Player = await import('../database/models/Player.js').then(module => module.Player);
      const playerDB = await Player.findOne({ userId: currentPlayer.id });
      if (playerDB) {
        await playerDB.recordWin(currentPlayer.currentWinnings);
      }
      
      if (result.isGameOver) {
        await endGame(channel, game, client);
      } else {
        // Move to next player
        game.nextPlayer();
        await startPlayerTurn(channel, game, client);
      }
    } else if (!result.success) {
      // Player lost
      const Player = await import('../database/models/Player.js').then(module => module.Player);
      const playerDB = await Player.findOne({ userId: currentPlayer.id });
      if (playerDB) {
        await playerDB.recordLoss(currentPlayer.bet);
      }
      
      if (result.isGameOver) {
        await endGame(channel, game, client);
      } else {
        // Move to next player
        game.nextPlayer();
        await startPlayerTurn(channel, game, client);
      }
    } else {
      // Continue with the same player for the next round
      await startPlayerTurn(channel, game, client);
    }
  });
  
  collector.on('end', async collected => {
    if (collected.size === 0) {
      // Player didn't respond in time
      await channel.send(`<@${currentPlayer.id}> no respondió a tiempo y perdió su apuesta de ${currentPlayer.bet} créditos.`);
      
      // Mark player as inactive
      currentPlayer.isActive = false;
      
      // Update player stats in DB
      const Player = await import('../database/models/Player.js').then(module => module.Player);
      const playerDB = await Player.findOne({ userId: currentPlayer.id });
      if (playerDB) {
        await playerDB.recordLoss(currentPlayer.bet);
      }
      
      if (game.checkGameOver()) {
        await endGame(channel, game, client);
      } else {
        // Move to next player
        game.nextPlayer();
        await startPlayerTurn(channel, game, client);
      }
    }
  });
}

async function endGame(channel, game, client) {
  // Finalize game results
  let resultsEmbed = new EmbedBuilder()
    .setTitle('🎮 Ride the Bus - Resultados Finales 🎮')
    .setColor(0xFFD700)
    .setTimestamp();
  
  let description = '**Resultados:**\n\n';
  
  for (const player of game.players.values()) {
    if (player.cashOut || player.round === 5) { // Successfully cashed out or completed all rounds
      description += `🏆 ${player.username} ganó ${player.currentWinnings} créditos\n`;
      
      // Update player's balance in the database
      const Player = await import('../database/models/Player.js').then(module => module.Player);
      const playerDB = await Player.findOne({ userId: player.id });
      if (playerDB) {
        playerDB.balance += player.currentWinnings;
        await playerDB.save();
      }
    } else {
      description += `❌ ${player.username} perdió ${player.bet} créditos\n`;
    }
  }
  
  resultsEmbed.setDescription(description);
  await channel.send({ embeds: [resultsEmbed] });
  
  // Remove the game from active games
  client.activeGames.delete(game.channelId);
  
  // Notify that a new game can be started
  await channel.send('La partida ha terminado. Usa /apostar para iniciar una nueva partida.');
}